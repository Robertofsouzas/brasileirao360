"""
Módulo de Processamento e Transformação de Histórico de Confrontos (H2H)
Camadas: Bronze -> Silver -> Gold

Responsabilidades:
1. Inspeciona e agrega todos os arquivos brutos de H2H em data/bronze/h2h/
2. Inspeciona e correlaciona estatísticas detalhadas de data/bronze/h2h_stats/ e data/bronze/
3. Deduplica e normaliza na camada Silver (data/silver/silver_h2h_matches.json) utilizando fixture_id único
4. Consolida na camada Gold (data/gold/gold_historico_confrontos.json):
   - Mapeia por chave de confronto direta (Mandante__Visitante) e canônica (TimeA__TimeB)
   - Agrega resumos de vitórias, empates, derrotas e saldo de gols
   - Permite alternância de escopo: "Brasileirão" vs "Todas as Competições"
   - Calcula médias estatísticas apenas para partidas que possuem dados reais (sem inventar dados)
   - Registra número exato de jogos utilizados nas médias (transparência metodológica)
"""

import json
import glob
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from config.settings import BRONZE_DIR, SILVER_DIR, GOLD_DIR
from src.models.clubes_metadata import CLUBES_METADATA, normalizar_nome_clube

BRONZE_H2H_DIR = BRONZE_DIR / "h2h"
BRONZE_STATS_DIR = BRONZE_DIR / "h2h_stats"

def get_club_by_api_id(api_id: int):
    """Busca o nome popular do clube a partir do api_football_id."""
    for nome, meta in CLUBES_METADATA.items():
        if meta.get("api_football_id") == api_id:
            return nome
    return None

def normalize_team_name(raw_name: str, api_id: int = None) -> str:
    """Normaliza o nome do clube pelo ID oficial ou pelo nome da API."""
    if api_id:
        club = get_club_by_api_id(api_id)
        if club:
            return club

    # Mapeamentos diretos conhecidos da API-Football
    name_map = {
        "Atletico-MG": "Atlético-MG",
        "Chapecoense-sc": "Chapecoense",
        "Chapecoense-SC": "Chapecoense",
        "Chapecoense": "Chapecoense",
        "Atletico Paranaense": "Athletico-PR",
        "Sao Paulo": "São Paulo",
        "Gremio": "Grêmio",
        "Criciuma": "Criciúma",
        "Vitoria": "Vitória",
        "Atletico Goianiense": "Atlético-GO",
        "Cuiaba": "Cuiabá",
        "RB Bragantino": "Red Bull Bragantino",
        "Fortaleza EC": "Fortaleza",
        "Vasco DA Gama": "Vasco da Gama",
        "Vasco da Gama": "Vasco da Gama",
        "Coritiba": "Coritiba",
        "Remo": "Remo",
        "Mirassol": "Mirassol",
        "Palmeiras": "Palmeiras",
        "Flamengo": "Flamengo",
        "Corinthians": "Corinthians",
        "Cruzeiro": "Cruzeiro",
        "Fluminense": "Fluminense",
        "Bahia": "Bahia",
        "Internacional": "Internacional",
        "Botafogo": "Botafogo",
        "Santos": "Santos",
        "Juventude": "Juventude"
    }
    return name_map.get(raw_name, normalizar_nome_clube(raw_name))

def load_all_fixture_stats() -> dict:
    """Carrega todas as estatísticas de partidas disponíveis na camada Bronze."""
    stats_map = {}

    # 1. Arquivos em data/bronze/h2h_stats/stats_{fixture_id}.json
    for fpath in BRONZE_STATS_DIR.glob("stats_*.json"):
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                res = data.get("response", [])
                if res and len(res) >= 2:
                    # Extrai fixture_id do parâmetro ou do nome do arquivo
                    fix_id = data.get("parameters", {}).get("fixture")
                    if not fix_id:
                        fix_id = fpath.stem.replace("stats_", "")
                    stats_map[int(fix_id)] = res
        except Exception as e:
            print(f"  [AVISO] Erro ao carregar {fpath.name}: {e}")

    # 2. Arquivos em data/bronze/api_football_stats_{fixture_id}.json
    for fpath in BRONZE_DIR.glob("api_football_stats_*.json"):
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                res = data.get("response", [])
                if res and len(res) >= 2:
                    fix_id = fpath.stem.replace("api_football_stats_", "")
                    stats_map[int(fix_id)] = res
        except Exception as e:
            print(f"  [AVISO] Erro ao carregar {fpath.name}: {e}")

    print(f"  Total de estatísticas de partidas carregadas: {len(stats_map)}")
    return stats_map

def parse_fixture_stats(stats_response: list, home_api_id: int, away_api_id: int) -> dict:
    """Extrai estatísticas tabulares limpas para mandante e visitante."""
    if not stats_response or len(stats_response) < 2:
        return None

    home_stats_raw = None
    away_stats_raw = None

    for item in stats_response:
        t_id = item.get("team", {}).get("id")
        if t_id == home_api_id:
            home_stats_raw = {s["type"]: s["value"] for s in item.get("statistics", [])}
        elif t_id == away_api_id:
            away_stats_raw = {s["type"]: s["value"] for s in item.get("statistics", [])}

    # Se não mapeou por ID, assume ordem (primeiro home, segundo away)
    if not home_stats_raw:
        home_stats_raw = {s["type"]: s["value"] for s in stats_response[0].get("statistics", [])}
    if not away_stats_raw:
        away_stats_raw = {s["type"]: s["value"] for s in stats_response[1].get("statistics", [])}

    def clean_pct(val):
        if val is None:
            return None
        if isinstance(val, str):
            val = val.replace("%", "").strip()
        try:
            return float(val)
        except Exception:
            return None

    def clean_int(val):
        if val is None:
            return None
        try:
            return int(val)
        except Exception:
            return None

    return {
        "posse_mandante": clean_pct(home_stats_raw.get("Ball Possession")),
        "posse_visitante": clean_pct(away_stats_raw.get("Ball Possession")),
        "chutes_mandante": clean_int(home_stats_raw.get("Total Shots")),
        "chutes_visitante": clean_int(away_stats_raw.get("Total Shots")),
        "chutes_alvo_mandante": clean_int(home_stats_raw.get("Shots on Goal")),
        "chutes_alvo_visitante": clean_int(away_stats_raw.get("Shots on Goal")),
        "escanteios_mandante": clean_int(home_stats_raw.get("Corner Kicks")),
        "escanteios_visitante": clean_int(away_stats_raw.get("Corner Kicks")),
        "faltas_mandante": clean_int(home_stats_raw.get("Fouls")),
        "faltas_visitante": clean_int(away_stats_raw.get("Fouls")),
        "cartoes_amarelos_mandante": clean_int(home_stats_raw.get("Yellow Cards")),
        "cartoes_amarelos_visitante": clean_int(away_stats_raw.get("Yellow Cards")),
        "cartoes_vermelhos_mandante": clean_int(home_stats_raw.get("Red Cards")),
        "cartoes_vermelhos_visitante": clean_int(away_stats_raw.get("Red Cards")),
        "impedimentos_mandante": clean_int(home_stats_raw.get("Offsides")),
        "impedimentos_visitante": clean_int(away_stats_raw.get("Offsides")),
        "tem_estatisticas": True
    }

def process_bronze_to_silver() -> list:
    """Lê todos os H2H Bronze, remove duplicidades por fixture_id e gera camada Silver."""
    print("\n[Etapa 1/2] Processando Bronze -> Silver (Deduplicação de Partidas H2H)...")
    stats_map = load_all_fixture_stats()

    h2h_files = list(BRONZE_H2H_DIR.glob("h2h_*.json"))
    print(f"  Arquivos H2H encontrados na Bronze: {len(h2h_files)}")

    fixtures_by_id = {}

    for fpath in h2h_files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                response = data.get("response", [])
                for fix in response:
                    f_info = fix.get("fixture", {})
                    f_id = f_info.get("id")
                    if not f_id:
                        continue

                    # Filtra apenas partidas finalizadas
                    goals = fix.get("goals", {})
                    g_home = goals.get("home")
                    g_away = goals.get("away")
                    if g_home is None or g_away is None:
                        continue

                    # Identifica clubes
                    teams = fix.get("teams", {})
                    t_home = teams.get("home", {})
                    t_away = teams.get("away", {})

                    home_name = normalize_team_name(t_home.get("name", ""), t_home.get("id"))
                    away_name = normalize_team_name(t_away.get("name", ""), t_away.get("id"))

                    league = fix.get("league", {})
                    league_name = league.get("name", "")
                    league_id = league.get("id")

                    # Identifica se é Brasileirão (Série A)
                    is_brasileirao = (league_id == 71) or ("serie a" in league_name.lower()) or ("brasileiro" in league_name.lower())
                    competicao = "Brasileirão Série A" if is_brasileirao else league_name

                    # Vencedor
                    if g_home > g_away:
                        vencedor = "HOME"
                    elif g_away > g_home:
                        vencedor = "AWAY"
                    else:
                        vencedor = "DRAW"

                    # Estatísticas detalhadas se existirem
                    stats_clean = None
                    if f_id in stats_map:
                        stats_clean = parse_fixture_stats(stats_map[f_id], t_home.get("id"), t_away.get("id"))

                    # Formata data
                    raw_date = f_info.get("date", "")
                    data_formatada = ""
                    if raw_date and len(raw_date) >= 10:
                        parts = raw_date[:10].split("-")
                        if len(parts) == 3:
                            data_formatada = f"{parts[2]}/{parts[1]}/{parts[0]}"

                    match_record = {
                        "fixture_id": f_id,
                        "data_iso": raw_date,
                        "data_formatada": data_formatada,
                        "temporada": league.get("season"),
                        "rodada": league.get("round"),
                        "competicao": competicao,
                        "is_brasileirao": is_brasileirao,
                        "mandante": home_name,
                        "mandante_api_id": t_home.get("id"),
                        "mandante_escudo": t_home.get("logo"),
                        "visitante": away_name,
                        "visitante_api_id": t_away.get("id"),
                        "visitante_escudo": t_away.get("logo"),
                        "gols_mandante": int(g_home),
                        "gols_visitante": int(g_away),
                        "vencedor": vencedor,
                        "estatisticas": stats_clean
                    }

                    fixtures_by_id[f_id] = match_record

        except Exception as e:
            print(f"  [ERRO] Falha ao processar {fpath.name}: {e}")

    silver_matches = list(fixtures_by_id.values())
    # Ordena cronologicamente decrescente
    silver_matches.sort(key=lambda x: x.get("data_iso", ""), reverse=True)

    silver_file = SILVER_DIR / "silver_h2h_matches.json"
    with open(silver_file, "w", encoding="utf-8") as f:
        json.dump(silver_matches, f, ensure_ascii=False, indent=2)

    print(f"  [SILVER SALVO] {silver_file.name} com {len(silver_matches)} partidas únicas deduplicadas.")
    return silver_matches

def compute_h2h_metrics(matches: list, team_a: str, team_b: str) -> dict:
    """
    Calcula o resumo estatístico e as médias para o confronto entre team_a e team_b.
    team_a é considerado a referência (ex: Mandante do confronto atual).
    """
    total = len(matches)
    if total == 0:
        return {
            "total_jogos": 0,
            "vitorias_a": 0,
            "vitorias_b": 0,
            "empates": 0,
            "gols_a": 0,
            "gols_b": 0,
            "jogos_com_estatisticas": 0,
            "medias": {}
        }

    wins_a = 0
    wins_b = 0
    draws = 0
    goals_a = 0
    goals_b = 0

    # Acumuladores de estatísticas
    stats_count = 0
    sum_posse_a = 0.0
    sum_posse_b = 0.0
    sum_chutes_a = 0
    sum_chutes_b = 0
    sum_alvo_a = 0
    sum_alvo_b = 0
    sum_escanteios_a = 0
    sum_escanteios_b = 0
    sum_faltas_a = 0
    sum_faltas_b = 0
    sum_cartoes_a = 0
    sum_cartoes_b = 0

    for m in matches:
        is_a_home = (m["mandante"] == team_a)
        g_a = m["gols_mandante"] if is_a_home else m["gols_visitante"]
        g_b = m["gols_visitante"] if is_a_home else m["gols_mandante"]

        goals_a += g_a
        goals_b += g_b

        if g_a > g_b:
            wins_a += 1
        elif g_b > g_a:
            wins_b += 1
        else:
            draws += 1

        # Estatísticas se existirem
        st = m.get("estatisticas")
        if st and st.get("tem_estatisticas"):
            posse_a = st.get("posse_mandante") if is_a_home else st.get("posse_visitante")
            posse_b = st.get("posse_visitante") if is_a_home else st.get("posse_mandante")
            chutes_a = st.get("chutes_mandante") if is_a_home else st.get("chutes_visitante")
            chutes_b = st.get("chutes_visitante") if is_a_home else st.get("chutes_mandante")
            alvo_a = st.get("chutes_alvo_mandante") if is_a_home else st.get("chutes_alvo_visitante")
            alvo_b = st.get("chutes_alvo_visitante") if is_a_home else st.get("chutes_alvo_mandante")
            esc_a = st.get("escanteios_mandante") if is_a_home else st.get("escanteios_visitante")
            esc_b = st.get("escanteios_visitante") if is_a_home else st.get("escanteios_mandante")
            faltas_a = st.get("faltas_mandante") if is_a_home else st.get("faltas_visitante")
            faltas_b = st.get("faltas_visitante") if is_a_home else st.get("faltas_mandante")

            y_a = (st.get("cartoes_amarelos_mandante") or 0) if is_a_home else (st.get("cartoes_amarelos_visitante") or 0)
            r_a = (st.get("cartoes_vermelhos_mandante") or 0) if is_a_home else (st.get("cartoes_vermelhos_visitante") or 0)
            y_b = (st.get("cartoes_amarelos_visitante") or 0) if is_a_home else (st.get("cartoes_amarelos_mandante") or 0)
            r_b = (st.get("cartoes_vermelhos_visitante") or 0) if is_a_home else (st.get("cartoes_vermelhos_mandante") or 0)

            if posse_a is not None and posse_b is not None:
                sum_posse_a += posse_a
                sum_posse_b += posse_b
            if chutes_a is not None and chutes_b is not None:
                sum_chutes_a += chutes_a
                sum_chutes_b += chutes_b
            if alvo_a is not None and alvo_b is not None:
                sum_alvo_a += alvo_a
                sum_alvo_b += alvo_b
            if esc_a is not None and esc_b is not None:
                sum_escanteios_a += esc_a
                sum_escanteios_b += esc_b
            if faltas_a is not None and faltas_b is not None:
                sum_faltas_a += faltas_a
                sum_faltas_b += faltas_b
            sum_cartoes_a += (y_a + r_a)
            sum_cartoes_b += (y_b + r_b)

            stats_count += 1

    medias = {
        "media_gols_a": round(goals_a / max(total, 1), 2),
        "media_gols_b": round(goals_b / max(total, 1), 2),
    }

    if stats_count > 0:
        medias.update({
            "media_posse_a": round(sum_posse_a / stats_count, 1),
            "media_posse_b": round(sum_posse_b / stats_count, 1),
            "media_chutes_a": round(sum_chutes_a / stats_count, 1),
            "media_chutes_b": round(sum_chutes_b / stats_count, 1),
            "media_chutes_alvo_a": round(sum_alvo_a / stats_count, 1),
            "media_chutes_alvo_b": round(sum_alvo_b / stats_count, 1),
            "media_escanteios_a": round(sum_escanteios_a / stats_count, 1),
            "media_escanteios_b": round(sum_escanteios_b / stats_count, 1),
            "media_faltas_a": round(sum_faltas_a / stats_count, 1),
            "media_faltas_b": round(sum_faltas_b / stats_count, 1),
            "media_cartoes_a": round(sum_cartoes_a / stats_count, 1),
            "media_cartoes_b": round(sum_cartoes_b / stats_count, 1),
        })

    return {
        "total_jogos": total,
        "vitorias_a": wins_a,
        "vitorias_b": wins_b,
        "empates": draws,
        "gols_a": goals_a,
        "gols_b": goals_b,
        "jogos_com_estatisticas": stats_count,
        "medias": medias
    }

def process_silver_to_gold(silver_matches: list) -> dict:
    """
    Agrupa as partidas da Silver por confronto e gera a camada Gold estruturada.
    Chaves são salvas tanto em ordem direta ('TimeA__TimeB') quanto reversa ('TimeB__TimeA')
    para garantir busca O(1) imediata no frontend.
    """
    print("\n[Etapa 2/2] Processando Silver -> Gold (Estruturação gold_historico_confrontos)...")

    # Mapeia pares únicos presentes na base
    pairs_set = set()
    for m in silver_matches:
        t1, t2 = m["mandante"], m["visitante"]
        pair_key = tuple(sorted([t1, t2]))
        pairs_set.add(pair_key)

    gold_confrontos = {}

    for t_a, t_b in pairs_set:
        # Filtra todos os confrontos entre t_a e t_b
        all_pair_matches = [
            m for m in silver_matches
            if (m["mandante"] == t_a and m["visitante"] == t_b) or
               (m["mandante"] == t_b and m["visitante"] == t_a)
        ]

        # Cria entrada para a direção (t_a como A, t_b como B)
        def build_confronto_entry(ref_a, ref_b):
            matches_all = all_pair_matches
            matches_br = [m for m in matches_all if m.get("is_brasileirao")]

            return {
                "time_a": ref_a,
                "time_b": ref_b,
                "todos": {
                    "resumo": compute_h2h_metrics(matches_all, ref_a, ref_b),
                    "partidas": matches_all[:20]  # Limite de até 20 partidas mais recentes
                },
                "brasileirao": {
                    "resumo": compute_h2h_metrics(matches_br, ref_a, ref_b),
                    "partidas": matches_br[:20]
                }
            }

        key_ab = f"{t_a}__{t_b}"
        key_ba = f"{t_b}__{t_a}"

        gold_confrontos[key_ab] = build_confronto_entry(t_a, t_b)
        gold_confrontos[key_ba] = build_confronto_entry(t_b, t_a)

    gold_file = GOLD_DIR / "gold_historico_confrontos.json"
    with open(gold_file, "w", encoding="utf-8") as f:
        json.dump(gold_confrontos, f, ensure_ascii=False, indent=2)

    print(f"  [GOLD SALVO] {gold_file.name} com {len(gold_confrontos)} chaves de confronto indexadas.")
    return gold_confrontos

def run_h2h_processing():
    print("=" * 70)
    print("INICIANDO PROCESSAMENTO H2H (BRONZE -> SILVER -> GOLD)")
    print("=" * 70)
    silver = process_bronze_to_silver()
    gold = process_silver_to_gold(silver)
    print("=" * 70)
    print("PROCESSAMENTO H2H CONCLUÍDO COM SUCESSO!")
    print("=" * 70)
    return gold

if __name__ == "__main__":
    run_h2h_processing()
