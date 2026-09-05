"""
Script para sincronizar e validar fotos 100% fidedignas dos jogadores da Série A
utilizando os elencos e dados oficiais da API-Football (api-sports.io).
"""
import os
import json
import re
import unicodedata
import requests
import dotenv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(ROOT))

dotenv.load_dotenv(ROOT / ".env")

API_KEY = os.getenv("API_FOOTBALL_KEY")
HEADERS = {"x-apisports-key": API_KEY}
BASE_URL = "https://v3.football.api-sports.io"

from src.models.clubes_metadata import CLUBES_METADATA

def normalize_str(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('utf-8')
    return re.sub(r'[^a-zA-Z0-9]', '', s).lower()

def main():
    print(f"Iniciando verificação de fotos fidedignas...")
    cache_path = ROOT / "data" / "raw" / "api_sports_squads.json"
    cache_path.parent.mkdir(parents=True, exist_ok=True)

    squads_by_team = {}
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                squads_by_team = json.load(f)
            print(f"Carregado cache existente com {len(squads_by_team)} clubes.")
        except Exception as e:
            print(f"Erro lendo cache: {e}")

    # Coleta elencos dos clubes
    for club_name, meta in CLUBES_METADATA.items():
        team_id = meta.get("api_football_id")
        if not team_id:
            continue
        
        str_team_id = str(team_id)
        if str_team_id not in squads_by_team:
            print(f"Buscando elenco oficial: {club_name} (Team ID: {team_id})...")
            try:
                r = requests.get(f"{BASE_URL}/players/squads", headers=HEADERS, params={"team": team_id}, timeout=10)
                if r.status_code == 200:
                    res = r.json().get("response", [])
                    if res:
                        players_list = res[0].get("players", [])
                        squads_by_team[str_team_id] = players_list
                        print(f"  -> {len(players_list)} atletas obtidos para {club_name}")
                    else:
                        print(f"  -> Resposta vazia para {club_name}")
                else:
                    print(f"  -> Erro HTTP {r.status_code}: {r.text[:100]}")
            except Exception as ex:
                print(f"  -> Exceção ao buscar {club_name}: {ex}")

    # Salva cache atualizado dos elencos
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(squads_by_team, f, indent=2, ensure_ascii=False)

    print("\n--- MAPEANDO JOGADORES COM FOTOS OFICIAIS ---")
    verified_map = {}
    missing_players = []

    for club_name, meta in CLUBES_METADATA.items():
        team_id = str(meta.get("api_football_id"))
        squad = squads_by_team.get(team_id, [])
        
        for j in meta["jogadores"]:
            target_name = j["nome"]
            norm_target = normalize_str(target_name)
            target_parts = [p.lower() for p in target_name.split()]
            
            matched = None
            
            # 1. Match exato ou quase exato no elenco do time
            for sp in squad:
                sp_name = sp.get("name", "")
                norm_sp = normalize_str(sp_name)
                
                # Match por igualdade ou substring
                if norm_target == norm_sp or norm_target in norm_sp or norm_sp in norm_target:
                    matched = sp
                    break
                
                # Match se último nome ou nome composto bate
                sp_parts = [p.lower() for p in sp_name.split()]
                if any(p in sp_parts for p in target_parts if len(p) > 3):
                    # Checa se posição ou número coincide
                    if j.get("numero") and sp.get("number") == j["numero"]:
                        matched = sp
                        break
                    if not matched:
                        matched = sp

            if matched:
                verified_map[target_name] = {
                    "api_id": matched["id"],
                    "official_name": matched["name"],
                    "foto_url": matched["photo"],
                    "team": club_name
                }
                print(f"[MATCH SQUAD] {club_name}: {target_name} -> {matched['name']} (ID: {matched['id']}) | {matched['photo']}")
            else:
                missing_players.append((club_name, target_name, meta.get("api_football_id"), j))

    print(f"\nTotal com match no elenco: {len(verified_map)}")
    print(f"Total pendente para busca direta: {len(missing_players)}")

    # Para os não encontrados no elenco imediato, faz busca pontual
    for club_name, target_name, team_id, j in missing_players:
        print(f"Buscando jogador individual: {target_name} ({club_name})...")
        # Usa o último ou primeiro nome significativo para buscar
        search_query = target_name.split()[-1] if len(target_name.split()[-1]) > 3 else target_name
        try:
            r = requests.get(f"{BASE_URL}/players", headers=HEADERS, params={"search": search_query, "league": 71, "season": 2024}, timeout=10)
            data = r.json()
            players = data.get("response", [])
            
            best = None
            if players:
                # Procura jogador do clube ou com nome similar
                for item in players:
                    p_info = item["player"]
                    stats = item.get("statistics", [])
                    teams = [s.get("team", {}).get("name", "").lower() for s in stats]
                    p_full = f"{p_info.get('firstname', '')} {p_info.get('lastname', '')}"
                    
                    if normalize_str(club_name) in "".join(teams) or normalize_str(target_name) in normalize_str(p_full):
                        best = p_info
                        break
                if not best:
                    best = players[0]["player"]
            
            if best:
                verified_map[target_name] = {
                    "api_id": best["id"],
                    "official_name": best["name"],
                    "foto_url": best["photo"],
                    "team": club_name
                }
                print(f"[MATCH BUSCA] {target_name} -> {best['name']} (ID: {best['id']}) | {best['photo']}")
            else:
                print(f"[SEM MATCH] {target_name} ({club_name})")
        except Exception as e:
            print(f"Erro buscando {target_name}: {e}")

    # Salva mapeamento final
    out_map = ROOT / "data" / "raw" / "player_photos_verified.json"
    with open(out_map, "w", encoding="utf-8") as f:
        json.dump(verified_map, f, indent=2, ensure_ascii=False)
    print(f"\nSalvo mapeamento verificado com {len(verified_map)} jogadores em {out_map}")

if __name__ == "__main__":
    main()
