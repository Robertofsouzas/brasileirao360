"""
Módulo de Ingestão e Processamento: Odds Reais de Mercado (Benchmark).
Extrai cotações pré-jogo mais recentes, converte em probabilidades implícitas
e remove a margem da casa (desmargem/overround) conforme o data_contract.md.
"""
import os
import json
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

GOLD_PATH = BASE_DIR / "data" / "gold" / "dataset_gold.json"
DATA_JS_PATH = BASE_DIR / "assets" / "js" / "data.js"
THE_ODDS_API_KEY = os.getenv("THE_ODDS_API_KEY", "")

# Mapeamento de nomes de clubes para a taxonomia padrão do DW
NAME_NORMALIZATION = {
    "Bragantino": "Red Bull Bragantino",
    "Red Bull Bragantino": "Red Bull Bragantino",
    "Botafogo-RJ": "Botafogo",
    "Botafogo": "Botafogo",
    "Atlético-MG": "Atlético-MG",
    "Atletico-MG": "Atlético-MG",
    "Athletico-PR": "Athletico-PR",
    "Atletico-PR": "Athletico-PR",
    "São Paulo": "São Paulo",
    "Sao Paulo": "São Paulo",
    "Vitória": "Vitória",
    "Vitoria": "Vitória",
    "Grêmio": "Grêmio",
    "Gremio": "Grêmio",
    "Palmeiras": "Palmeiras",
    "Flamengo": "Flamengo",
    "Bahia": "Bahia",
    "Corinthians": "Corinthians",
    "Fluminense": "Fluminense",
    "Vasco da Gama": "Vasco da Gama",
    "Vasco": "Vasco da Gama",
    "Internacional": "Internacional",
    "Santos": "Santos",
    "Cruzeiro": "Cruzeiro",
    "Coritiba": "Coritiba",
    "Mirassol": "Mirassol",
    "Remo": "Remo",
    "Chapecoense": "Chapecoense"
}

def normalize_name(raw_name: str) -> str:
    cleaned = raw_name.strip()
    return NAME_NORMALIZATION.get(cleaned, cleaned)

def calculate_normalized_market_probs(odd_home: float, odd_draw: float, odd_away: float):
    """
    Remove o overround e calcula probabilidades puras de mercado.
    1. Probabilidade bruta = 1 / Odd
    2. Overround = soma das probabilidades brutas
    3. Probabilidade normalizada = Prob bruta / Overround
    """
    if odd_home <= 1.0 or odd_draw <= 1.0 or odd_away <= 1.0:
        return None

    p_raw_home = 1.0 / odd_home
    p_raw_draw = 1.0 / odd_draw
    p_raw_away = 1.0 / odd_away
    overround = p_raw_home + p_raw_draw + p_raw_away

    prob_norm_home = round((p_raw_home / overround) * 100, 1)
    prob_norm_draw = round((p_raw_draw / overround) * 100, 1)
    # Garante fechamento matemático em exatamente 100.0%
    prob_norm_away = round(100.0 - prob_norm_home - prob_norm_draw, 1)

    return {
        "odd_mandante": round(odd_home, 2),
        "odd_empate": round(odd_draw, 2),
        "odd_visitante": round(odd_away, 2),
        "prob_bruta_mandante": round(p_raw_home, 4),
        "prob_bruta_empate": round(p_raw_draw, 4),
        "prob_bruta_visitante": round(p_raw_away, 4),
        "overround_pct": round(overround * 100, 2),
        "prob_mercado_mandante_pct": prob_norm_home,
        "prob_mercado_empate_pct": prob_norm_draw,
        "prob_mercado_visitante_pct": prob_norm_away
    }

def fetch_betano_odds():
    """Busca cotações pré-jogo mais recentes da API oficial da Betano (Série A)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    url = "https://br.betano.com/api/sport/futebol/brasil/brasileirao-serie-a/10016/"
    try:
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code != 200:
            print(f"Aviso Betano API: status {resp.status_code}")
            return {}
        
        data = resp.json()
        events = data.get("data", {}).get("blocks", [{}])[0].get("events", [])
        print(f"Betano retornou {len(events)} eventos.")
        
        odds_by_match = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        for ev in events:
            raw_name = ev.get("name", "")
            parts = [p.strip() for p in raw_name.split(" - ")]
            if len(parts) != 2:
                continue

            home_team = normalize_name(parts[0])
            away_team = normalize_name(parts[1])

            prices = {}
            for m in ev.get("markets", []):
                if m.get("name") == "Resultado Final":
                    for s in m.get("selections", []):
                        prices[s.get("name")] = float(s.get("price", 0))

            if "1" in prices and "X" in prices and "2" in prices:
                o_h = prices["1"]
                o_d = prices["X"]
                o_a = prices["2"]
                calc = calculate_normalized_market_probs(o_h, o_d, o_a)
                if calc:
                    calc["casa_apostas"] = "Betano"
                    calc["odds_captured_at"] = now_iso
                    calc["mandante"] = home_team
                    calc["visitante"] = away_team
                    key = f"{home_team}__vs__{away_team}"
                    odds_by_match[key] = calc

        return odds_by_match
    except Exception as e:
        print(f"Erro ao buscar odds Betano: {e}")
        return {}

def fetch_the_odds_api(api_key: str):
    """Busca odds via The Odds API caso a chave esteja presente no .env."""
    if not api_key:
        return {}
    url = f"https://api.the-odds-api.com/v4/sports/soccer_brazil_campeonato/odds/?regions=eu&markets=h2h&apiKey={api_key}"
    try:
        resp = requests.get(url, timeout=12)
        if resp.status_code != 200:
            print(f"Aviso The Odds API: {resp.status_code}")
            return {}
        events = resp.json()
        now_iso = datetime.now(timezone.utc).isoformat()
        odds_by_match = {}
        for ev in events:
            home = normalize_name(ev.get("home_team", ""))
            away = normalize_name(ev.get("away_team", ""))
            bookmakers = ev.get("bookmakers", [])
            if not bookmakers:
                continue
            bm = bookmakers[0]
            bm_name = bm.get("title", "The Odds API")
            markets = bm.get("markets", [])
            for m in markets:
                if m.get("key") == "h2h":
                    outcomes = {o.get("name"): float(o.get("price", 0)) for o in m.get("outcomes", [])}
                    o_h = outcomes.get(ev.get("home_team"), 0)
                    o_a = outcomes.get(ev.get("away_team"), 0)
                    o_d = outcomes.get("Draw", 0)
                    if o_h > 0 and o_d > 0 and o_a > 0:
                        calc = calculate_normalized_market_probs(o_h, o_d, o_a)
                        if calc:
                            calc["casa_apostas"] = bm_name
                            calc["odds_captured_at"] = now_iso
                            calc["mandante"] = home
                            calc["visitante"] = away
                            odds_by_match[f"{home}__vs__{away}"] = calc
        return odds_by_match
    except Exception as e:
        print(f"Erro ao buscar The Odds API: {e}")
        return {}

def run_odds_pipeline():
    print(">>> Iniciando Pipeline de Odds Reais de Mercado...")
    
    # 1. Tenta The Odds API se configurada; caso contrário usa o feed oficial Betano
    odds_data = {}
    if THE_ODDS_API_KEY:
        print("Buscando odds via The Odds API...")
        odds_data = fetch_the_odds_api(THE_ODDS_API_KEY)

    if not odds_data:
        print("Buscando cotações pré-jogo em tempo real via Betano...")
        odds_data = fetch_betano_odds()

    print(f"Total de confrontos mapeados com odds: {len(odds_data)}")

    # 2. Carrega dataset_gold.json
    with open(GOLD_PATH, "r", encoding="utf-8") as f:
        gold = json.load(f)

    # 3. Adiciona a tabela consolidada de odds de mercado
    gold["odds_mercado_rodada"] = odds_data

    # 4. Vincula as odds diretamente nos registros de fato_partidas_todas
    partidas = gold.get("fato_partidas_todas", [])
    count_matched = 0
    for p in partidas:
        key = f"{p.get('mandante')}__vs__{p.get('visitante')}"
        if key in odds_data:
            p["odds_mercado"] = odds_data[key]
            count_matched += 1

    print(f"Partidas atualizadas com odds no Star Schema: {count_matched}")

    # 5. Salva dataset_gold.json
    with open(GOLD_PATH, "w", encoding="utf-8") as f:
        json.dump(gold, f, ensure_ascii=False, indent=2)

    # 6. Salva assets/js/data.js
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write("// Dataset Gold consolidado para o Frontend\n")
        f.write(f"window.BRASILEIRAO_DATA = {json.dumps(gold, ensure_ascii=False, indent=2)};\n")

    print(">>> Pipeline de Odds concluído com sucesso!")

if __name__ == "__main__":
    run_odds_pipeline()
