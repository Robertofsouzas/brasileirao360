"""
Resolve IDs e fotos fidedignas oficiais para os 82 atletas do Brasileirão 2024/2026.
"""
import os
import json
import sys
import time
import requests
import dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(ROOT))
dotenv.load_dotenv(ROOT / ".env")

API_KEY = os.getenv("API_FOOTBALL_KEY")
HEADERS = {"x-apisports-key": API_KEY}
BASE_URL = "https://v3.football.api-sports.io"

from src.models.clubes_metadata import CLUBES_METADATA

VERIFIED_CACHE_FILE = ROOT / "data" / "raw" / "player_photos_verified.json"

def get_search_keyword(name: str) -> str:
    # Retorna o melhor termo de busca para a API
    mapping = {
        "Raphael Veiga": "Veiga",
        "José Manuel López": "Lopez",
        "Estêvão": "Estevao",
        "Gustavo Gómez": "Gomez",
        "Weverton": "Weverton",
        "Aníbal Moreno": "Moreno",
        "Joaquín Piquerez": "Piquerez",
        "Pedro": "Pedro",
        "Giorgian De Arrascaeta": "Arrascaeta",
        "Gerson": "Gerson",
        "Nicolás De La Cruz": "Cruz",
        "Léo Ortiz": "Ortiz",
        "Agustín Rossi": "Rossi",
        "Ayrton Lucas": "Ayrton",
        "Luiz Henrique": "Henrique",
        "Igor Jesus": "Jesus",
        "Thiago Almada": "Almada",
        "Marlon Freitas": "Freitas",
        "John": "John",
        "Hulk": "Hulk",
        "Paulinho": "Paulinho",
        "Gustavo Scarpa": "Scarpa",
        "Guilherme Arana": "Arana",
        "Everson": "Everson",
        "Jonathan Calleri": "Calleri",
        "Lucas Moura": "Moura",
        "Luciano": "Luciano",
        "Alisson": "Alisson",
        "Rafael": "Rafael",
        "Yuri Alberto": "Alberto",
        "Memphis Depay": "Depay",
        "Rodrigo Garro": "Garro",
        "Hugo Souza": "Souza",
        "Pablo Vegetti": "Vegetti",
        "Dimitri Payet": "Payet",
        "Lucas Piton": "Piton",
        "Léo Jardim": "Jardim",
        "Matheus Pereira": "Pereira",
        "Gabriel Veron": "Veron",
        "Kaio Jorge": "Jorge",
        "Cássio": "Cassio",
        "Germán Cano": "Cano",
        "Jhon Arias": "Arias",
        "Paulo Henrique Ganso": "Ganso",
        "Thiago Silva": "Silva",
        "Fábio": "Fabio",
        "Everton Ribeiro": "Ribeiro",
        "Thaciano": "Thaciano",
        "Jean Lucas": "Lucas",
        "Marcos Felipe": "Felipe",
        "Juan Martín Lucero": "Lucero",
        "Yago Pikachu": "Pikachu",
        "João Ricardo": "Ricardo",
        "Rafael Borré": "Borre",
        "Alan Patrick": "Patrick",
        "Sergio Rochet": "Rochet",
        "Martin Braithwaite": "Braithwaite",
        "Franco Cristaldo": "Cristaldo",
        "Yeferson Soteldo": "Soteldo",
        "Agustín Marchesín": "Marchesin",
        "Pablo": "Pablo",
        "Agustín Canobbio": "Canobbio",
        "Fernandinho": "Fernandinho",
        "Mycael": "Mycael",
        "Eduardo Sasha": "Sasha",
        "Helinho": "Helinho",
        "Cleiton": "Cleiton",
        "Yannick Bolasie": "Bolasie",
        "Matheusinho": "Matheusinho",
        "Gustavo": "Gustavo",
        "Nenê": "Nene",
        "Lucas Barbosa": "Barbosa",
        "Gabriel": "Gabriel",
        "Alerrandro": "Alerrandro",
        "Lucas Arcanjo": "Arcanjo",
        "Luiz Fernando": "Fernando",
        "Shaylon": "Shaylon",
        "Ronaldo": "Ronaldo",
        "Isidro Pitta": "Pitta",
        "Clayson": "Clayson",
        "Walter": "Walter"
    }
    return mapping.get(name, name.split()[-1])

def run():
    verified = {}
    if VERIFIED_CACHE_FILE.exists():
        with open(VERIFIED_CACHE_FILE, "r", encoding="utf-8") as f:
            verified = json.load(f)

    # Lista dos 20 clubes da Série A
    serie_a_clubs = list(CLUBES_METADATA.keys())[:20]
    total_needed = sum(len(CLUBES_METADATA[c]["jogadores"]) for c in serie_a_clubs)
    print(f"Total de atletas para verificar: {total_needed}")

    for club_name in serie_a_clubs:
        club_data = CLUBES_METADATA[club_name]
        for j in club_data["jogadores"]:
            name = j["nome"]
            cache_key = f"{club_name}:{name}"
            if cache_key in verified and verified[cache_key].get("foto_url"):
                print(f"[CACHE] {cache_key} -> {verified[cache_key]['foto_url']}")
                continue

            keyword = get_search_keyword(name)
            print(f"Pesquisando API: {name} (Clube: {club_name}, Keyword: {keyword})...")
            try:
                # 1. Tenta na Série A 2024
                params = {"search": keyword, "league": 71, "season": 2024}
                r = requests.get(f"{BASE_URL}/players", headers=HEADERS, params=params, timeout=10)
                items = r.json().get("response", [])
                
                # Se não achar na Série A 2024 (ex: transferências internacionais recentes como Depay, Almada, Braithwaite)
                if not items:
                    r2 = requests.get(f"{BASE_URL}/players", headers=HEADERS, params={"search": keyword}, timeout=10)
                    items = r2.json().get("response", [])

                chosen = None
                for item in items:
                    p = item["player"]
                    p_full = f"{p.get('firstname', '')} {p.get('lastname', '')} {p.get('name', '')}".lower()
                    target_lower = name.lower()
                    
                    # Checa se o nome bate
                    stats = item.get("statistics", [])
                    teams = [s.get("team", {}).get("name", "").lower() for s in stats]
                    
                    if club_name.lower() in "".join(teams) or target_lower in p_full or any(part in p_full for part in target_lower.split() if len(part) > 3):
                        chosen = p
                        if club_name.lower() in "".join(teams):
                            break # Melhor match possível
                
                if not chosen and items:
                    chosen = items[0]["player"]

                if chosen:
                    verified[cache_key] = {
                        "player_id": chosen["id"],
                        "name": chosen["name"],
                        "foto_url": chosen["photo"],
                        "club": club_name
                    }
                    print(f"  ==> MATCH: {chosen['name']} (ID: {chosen['id']}) - {chosen['photo']}")
                else:
                    print(f"  [AVISO] Nenhum resultado para {name}")

                # Salva a cada busca
                with open(VERIFIED_CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(verified, f, indent=2, ensure_ascii=False)

                time.sleep(0.5)
            except Exception as e:
                print(f"  Erro na requisição para {name}: {e}")

    print(f"\nConcluído! Total mapeado: {len(verified)}")

if __name__ == "__main__":
    run()
