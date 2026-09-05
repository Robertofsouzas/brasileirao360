"""
Modelo Estatístico de Distribuição de Poisson para Futebol (Brasileirão Série A).
Calcula força de ataque e defesa de cada clube ajustado pelo mando de campo,
gerando a matriz de probabilidades de placares e desfechos (1X2).
"""
import math
from typing import Dict, Tuple, List

class PoissonMatchModel:
    def __init__(self, matches_finished: List[dict]):
        """
        Inicializa o modelo com base no histórico de partidas finalizadas.
        matches_finished: lista de dicionários contendo mandante, visitante, gols_mandante, gols_visitante.
        """
        self.matches = matches_finished
        self.team_stats = {}
        self.avg_home_goals = 1.35
        self.avg_away_goals = 0.95
        self._fit()

    def _fit(self):
        """Calcula as médias da liga e os índices de ataque e defesa de cada equipe com regularização Bayesiana."""
        if not self.matches:
            return

        total_home_goals = sum(m["gols_mandante"] for m in self.matches)
        total_away_goals = sum(m["gols_visitante"] for m in self.matches)
        n = len(self.matches)

        self.avg_home_goals = max(total_home_goals / n, 0.5)
        self.avg_away_goals = max(total_away_goals / n, 0.5)

        # Totais por equipe e histórico de confrontos diretos
        totals = {}
        self.h2h = {}

        for m in self.matches:
            home = m["mandante"]
            away = m["visitante"]
            gh = m["gols_mandante"]
            ga = m["gols_visitante"]

            if home not in totals:
                totals[home] = {"home_games": 0, "away_games": 0, "home_gf": 0, "home_ga": 0, "away_gf": 0, "away_ga": 0, "pts": 0, "wins": 0, "losses": 0}
            if away not in totals:
                totals[away] = {"home_games": 0, "away_games": 0, "home_gf": 0, "home_ga": 0, "away_gf": 0, "away_ga": 0, "pts": 0, "wins": 0, "losses": 0}

            totals[home]["home_games"] += 1
            totals[home]["home_gf"] += gh
            totals[home]["home_ga"] += ga

            totals[away]["away_games"] += 1
            totals[away]["away_gf"] += ga
            totals[away]["away_ga"] += gh

            if gh > ga:
                totals[home]["pts"] += 3
                totals[home]["wins"] += 1
                totals[away]["losses"] += 1
            elif gh < ga:
                totals[away]["pts"] += 3
                totals[away]["wins"] += 1
                totals[home]["losses"] += 1
            else:
                totals[home]["pts"] += 1
                totals[away]["pts"] += 1

            self.h2h[(home, away)] = (gh, ga)

        max_pts = max((d["pts"] for d in totals.values()), default=50)

        # Cálculo das forças com contração Bayesiana e ponderação por desempenho na tabela
        for team, d in totals.items():
            hg = max(d["home_games"], 1)
            ag = max(d["away_games"], 1)
            total_games = hg + ag

            raw_ha = (d["home_gf"] / hg) / self.avg_home_goals
            raw_hd = (d["home_ga"] / hg) / self.avg_away_goals
            raw_aa = (d["away_gf"] / ag) / self.avg_away_goals
            raw_ad = (d["away_ga"] / ag) / self.avg_home_goals

            # Contração Bayesiana em direção a 1.0 (média da liga) para atenuar distorções em amostras reduzidas
            shrink = 0.65
            ha = 1.0 + shrink * (raw_ha - 1.0)
            hd = 1.0 + shrink * (raw_hd - 1.0)
            aa = 1.0 + shrink * (raw_aa - 1.0)
            ad = 1.0 + shrink * (raw_ad - 1.0)

            # Ponderação de momento e aproveitamento da tabela (pontuação e consistência)
            pts = d["pts"]
            wins = d["wins"]
            loss_rate = d["losses"] / max(total_games, 1)
            form_bonus = (pts / max_pts) * 0.12 + (wins / max(total_games, 1)) * 0.04 - (loss_rate * 0.12)

            self.team_stats[team] = {
                "home_attack": max(ha + form_bonus, 0.3),
                "home_defense": max(hd - form_bonus, 0.3),
                "away_attack": max(aa + form_bonus, 0.3),
                "away_defense": max(ad - form_bonus, 0.3),
            }

    @staticmethod
    def _poisson_pmf(k: int, lambda_val: float) -> float:
        """Função de massa de probabilidade de Poisson."""
        if lambda_val <= 0:
            return 1.0 if k == 0 else 0.0
        return (math.exp(-lambda_val) * (lambda_val ** k)) / math.factorial(k)

    def predict_match(self, home_team: str, away_team: str, max_goals: int = 6) -> dict:
        """
        Calcula as probabilidades para o confronto home_team x away_team.
        Retorna:
        - lambda_home (expectativa de gols do mandante)
        - lambda_away (expectativa de gols do visitante)
        - prob_mandante, prob_empate, prob_visitante (%)
        - matriz_placares (top 5 placares mais prováveis)
        """
        home_st = self.team_stats.get(home_team, {"home_attack": 1.0, "home_defense": 1.0, "away_attack": 1.0, "away_defense": 1.0})
        away_st = self.team_stats.get(away_team, {"home_attack": 1.0, "home_defense": 1.0, "away_attack": 1.0, "away_defense": 1.0})

        # Expectativa de gols (Lambda)
        lambda_home = home_st["home_attack"] * away_st["away_defense"] * self.avg_home_goals
        lambda_away = away_st["away_attack"] * home_st["home_defense"] * self.avg_away_goals

        # Ponderação do confronto direto anterior no campeonato (ex: Palmeiras venceu Flamengo por 3x0 fora de casa)
        if hasattr(self, "h2h") and (away_team, home_team) in self.h2h:
            past_ga, past_gh = self.h2h[(away_team, home_team)]
            if past_gh > past_ga:
                lambda_home *= 1.20
                lambda_away *= 0.82

        # Matriz de probabilidades de placar
        prob_home = 0.0
        prob_draw = 0.0
        prob_away = 0.0
        score_matrix = []

        for h in range(max_goals + 1):
            p_h = self._poisson_pmf(h, lambda_home)
            for a in range(max_goals + 1):
                p_a = self._poisson_pmf(a, lambda_away)
                prob = p_h * p_a

                if h > a:
                    prob_home += prob
                elif h == a:
                    prob_draw += prob
                else:
                    prob_away += prob

                score_matrix.append({
                    "placar": f"{h} x {a}",
                    "gols_mandante": h,
                    "gols_visitante": a,
                    "probabilidade": round(prob * 100, 2)
                })

        # Normalização
        total_p = prob_home + prob_draw + prob_away
        if total_p > 0:
            prob_home /= total_p
            prob_draw /= total_p
            prob_away /= total_p

        # Top placares
        score_matrix.sort(key=lambda x: x["probabilidade"], reverse=True)

        return {
            "mandante": home_team,
            "visitante": away_team,
            "lambda_mandante": round(lambda_home, 2),
            "lambda_visitante": round(lambda_away, 2),
            "prob_mandante_pct": round(prob_home * 100, 1),
            "prob_empate_pct": round(prob_draw * 100, 1),
            "prob_visitante_pct": round(prob_away * 100, 1),
            "placar_mais_provavel": score_matrix[0]["placar"],
            "top_placares": score_matrix[:5]
        }
