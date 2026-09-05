"""
Módulo de Ingestão: API-Football (v3)
Extrai dados detalhados das temporadas 2022-2024 da Série A:
- Fixtures com estatísticas avançadas (chutes dentro/fora da área, posse, faltas, escanteios)
- Eventos de partida (gols, cartões, lances)
Salva os dados brutos em JSON na camada Bronze respeitando a cota diária.
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

HEADERS = {
    "x-apisports-key": API_FOOTBALL_KEY
}

def fetch_api_football(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Erro na requisição: {e.code}")
        body = e.read().decode('utf-8') if e.fp else ""
        print(f"Detalhe: {body[:300]}")
        return {}

def ingest_api_football_samples():
    """
    Ingesta amostras ricas de partidas das temporadas 2023 e 2024 com eventos e estatísticas.
    Usa chamadas otimizadas para economizar requests diários.
    """
    print(">>> Iniciando Ingestão: API-Football (Temporadas 2023/2024)...")
    
    # 1. Obter partidas de rodadas chave da temporada 2023 e 2024
    for season in [2024, 2023]:
        print(f"  Extraindo rodada inicial da temporada {season}...")
        url = f"https://v3.football.api-sports.io/fixtures?league=71&season={season}&round=Regular%20Season%20-%201"
        data = fetch_api_football(url)
        if data and data.get("results", 0) > 0:
            file_path = BRONZE_DIR / f"api_football_fixtures_{season}_r1.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  Salvo: {file_path} ({len(data.get('response', []))} jogos)")
            
            # Para 2 partidas emblemáticas, extrair estatísticas completas e eventos
            sample_fixtures = data.get("response", [])[:2]
            for fix in sample_fixtures:
                fix_id = fix["fixture"]["id"]
                home = fix["teams"]["home"]["name"]
                away = fix["teams"]["away"]["name"]
                print(f"    Extraindo estatísticas e eventos de: {home} x {away} (ID {fix_id})...")
                
                # Stats
                stats_url = f"https://v3.football.api-sports.io/fixtures/statistics?fixture={fix_id}"
                stats_data = fetch_api_football(stats_url)
                if stats_data:
                    with open(BRONZE_DIR / f"api_football_stats_{fix_id}.json", "w", encoding="utf-8") as f:
                        json.dump(stats_data, f, ensure_ascii=False, indent=2)
                
                # Events
                events_url = f"https://v3.football.api-sports.io/fixtures/events?fixture={fix_id}"
                events_data = fetch_api_football(events_url)
                if events_data:
                    with open(BRONZE_DIR / f"api_football_events_{fix_id}.json", "w", encoding="utf-8") as f:
                        json.dump(events_data, f, ensure_ascii=False, indent=2)
                
                time.sleep(0.5)

    print(">>> Ingestão API-Football concluída!\n")

if __name__ == "__main__":
    ingest_api_football_samples()
