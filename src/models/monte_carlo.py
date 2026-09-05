"""
Simulador Estocástico de Monte Carlo para o Campeonato Brasileiro Série A.
Simula as rodadas restantes milhares de vezes (padrão: 10.000 iterações)
usando as probabilidades da distribuição de Poisson para projetar a classificação final.
"""
import random
from typing import List, Dict
from collections import defaultdict
from src.models.poisson_model import PoissonMatchModel

class MonteCarloSimulator:
    def __init__(self, current_standings: List[dict], scheduled_matches: List[dict], poisson_model: PoissonMatchModel):
        """
        current_standings: Lista com a tabela atual (clube, pontos, vitorias, gols_pro, gols_contra, jogos)
        scheduled_matches: Lista com jogos pendentes (mandante, visitante, rodada)
        poisson_model: Instância treinada do PoissonMatchModel
        """
        self.standings = {s["nome_popular"]: dict(s) for s in current_standings}
        self.scheduled_matches = scheduled_matches
        self.poisson = poisson_model

    def run_simulation(self, iterations: int = 10000) -> List[dict]:
        """
        Executa a simulação de Monte Carlo.
        Retorna projeções com médias de pontos, posições e probabilidades percentuais.
        """
        print(f">>> Executando Simulação Monte Carlo com {iterations:,} iterações...")
        
        # Pré-computa as probabilidades Poisson de cada jogo agendado para performance
        match_probs = []
        for m in self.scheduled_matches:
            pred = self.poisson.predict_match(m["mandante"], m["visitante"])
            p_home = pred["prob_mandante_pct"] / 100.0
            p_draw = pred["prob_empate_pct"] / 100.0
            p_away = pred["prob_visitante_pct"] / 100.0
            match_probs.append({
                "mandante": m["mandante"],
                "visitante": m["visitante"],
                "p_home": p_home,
                "p_draw": p_draw,
                "p_away": p_away
            })

        # Acumuladores de resultados
        titles_count = defaultdict(int)
        g4_count = defaultdict(int)
        g6_count = defaultdict(int)
        sulamericana_count = defaultdict(int) # 7º ao 12º
        z4_count = defaultdict(int) # 17º ao 20º
        total_points_acc = defaultdict(int)
        total_pos_acc = defaultdict(int)
        
        # Distribuições detalhadas para os histogramas D3.js
        teams = list(self.standings.keys())
        pos_distribution = {t: defaultdict(int) for t in teams}
        points_distribution = {t: defaultdict(int) for t in teams}

        for _ in range(iterations):
            # Copia a tabela atual
            sim_table = {
                t: {
                    "pontos": self.standings[t]["pontos"],
                    "vitorias": self.standings[t]["vitorias"],
                    "saldo": self.standings[t]["saldo_gols"],
                    "gols_pro": self.standings[t]["gols_pro"]
                }
                for t in teams
            }

            # Simula cada partida restante
            for mp in match_probs:
                home = mp["mandante"]
                away = mp["visitante"]
                
                if home not in sim_table or away not in sim_table:
                    continue

                r = random.random()
                if r < mp["p_home"]:
                    # Vitória Mandante
                    sim_table[home]["pontos"] += 3
                    sim_table[home]["vitorias"] += 1
                    sim_table[home]["saldo"] += 1
                    sim_table[home]["gols_pro"] += 2
                    sim_table[away]["saldo"] -= 1
                    sim_table[away]["gols_pro"] += 1
                elif r < mp["p_home"] + mp["p_draw"]:
                    # Empate
                    sim_table[home]["pontos"] += 1
                    sim_table[away]["pontos"] += 1
                    sim_table[home]["gols_pro"] += 1
                    sim_table[away]["gols_pro"] += 1
                else:
                    # Vitória Visitante
                    sim_table[away]["pontos"] += 3
                    sim_table[away]["vitorias"] += 1
                    sim_table[away]["saldo"] += 1
                    sim_table[away]["gols_pro"] += 2
                    sim_table[home]["saldo"] -= 1
                    sim_table[home]["gols_pro"] += 1

            # Ordena a tabela simulada: Pontos > Vitórias > Saldo > Gols Pró
            sorted_teams = sorted(
                teams,
                key=lambda t: (
                    sim_table[t]["pontos"],
                    sim_table[t]["vitorias"],
                    sim_table[t]["saldo"],
                    sim_table[t]["gols_pro"]
                ),
                reverse=True
            )

            # Contabiliza posições e pontos na iteração
            for pos, t in enumerate(sorted_teams, start=1):
                final_pts = sim_table[t]["pontos"]
                total_pos_acc[t] += pos
                total_points_acc[t] += final_pts
                pos_distribution[t][pos] += 1
                points_distribution[t][final_pts] += 1

                if pos == 1:
                    titles_count[t] += 1
                if pos <= 4:
                    g4_count[t] += 1
                if pos <= 6:
                    g6_count[t] += 1
                if 7 <= pos <= 12:
                    sulamericana_count[t] += 1
                if pos >= 17:
                    z4_count[t] += 1

        # Consolidação dos resultados
        results = []
        for t in teams:
            avg_points = round(total_points_acc[t] / iterations, 1)
            avg_pos = round(total_pos_acc[t] / iterations, 1)
            p_title = round((titles_count[t] / iterations) * 100, 1)
            p_g4 = round((g4_count[t] / iterations) * 100, 1)
            p_g6 = round((g6_count[t] / iterations) * 100, 1)
            p_sula = round((sulamericana_count[t] / iterations) * 100, 1)
            p_z4 = round((z4_count[t] / iterations) * 100, 1)

            # Distribuição de Posição (1 a 20)
            dist_pos = []
            for p in range(1, 21):
                cnt = pos_distribution[t].get(p, 0)
                dist_pos.append({
                    "posicao": p,
                    "contagem": cnt,
                    "pct": round((cnt / iterations) * 100, 2)
                })

            # Posição mais provável (Moda)
            best_pos_item = max(dist_pos, key=lambda x: x["contagem"])
            posicao_mais_provavel = best_pos_item["posicao"]
            posicao_mais_provavel_pct = best_pos_item["pct"]

            # Distribuição de Pontos (Valores inteiros observados)
            pts_keys = sorted(points_distribution[t].keys())
            pts_min = pts_keys[0] if pts_keys else 0
            pts_max = pts_keys[-1] if pts_keys else 100
            
            dist_pts = []
            for pts in range(pts_min, pts_max + 1):
                cnt = points_distribution[t].get(pts, 0)
                if cnt > 0:
                    dist_pts.append({
                        "pontos": pts,
                        "contagem": cnt,
                        "pct": round((cnt / iterations) * 100, 2)
                    })

            # Agrupamento de Pontos em Faixas (Bins de 5 pontos, ex: 50-54, 55-59...)
            bin_size = 5
            bin_start_floor = (pts_min // bin_size) * bin_size
            bin_end_ceil = ((pts_max // bin_size) + 1) * bin_size
            
            dist_bins = []
            for b_start in range(bin_start_floor, bin_end_ceil, bin_size):
                b_end = b_start + bin_size - 1
                cnt_bin = sum(points_distribution[t].get(pt, 0) for pt in range(b_start, b_end + 1))
                if cnt_bin > 0:
                    dist_bins.append({
                        "faixa": f"{b_start} a {b_end} pts",
                        "min_pts": b_start,
                        "max_pts": b_end,
                        "contagem": cnt_bin,
                        "pct": round((cnt_bin / iterations) * 100, 2)
                    })

            best_bin = max(dist_bins, key=lambda x: x["contagem"]) if dist_bins else None
            faixa_mais_provavel = best_bin["faixa"] if best_bin else f"{pts_min} a {pts_max} pts"

            results.append({
                "clube": t,
                "pontos_atuais": self.standings[t]["pontos"],
                "jogos_atuais": self.standings[t]["jogos"],
                "pontos_projetados": avg_points,
                "posicao_projetada": avg_pos,
                "prob_campeao_pct": p_title,
                "prob_libertadores_g4_pct": p_g4,
                "prob_libertadores_g6_pct": p_g6,
                "prob_sulamericana_pct": p_sula,
                "prob_rebaixamento_z4_pct": p_z4,
                "posicao_mais_provavel": posicao_mais_provavel,
                "posicao_mais_provavel_pct": posicao_mais_provavel_pct,
                "pontos_min": pts_min,
                "pontos_max": pts_max,
                "faixa_mais_provavel": faixa_mais_provavel,
                "distribuicao_posicoes": dist_pos,
                "distribuicao_pontos": dist_pts,
                "distribuicao_pontos_bins": dist_bins
            })

        results.sort(key=lambda x: (x["prob_campeao_pct"], x["pontos_projetados"]), reverse=True)
        print(">>> Simulação Monte Carlo finalizada com sucesso!\n")
        return results
