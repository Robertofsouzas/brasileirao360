"""
Geração de Cards Interpretativos via Gemini API para o Dossiê Tático do Jogador.
Interpreta exclusivamente dados estatísticos calculados pelo pipeline (gols, xG, radar, coordenadas, posição).
Gera análises dinâmicas adaptadas ao perfil de cada posição (Atacante, Meia, Defensor, Goleiro).
"""
import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GOLD_PATH = BASE_DIR / "data" / "gold" / "dataset_gold.json"
DATA_JS_PATH = BASE_DIR / "assets" / "js" / "data.js"

def build_fallback_insight(player):
    """Gera fallback analítico estritamente baseado nos dados oficiais."""
    pos = player.get("posicao", "Jogador")
    nome = player.get("nome", "")
    clube = player.get("clube_nome", "")
    gols = player.get("gols", 0)
    xg = player.get("xg_total", 0.0)
    chutes = player.get("chutes", 0)
    jogos = player.get("jogos", 0)
    diff_xg = gols - xg

    if pos == "Goleiro":
        return (
            f"{nome} é a referência de segurança defensiva do {clube} na Série A. "
            f"Como goleiro titular em {jogos} partidas, sua contribuição tática se concentra na proteção da meta, "
            f"controle de área e liderança estrutural da retaguarda, sem participação no volume de finalizações."
        )
    elif pos in ["Zagueiro", "Lateral", "Volante"]:
        if gols > 0:
            return (
                f"Atuando no setor defensivo do {clube}, {nome} combina solidez na contenção com perigo em bolas paradas, "
                f"somando {gols} gols frente a {xg:.2f} de xG acumulado ({'+' if diff_xg >= 0 else ''}{diff_xg:.2f}). "
                f"Seu padrão tático evidencia arremates pontuais de cabeça e média distância com rigor de recomposição."
            )
        else:
            return (
                f"Elemento de sustentação tática do {clube}, {nome} cumpre papel vital na transição e contenção em {jogos} jogos. "
                f"Seu perfil no radar prioriza a estabilidade posicional e combate defensivo, operando com ações seletivas "
                f"no apoio ao setor ofensivo."
            )
    elif pos == "Meia":
        if diff_xg >= 0:
            return (
                f"{nome} se destaca pelo equilíbrio entre criação e letalidade no {clube}, convertendo {gols} gols "
                f"a partir de {xg:.2f} xG ({'+' if diff_xg >= 0 else ''}{diff_xg:.2f}). "
                f"Seu radar evidencia alto índice em finalização e visão de jogo, com arremates perigosos na entrada da área."
            )
        else:
            return (
                f"Como principal cérebro tático do {clube}, {nome} sustenta grande geração ofensiva com {xg:.2f} de xG acumulado "
                f"e {player.get('assistencias', 0)} assistências em {jogos} partidas. "
                f"Seu mapa espacial revela finalizações frequentes na meia-lua e distribuição qualificada no terço final."
            )
    else:  # Atacante
        if diff_xg >= 1.0:
            return (
                f"Com {gols} gols em {jogos} jogos, {nome} demonstra alta letalidade no comando de ataque do {clube}, "
                f"superando com folga seu xG de {xg:.2f} (+{diff_xg:.2f}). "
                f"Seu radar aponta topo em finalização, concentrando arremates no coração da grande área com taxa de conversão expressiva."
            )
        elif diff_xg >= -0.5:
            return (
                f"{nome} mantém aproveitamento consistente na referência ofensiva do {clube}, registrando {gols} gols "
                f"para um xG acumulado de {xg:.2f} ({'+' if diff_xg >= 0 else ''}{diff_xg:.2f}). "
                f"Suas finalizações concentram-se dentro da área, com presença constante nas ações de perigo."
            )
        else:
            return (
                f"Referência ofensiva do {clube}, {nome} se destaca pelo alto volume gerado com {chutes} finalizações "
                f"e {xg:.2f} xG. Apesar de marcar {gols} gols, sua capacidade de ocupar zonas quentes na área indica potencial "
                f"para maior conversão nos próximos confrontos."
            )

def generate_player_insights_batch(players_batch):
    """Gera insights interpretativos via Gemini API para um lote de jogadores."""
    if not GEMINI_API_KEY:
        return {p["jogador_id"]: build_fallback_insight(p) for p in players_batch}

    players_info = []
    for p in players_batch:
        diff_xg = p.get("gols", 0) - p.get("xg_total", 0.0)
        players_info.append(
            f"ID: {p['jogador_id']} | Nome: {p['nome']} | Posição: {p['posicao']} | Clube: {p['clube_nome']} | "
            f"Jogos: {p.get('jogos', 0)} | Gols: {p.get('gols', 0)} | Assistências: {p.get('assistencias', 0)} | "
            f"Chutes: {p.get('chutes', 0)} | xG Acumulado: {p.get('xg_total', 0.0):.2f} | "
            f"Diferencial xG: {'+' if diff_xg >= 0 else ''}{diff_xg:.2f} | xG/chute: {p.get('xg_por_chute', 0.0):.3f}"
        )

    summary_text = "\n".join(players_info)

    prompt = f"""Você é um analista estatístico esportivo sênior de futebol.
Para cada atleta listado abaixo, escreva um parágrafo interpretativo curto (2 a 3 frases, cerca de 35 a 52 palavras) para o Dossiê Tático individual.

DADOS DOS ATLETAS:
{summary_text}

REGRAS OBRIGATÓRIAS:
1. Interprete EXCLUSIVAMENTE os dados fornecidos (gols, xG, diferencial, assistências, posição). NUNCA mencione notícias, lesões, transferências, biografias ou fatos externos ao modelo.
2. Varie o foco e tom conforme a posição:
   - Para Atacantes: foco em conversão (gols vs xG), letalidade e presença dentro da grande área.
   - Para Meias: foco em criação de jogadas, arremates da entrada da área e equilíbrio entre xG e assistências.
   - Para Defensores (Zagueiros, Laterais, Volantes): foco no equilíbrio defensivo, disciplina tática e participação pontual em lances de perigo/bola parada.
   - Para Goleiros: foco na segurança da meta, liderança da linha defensiva e reposição, deixando claro que sua função primária é proteger a área sem volume de finalizações.
3. Não use jargões técnicos de programação ou banco de dados.

Retorne EXCLUSIVAMENTE um objeto JSON onde a chave é o ID do atleta (em string) e o valor é o texto interpretativo gerado:
{{
  "ID_DO_JOGADOR": "Texto interpretativo..."
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.35,
            "responseMimeType": "application/json",
            "thinkingConfig": {
                "thinkingBudget": 0
            }
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=60)
        if resp.status_code == 200:
            result = resp.json()
            raw_text = result["candidates"][0]["content"]["parts"][0]["text"]
            data = json.loads(raw_text)
            # Converter chaves para inteiros
            return {int(k): v for k, v in data.items()}
        else:
            print(f"Aviso: Gemini API retornou status {resp.status_code}. Usando fallback analítico.", flush=True)
            return {p["jogador_id"]: build_fallback_insight(p) for p in players_batch}
    except Exception as e:
        print(f"Exceção ao chamar Gemini: {e}. Usando fallback.", flush=True)
        return {p["jogador_id"]: build_fallback_insight(p) for p in players_batch}

def run():
    print("Iniciando geração de análises interpretativas dos jogadores...")
    if not GOLD_PATH.exists():
        print(f"Erro: {GOLD_PATH} não encontrado.")
        return

    with open(GOLD_PATH, "r", encoding="utf-8") as f:
        gold_data = json.load(f)

    players = gold_data.get("dim_jogadores", [])
    print(f"Total de jogadores encontrados: {len(players)}")

    batch_size = 5
    all_player_insights = {}

    for i in range(0, len(players), batch_size):
        batch = players[i:i + batch_size]
        lote_num = i // batch_size + 1
        total_lotes = (len(players) + batch_size - 1) // batch_size
        print(f"Processando lote {lote_num} de {total_lotes} ({len(batch)} atletas)...", flush=True)
        insights = generate_player_insights_batch(batch)
        all_player_insights.update(insights)
        time.sleep(1.5)

    # Atribuir a cada jogador
    for p in players:
        pid = p["jogador_id"]
        insight_text = all_player_insights.get(pid)
        if not insight_text or len(insight_text.strip()) < 20:
            insight_text = build_fallback_insight(p)
        p["insight_ia"] = insight_text

    # Salvar em dataset_gold.json
    with open(GOLD_PATH, "w", encoding="utf-8") as f:
        json.dump(gold_data, f, ensure_ascii=False, indent=2)
    print(f"[OK] dataset_gold.json atualizado com insight_ia para {len(players)} atletas.")

    # Atualizar data.js
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write("// Dataset Gold consolidado para o Frontend\n")
        f.write("window.BRASILEIRAO_DATA = ")
        json.dump(gold_data, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print("[OK] assets/js/data.js sincronizado.")

if __name__ == "__main__":
    run()
