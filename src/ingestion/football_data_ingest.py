"""
Módulo de Ingestão: football-data.org
Extrai dados completos da Série A 2026 (Temporada atual):
- Classificação (Standings)
- Partidas Realizadas e Futuras (Fixtures & Matches)
- Histórico de confrontos
Salva os dados brutos em JSON na camada Bronze.
"""
import urllib.request
import urllib.error
import json
from pathlib import Path
import sys

# Adiciona raiz ao path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from config.settings import FOOTBALL_DATA_API_KEY, BRONZE_DIR

HEADERS = {
    "X-Auth-Token": FOOTBALL_DATA_API_KEY
}

def fetch_endpoint(endpoint: str) -> dict:
    url = f"https://api.football-data.org/v4/{endpoint}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Erro ao acessar {url}: {e.code} - {e.reason}")
        body = e.read().decode('utf-8') if e.fp else ""
        print(f"Detalhe: {body[:300]}")
        return {}

def ingest_football_data_2026():
    """Executa a ingestão completa dos endpoints do Brasileirão 2026."""
    print(">>> Iniciando Ingestão: football-data.org (Série A 2026)...")
    
    # 1. Informações da Competição
    print("  [1/3] Extraindo metadados da competição BSA...")
    comp_data = fetch_endpoint("competitions/BSA")
    if comp_data:
        file_path = BRONZE_DIR / "football_data_competition_2026.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(comp_data, f, ensure_ascii=False, indent=2)
        print(f"  Salvo: {file_path}")

    # 2. Tabela de Classificação Atualizada
    print("  [2/3] Extraindo Tabela de Classificação (Standings)...")
    standings_data = fetch_endpoint("competitions/BSA/standings")
    if standings_data:
        file_path = BRONZE_DIR / "football_data_standings_2026.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(standings_data, f, ensure_ascii=False, indent=2)
        print(f"  Salvo: {file_path}")

    # 3. Todas as Partidas (Finalizadas + Agendadas da temporada 2026)
    print("  [3/3] Extraindo todas as 380 partidas (Matches)...")
    matches_data = fetch_endpoint("competitions/BSA/matches")
    if matches_data:
        file_path = BRONZE_DIR / "football_data_matches_2026.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(matches_data, f, ensure_ascii=False, indent=2)
        total_matches = len(matches_data.get("matches", []))
        print(f"  Salvo: {file_path} ({total_matches} partidas)")

    print(">>> Ingestão football-data.org 2026 concluída com sucesso!\n")

if __name__ == "__main__":
    ingest_football_data_2026()
