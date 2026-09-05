import json
import sys
import unicodedata
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(ROOT))

from src.models.clubes_metadata import CLUBES_METADATA

def norm(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('utf-8')
    return re.sub(r'[^a-zA-Z0-9]', '', s).lower()

def main():
    with open(ROOT / "data" / "raw" / "api_sports_squads.json", "r", encoding="utf-8") as f:
        squads = json.load(f)

    # Flatten
    all_squad_players = []
    for tid, plist in squads.items():
        for p in plist:
            all_squad_players.append((tid, p))

    # Also load previous verified map if any
    verified_file = ROOT / "data" / "raw" / "player_photos_verified.json"
    verified_data = {}
    if verified_file.exists():
        with open(verified_file, "r", encoding="utf-8") as f:
            verified_data = json.load(f)

    serie_a = list(CLUBES_METADATA.keys())[:20]
    results = {}
    missing = []

    for c in serie_a:
        for j in CLUBES_METADATA[c]["jogadores"]:
            name = j["nome"]
            norm_name = norm(name)
            parts = [norm(x) for x in name.split() if len(x) >= 3]
            last_part = parts[-1] if parts else norm_name

            found = None

            # 1. Checa se o clube específico tem o jogador
            team_id = str(CLUBES_METADATA[c].get("api_football_id"))
            club_squad = squads.get(team_id, [])
            for p in club_squad:
                pn = norm(p["name"])
                if norm_name == pn or norm_name in pn or pn in norm_name:
                    found = p
                    break
                if last_part in pn and any(x in pn for x in parts[:-1]):
                    found = p
                    break
                if len(parts) == 1 and parts[0] == pn:
                    found = p
                    break

            # 2. Se não achou no próprio clube, checa no cache geral de todos os elencos
            if not found:
                for tid, p in all_squad_players:
                    pn = norm(p["name"])
                    if norm_name == pn or norm_name in pn or pn in norm_name:
                        found = p
                        break
                    if last_part in pn and any(x in pn for x in parts[:-1]):
                        found = p
                        break
                    if len(parts) == 1 and parts[0] == pn:
                        found = p
                        break

            # 3. Se ainda não achou, checa verified_data (da busca direta da API)
            if not found:
                for vk, v in verified_data.items():
                    if norm(vk) == norm_name or vk == f"{c}:{name}":
                        found = {
                            "id": v.get("player_id", v.get("api_id")),
                            "name": v.get("name", v.get("official_name")),
                            "photo": v.get("foto_url")
                        }
                        break

            if found:
                results[f"{c}:{name}"] = {
                    "id": found["id"],
                    "name": found["name"],
                    "photo": found["photo"],
                    "original_club": c,
                    "target_name": name
                }
            else:
                missing.append((c, name))

    print(f"Total Série A: {sum(len(CLUBES_METADATA[c]['jogadores']) for c in serie_a)}")
    print(f"Encontrados com precisão: {len(results)}")
    print(f"Faltantes: {len(missing)}")
    if missing:
        print("\nLista de Faltantes:")
        for c, n in missing:
            print(f"  - {c}: {n}")

    # Salva mapeamento completo
    with open(ROOT / "data" / "raw" / "serie_a_verified_photos.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
