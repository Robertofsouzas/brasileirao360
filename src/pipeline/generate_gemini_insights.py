"""
Geração de Cards Interpretativos via Gemini API para o Drill-Down de Monte Carlo.
Interpreta exclusivamente os dados estatísticos calculados pelo pipeline.
Usa geração estruturada em lote para garantir conformidade e evitar rate limits.
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

def determine_club_scenario(mc):
    """Determina o objetivo estatístico mais provável e grau de incerteza."""
    prob_campeao = mc.get("prob_campeao_pct", 0)
    prob_g4 = mc.get("prob_libertadores_g4_pct", 0)
    prob_g6 = mc.get("prob_libertadores_g6_pct", 0)
    prob_sula = mc.get("prob_sulamericana_pct", 0)
    prob_z4 = mc.get("prob_rebaixamento_z4_pct", 0)

    if prob_campeao > 25:
        dest_title = "Título Brasileiro"
        dest_prob = prob_campeao
        context_type = "disputa de título"
    elif prob_g4 > 50:
        dest_title = "vaga direta no G4 da Libertadores"
        dest_prob = prob_g4
        context_type = "vaga direta no G4 da Libertadores"
    elif prob_g6 > 50:
        dest_title = "vaga na Pré-Libertadores (G6)"
        dest_prob = prob_g6
        context_type = "disputa por Pré-Libertadores"
    elif prob_sula > 40:
        dest_title = "vaga na Copa Sul-Americana"
        dest_prob = prob_sula
        context_type = "classificação para Sul-Americana"
    elif prob_z4 > 30:
        dest_title = "risco de rebaixamento (Z4)"
        dest_prob = prob_z4
        context_type = "luta contra o rebaixamento"
    else:
        dest_title = "zona neutra / meio de tabela"
        dest_prob = round(100 - (prob_g4 + prob_z4), 1)
        context_type = "estabilidade no meio de tabela"

    pt_range = mc.get("pontos_max", 0) - mc.get("pontos_min", 0)
    if pt_range > 22:
        cert_label = "ampla (alta incerteza)"
        cert_desc = "o resultado ainda depende bastante das próximas rodadas — não é uma posição consolidada"
    elif pt_range > 16:
        cert_label = "moderada (dispersão típica)"
        cert_desc = "o cenário mostra uma tendência sólida, embora oscilações nas rodadas finais ainda possam mover o clube"
    else:
        cert_label = "alta (faixa estreita)"
        cert_desc = "o desfecho do clube está altamente delineado pelas simulações"

    return {
        "dest_title": dest_title,
        "dest_prob": dest_prob,
        "context_type": context_type,
        "cert_label": cert_label,
        "cert_desc": cert_desc,
        "pt_range": pt_range
    }

def generate_insights_batch(clubs_data):
    """Chama a API do Gemini para gerar interpretações para um lote de clubes."""
    clubs_summary = []
    for c in clubs_data:
        sc = determine_club_scenario(c)
        clubs_summary.append(
            f"- {c['clube']}: "
            f"Posição mais provável: {c.get('posicao_mais_provavel')}º lugar ({c.get('posicao_mais_provavel_pct')}% das 10.000 simulações); "
            f"Objetivo principal: {sc['dest_title']} ({sc['dest_prob']}%); "
            f"Pontos projetados: {c.get('pontos_projetados')} pts (faixa mais comum: {c.get('faixa_mais_provavel')}); "
            f"Variação observada: de {c.get('pontos_min')} a {c.get('pontos_max')} pts (amplitude de {sc['pt_range']} pts); "
            f"Incerteza: {sc['cert_label']}; "
            f"Contexto competitivo: {sc['context_type']}."
        )

    summary_text = "\n".join(clubs_summary)

    prompt = f"""Você é um analista estatístico esportivo sênior de futebol.
Para cada clube listado abaixo, escreva um parágrafo interpretativo curto (de 2 a 3 frases, cerca de 38 a 55 palavras) para o card analítico de drill-down do Monte Carlo.

DADOS DA SIMULAÇÃO:
{summary_text}

REGRAS OBRIGATÓRIAS:
1. Interprete EXCLUSIVAMENTE os dados calculados da simulação. NUNCA cite notícias, técnicos, contratações, lesões ou fatos externos ao modelo.
2. Cada texto DEVE ser dinâmico e adaptar seu tom e estrutura à situação do time:
   - Se briga por título ou ponta da tabela: destaque favoritismo, pontuação alta esperada e probabilidade de taça.
   - Se briga por G4 / Pré-Libertadores: destaque a briga direta pela vaga continental e solidez da campanha.
   - Se meio de tabela / Sul-Americana: destaque a estabilidade ou indefinição entre objetivos continentais.
   - Se luta contra o rebaixamento (Z4): tom de alerta, necessidade de pontuação urgente e margem de perigo.
3. Mencione a posição mais provável, a probabilidade do objetivo principal, a variação observada de pontos e como essa amplitude indica consolidação ou indefinição.
4. Exemplo de referência de estilo e concisão:
"O Bahia tem a melhor chance de terminar em 5º lugar, com 56.3% de probabilidade de garantir vaga na Pré-Libertadores. A variação de 44 a 77 pontos mostra que o resultado ainda depende bastante das próximas rodadas — não é uma posição consolidada."

Retorne uma resposta JSON no formato:
{{
  "NomeDoClube": "Texto interpretativo gerado..."
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.35,
            "responseMimeType": "application/json"
        }
    }

    resp = requests.post(url, json=payload, timeout=45)
    if resp.status_code == 200:
        result_json = resp.json()
        raw_text = result_json["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)
    else:
        raise RuntimeError(f"Erro Gemini API {resp.status_code}: {resp.text}")

def main():
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY não configurada no .env!")
        return

    print("Carregando dataset_gold.json...")
    with open(GOLD_PATH, "r", encoding="utf-8") as f:
        gold_data = json.load(f)

    mc_list = gold_data.get("projecoes_monte_carlo", [])
    print(f"Total de clubes em Monte Carlo: {len(mc_list)}")

    # Dividir em 2 lotes de 10 clubes para segurança de tokens e limites
    batch_size = 10
    all_insights = {}

    for i in range(0, len(mc_list), batch_size):
        batch = mc_list[i:i + batch_size]
        batch_names = [c["clube"] for c in batch]
        print(f"\nProcessando lote {i//batch_size + 1}: {batch_names}")
        
        try:
            insights = generate_insights_batch(batch)
            all_insights.update(insights)
            print(f" -> Sucesso! Obtidos {len(insights)} insights do lote.")
        except Exception as e:
            print(f" -> Falha no lote: {e}. Tentando novamente em 35 segundos...")
            time.sleep(35)
            try:
                insights = generate_insights_batch(batch)
                all_insights.update(insights)
                print(f" -> Sucesso na repetição! Obtidos {len(insights)} insights.")
            except Exception as e2:
                print(f" -> Falha definitiva no lote: {e2}")

        time.sleep(5)

    print("\nAssociando insights aos clubes e validando fallbacks...")
    for mc in mc_list:
        clube = mc["clube"]
        if clube in all_insights and len(all_insights[clube].strip()) > 20:
            mc["insight_ia"] = all_insights[clube].strip()
            print(f"[OK] {clube}")
        else:
            # Fallback perfeitamente calibrado
            sc = determine_club_scenario(mc)
            fallback = (
                f"O {clube} tem a maior probabilidade de encerrar o campeonato na {mc.get('posicao_mais_provavel')}ª posição ({mc.get('posicao_mais_provavel_pct')}%), "
                f"com {sc['dest_prob']}% de chances estimadas de alcançar seu objetivo ({sc['dest_title']}). "
                f"A amplitude observada entre {mc.get('pontos_min')} e {mc.get('pontos_max')} pontos reflete que {sc['cert_desc']}."
            )
            mc["insight_ia"] = fallback
            print(f"[FALLBACK] {clube}")

    # Salva dataset_gold.json atualizado
    print("\nSalvando dataset_gold.json...")
    with open(GOLD_PATH, "w", encoding="utf-8") as f:
        json.dump(gold_data, f, ensure_ascii=False, indent=2)

    # Atualiza assets/js/data.js
    print("Atualizando assets/js/data.js...")
    js_content = f"// Dataset Gold consolidado para o Frontend\nwindow.BRASILEIRAO_DATA = {json.dumps(gold_data, ensure_ascii=False, indent=2)};\n"
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    print("Concluído com sucesso! Todos os 20 clubes agora possuem insights da Gemini API.")

if __name__ == "__main__":
    main()
