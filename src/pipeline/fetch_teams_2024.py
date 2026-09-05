import os
import requests
import dotenv
import json

dotenv.load_dotenv()
key = os.getenv("API_FOOTBALL_KEY")
headers = {"x-apisports-key": key}

teams = [124, 130, 794, 152, 118, 120, 140]
results = {}

for tid in teams:
    r = requests.get("https://v3.football.api-sports.io/players", headers=headers, params={"team": tid, "season": 2024})
    items = r.json().get("response", [])
    print(f"=== Team {tid} ({len(items)} players) ===")
    team_players = []
    for it in items:
        p = it["player"]
        print(f"  {p['id']} | {p['name']} | {p['photo']}")
        team_players.append({
            "id": p["id"],
            "name": p["name"],
            "photo": p["photo"]
        })
    results[str(tid)] = team_players

with open("data/raw/teams_2024_players.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Done saving teams 2024 players.")
