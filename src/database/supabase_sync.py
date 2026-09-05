"""
Sincronizador Supabase:
Carrega os dados processados da camada Gold no Supabase via REST API / PostgREST.
Insere em:
- dim_clubes
- dim_calendario
- fato_partidas
- fato_eventos
"""
import urllib.request
import urllib.error
import json
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from config.settings import SUPABASE_URL, SUPABASE_ANON_KEY, GOLD_DIR

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def post_to_supabase(table: str, records: list) -> bool:
    """Envia um lote de registros para a tabela no Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(records).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"  [OK] Inserido com sucesso em '{table}' ({len(records)} registros) - Status {resp.status}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.fp else ""
        print(f"  [AVISO] Tabela '{table}': Status {e.code}")
        print(f"  Resposta Supabase: {body[:300]}")
        return False
    except Exception as e:
        print(f"  [ERRO] Falha ao conectar ao Supabase: {e}")
        return False

def sync_gold_to_supabase():
    print("=" * 70)
    print("SINCRONIZANDO DATASET GOLD COM SUPABASE")
    print(f"URL: {SUPABASE_URL}")
    print("=" * 70)

    gold_file = GOLD_DIR / "dataset_gold.json"
    if not gold_file.exists():
        print("Dataset gold não encontrado. Execute o build_dataset.py primeiro.")
        return

    with open(gold_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Clubes
    clubes = []
    for c in data.get("dim_clubes", []):
        clubes.append({
            "clube_id": c["clube_id"],
            "nome": c["nome_oficial"],
            "sigla": c["sigla"],
            "nome_popular": c["nome_popular"],
            "escudo_url": c["escudo_url"],
            "cidade": c["cidade"],
            "estado": c["estado"],
            "cor_primaria": c["cor_primaria"],
            "cor_secundaria": c["cor_secundaria"],
            "football_data_id": c["football_data_id"],
            "api_football_id": c["api_football_id"]
        })

    print("\n1. Sincronizando dim_clubes...")
    post_to_supabase("dim_clubes", clubes)

    # 2. Calendário
    print("\n2. Sincronizando dim_calendario...")
    calendario = data.get("dim_calendario", [])
    if calendario:
        post_to_supabase("dim_calendario", calendario[:50])

    # 3. Partidas
    print("\n3. Sincronizando fato_partidas...")
    partidas = []
    partidas_list = data.get("fato_partidas_todas") or data.get("fato_partidas_recentes", [])
    for p in partidas_list:
        partidas.append({
            "partida_id": p["partida_id"],
            "calendario_id": p["calendario_id"],
            "clube_mandante_id": p["clube_mandante_id"],
            "clube_visitante_id": p["clube_visitante_id"],
            "gols_mandante": p["gols_mandante"],
            "gols_visitante": p["gols_visitante"],
            "posse_mandante": p["posse_mandante"],
            "posse_visitante": p["posse_visitante"],
            "chutes_mandante": p["chutes_mandante"],
            "chutes_visitante": p["chutes_visitante"],
            "xg_mandante": p["xg_mandante"],
            "xg_visitante": p["xg_visitante"],
            "resultado": p["resultado"],
            "status": p["status"],
            "fonte": p["fonte"],
            "api_fixture_id": p["api_fixture_id"]
        })
    if partidas:
        post_to_supabase("fato_partidas", partidas)

    print("\n>>> Sincronização concluída!")

if __name__ == "__main__":
    sync_gold_to_supabase()
