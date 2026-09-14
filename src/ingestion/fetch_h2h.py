"""
Módulo de Ingestão de Histórico de Confrontos (Head-to-Head - H2H)
Fonte: API-Football (v3)

Diretrizes de Consumo:
- Plano Free (limite 100 requisições/dia e máx 10 requisições/minuto).
- Idempotência total: antes de qualquer requisição externa, verifica se o arquivo
  já existe na camada Bronze. Se existir, reutiliza o dado local (0 novas requisições).
- Pausa de 6.5s entre chamadas para garantir cumprimento do limite por minuto.
- Proteção de cota: rastreia uso diário e interrompe graciosamente se atingir o teto seguro.
"""

import urllib.request
import urllib.error
import json
import time
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from config.settings import API_FOOTBALL_KEY, BRONZE_DIR
from src.models.clubes_metadata import CLUBES_METADATA

BRONZE_H2H_DIR = BRONZE_DIR / "h2h"
BRONZE_STATS_DIR = BRONZE_DIR / "h2h_stats"

for d in [BRONZE_H2H_DIR, BRONZE_STATS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "x-apisports-key": API_FOOTBALL_KEY
}

SESSION_REQUESTS = 0
MAX_SESSION_REQUESTS = 25  # Trava máxima por execução
SAFETY_DAILY_LIMIT = 85    # Limite diário conservador (abaixo dos 100 permitidos)
REQUEST_DELAY_SECONDS = 6.5 # Garante taxa < 10 req/min

def fetch_api(url: str, retries: int = 2) -> dict:
    """Executa requisição à API-Football com controle de erros, headers e rate limit."""
    global SESSION_REQUESTS

    for attempt in range(retries):
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            SESSION_REQUESTS += 1
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                # Checa rateLimit em json
                if data.get("errors") and "rateLimit" in str(data.get("errors")):
                    print(f"  [RATE LIMIT ATINGIDO] Aguardando 15s antes de retentar...")
                    time.sleep(15)
                    continue
                return data
        except urllib.error.HTTPError as e:
            print(f"  [API ERROR] HTTP {e.code} ao acessar {url}")
            body = e.read().decode("utf-8") if e.fp else ""
            if e.code == 429:
                print(f"  [RATE LIMIT 429] Aguardando 15s...")
                time.sleep(15)
                continue
            return {}
        except Exception as ex:
            print(f"  [REQ ERROR] Falha de conexão: {ex}")
            return {}
    return {}

def check_api_status() -> dict:
    """Consulta o status atual da conta na API-Football."""
    print(">>> Verificando status e cota da API-Football...")
    res = fetch_api("https://v3.football.api-sports.io/status")
    time.sleep(REQUEST_DELAY_SECONDS)
    if res and res.get("response"):
        acc = res["response"].get("account", {})
        sub = res["response"].get("subscription", {})
        reqs = res["response"].get("requests", {})
        print(f"  Conta: {acc.get('email')} | Plano: {sub.get('plan')}")
        print(f"  Requisições Hoje: {reqs.get('current', 0)} / {reqs.get('limit_day', 100)}")
        return reqs
    return {}

def get_h2h_bronze_path(id_a: int, id_b: int) -> Path:
    min_id, max_id = sorted([id_a, id_b])
    return BRONZE_H2H_DIR / f"h2h_{min_id}_{max_id}.json"

def get_stats_bronze_path(fixture_id: int) -> Path:
    return BRONZE_STATS_DIR / f"stats_{fixture_id}.json"

def ingest_h2h_pair(team_a_name: str, team_b_name: str, fetch_stats: bool = True, max_stats_per_pair: int = 1) -> dict:
    """
    Coleta o histórico H2H entre dois clubes de forma idempotente e segura.
    Retorna os dados brutos (seja lidos do cache ou da API).
    """
    global SESSION_REQUESTS

    meta_a = CLUBES_METADATA.get(team_a_name, {})
    meta_b = CLUBES_METADATA.get(team_b_name, {})

    id_a = meta_a.get("api_football_id")
    id_b = meta_b.get("api_football_id")

    if not id_a or not id_b:
        print(f"  [AVISO] IDs da API-Football não encontrados para {team_a_name} ({id_a}) x {team_b_name} ({id_b})")
        return {}

    bronze_file = get_h2h_bronze_path(id_a, id_b)

    # 1. Checa cache Bronze
    if bronze_file.exists():
        print(f"  [CACHE LOCAL] H2H {team_a_name} x {team_b_name} encontrado em disco: {bronze_file.name}")
        with open(bronze_file, "r", encoding="utf-8") as f:
            h2h_data = json.load(f)
    else:
        if SESSION_REQUESTS >= MAX_SESSION_REQUESTS:
            print(f"  [TRAVA SEGURANÇA] Limite de {MAX_SESSION_REQUESTS} requisições da sessão atingido. Pulando busca remota.")
            return {}

        print(f"  [API FETCH] Consultando H2H para {team_a_name} (ID {id_a}) x {team_b_name} (ID {id_b})...")
        url = f"https://v3.football.api-sports.io/fixtures/headtohead?h2h={id_a}-{id_b}"
        h2h_data = fetch_api(url)
        time.sleep(REQUEST_DELAY_SECONDS)

        if h2h_data and "response" in h2h_data:
            with open(bronze_file, "w", encoding="utf-8") as f:
                json.dump(h2h_data, f, ensure_ascii=False, indent=2)
            print(f"  [SALVO BRONZE] {bronze_file.name} com {len(h2h_data.get('response', []))} jogos encontrados.")
        else:
            print(f"  [AVISO] Resposta vazia ou com erro para {team_a_name} x {team_b_name}")
            return {}

    # 2. Ingestão de Estatísticas para partida mais recente se ainda não existir
    if fetch_stats and h2h_data.get("response"):
        fixtures = h2h_data["response"]
        finished = [
            f for f in fixtures
            if f.get("goals", {}).get("home") is not None and f.get("fixture", {}).get("status", {}).get("short") in ["FT", "AET", "PEN"]
        ]
        finished.sort(key=lambda x: x.get("fixture", {}).get("date", ""), reverse=True)

        stats_collected = 0
        for fix in finished:
            if stats_collected >= max_stats_per_pair:
                break

            fix_id = fix.get("fixture", {}).get("id")
            if not fix_id:
                continue

            stats_file = get_stats_bronze_path(fix_id)
            if stats_file.exists():
                stats_collected += 1
                continue

            if SESSION_REQUESTS >= MAX_SESSION_REQUESTS:
                print(f"  [TRAVA SEGURANÇA] Limite de requisições da sessão atingido durante estatísticas.")
                break

            print(f"    [API STATS] Coletando estatísticas da partida {fix_id} ({fix.get('fixture', {}).get('date', '')[:10]})...")
            stats_url = f"https://v3.football.api-sports.io/fixtures/statistics?fixture={fix_id}"
            stats_data = fetch_api(stats_url)
            time.sleep(REQUEST_DELAY_SECONDS)

            if stats_data and stats_data.get("response"):
                with open(stats_file, "w", encoding="utf-8") as f:
                    json.dump(stats_data, f, ensure_ascii=False, indent=2)
                stats_collected += 1

    return h2h_data

def ingest_priority_matchups():
    print("=" * 70)
    print("INICIANDO PIPELINE DE INGESTÃO H2H (API-FOOTBALL BRONZE)")
    print("=" * 70)

    # 1. Verifica cota
    req_status = check_api_status()
    current_reqs = req_status.get("current", 0)
    if current_reqs >= SAFETY_DAILY_LIMIT:
        print(f"[ALERTA CRÍTICO] Cota diária quase esgotada ({current_reqs}/100). Abortando requisições remotas para preservar limite.")
        return

    # 2. Lista de confrontos prioritários
    priority_pairs = [
        ("Atlético-MG", "Chapecoense"),
        ("Palmeiras", "Flamengo"),
        ("Flamengo", "Vasco da Gama"),
        ("Palmeiras", "São Paulo"),
        ("Flamengo", "Corinthians"),
        ("Coritiba", "Athletico-PR"),
        ("Atlético-MG", "Fluminense"),
        ("Grêmio", "Vasco da Gama"),
        ("Chapecoense", "Internacional"),
        ("Botafogo", "Red Bull Bragantino"),
        ("Santos", "Cruzeiro"),
        ("Mirassol", "Vitória"),
        ("Bahia", "Remo")
    ]

    print(f"\nProcessando {len(priority_pairs)} confrontos prioritários...\n")

    for team_a, team_b in priority_pairs:
        print(f"--- Confronto: {team_a} × {team_b} ---")
        ingest_h2h_pair(team_a, team_b, fetch_stats=True, max_stats_per_pair=1)

    print("\n" + "=" * 70)
    print(f"INGESTÃO CONCLUÍDA! Requisições feitas nesta sessão: {SESSION_REQUESTS}")
    print("=" * 70)

if __name__ == "__main__":
    ingest_priority_matchups()
