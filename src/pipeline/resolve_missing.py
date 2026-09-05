import os
import requests
import dotenv
import json

dotenv.load_dotenv()
key = os.getenv("API_FOOTBALL_KEY")
headers = {"x-apisports-key": key}

missing_searches = [
    ("Jhon Arias", "Andrade"),
    ("Franco Cristaldo", "Franco"),
    ("Agustín Marchesín", "Federico"),
    ("Fernandinho", "Roza"),
    ("Helinho", "Junio"),
    ("Nenê", "Carvalho"),
    ("Thaciano", "Mickael"),
    ("Igor Jesus", "Cruz"),
    ("Matheusinho", "Cardoso")
]

results = {}
for full_name, term in missing_searches:
    r = requests.get("https://v3.football.api-sports.io/players", headers=headers, params={"search": term, "league": 71, "season": 2024})
    items = r.json().get("response", [])
    if not items:
        # Tenta sem filtro de liga
        r2 = requests.get("https://v3.football.api-sports.io/players", headers=headers, params={"search": term})
        items = r2.json().get("response", [])

    if items:
        p = items[0]["player"]
        results[full_name] = {
            "id": p["id"],
            "name": p["name"],
            "photo": p["photo"]
        }
        print(f"[FOUND] {full_name} -> {p['name']} (ID: {p['id']}) | {p['photo']}")
    else:
        print(f"[NOT FOUND] {full_name}")

with open("data/raw/resolved_missing_players.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Done. Saved resolved missing players.")
