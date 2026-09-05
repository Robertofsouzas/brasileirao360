"""
Módulo de Analytics Espacial & xG Estimator:
- Estimador de Expected Goals (xG) por distância e ângulo para o gol.
- Gerador de dados de eventos espaciais (Shot Map & Heatmap de Posicionamento).
- Compatível com dimensões do campo mplsoccer (normalizado 0-100 x 0-100).
"""
import math
import random
from typing import List, Dict

class XGEstimator:
    """
    Modelo calibrado de Expected Goals baseado em trigonometria e localização espacial:
    - Distância até o centro da meta (X: 100, Y: 50)
    - Ângulo de visão do gol (abertura da trave)
    - Tipo de finalização (pé, cabeça, bola parada)
    """

    GOAL_X = 100.0
    GOAL_Y_TOP = 55.0
    GOAL_Y_BOTTOM = 45.0
    GOAL_Y_CENTER = 50.0

    @classmethod
    def calculate_xg(cls, x: float, y: float, body_part: str = "Right Foot", is_header: bool = False) -> float:
        """
        Calcula o xG baseado nas coordenadas (0 a 100).
        """
        # Distância Euclidiana em metros aproximados (campo 105m x 68m)
        dx = (cls.GOAL_X - x) * 1.05
        dy = abs(y - cls.GOAL_Y_CENTER) * 0.68
        distance = math.sqrt(dx**2 + dy**2)

        # Ângulo formado com as duas traves
        v1 = (cls.GOAL_X - x, cls.GOAL_Y_TOP - y)
        v2 = (cls.GOAL_X - x, cls.GOAL_Y_BOTTOM - y)
        dot = v1[0]*v2[0] + v1[1]*v2[1]
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)

        if mag1 * mag2 == 0:
            angle = 0
        else:
            cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
            angle = math.acos(cos_angle)

        # Regressão logística base para futebol
        logit = -0.18 * distance + 1.25 * angle - 0.75

        if is_header or body_part == "Head":
            logit -= 0.65

        xg = 1.0 / (1.0 + math.exp(-logit))
        return max(0.01, min(0.95, round(xg, 4)))

    @classmethod
    def generate_shot_events_for_match(cls, home_team: str, away_team: str, home_goals: int, away_goals: int, home_shots: int = 14, away_shots: int = 9) -> List[dict]:
        """
        Gera eventos realistas de finalizações (shots) com coordenadas X/Y e xG
        para visualização em Shot Map e Heatmap.
        """
        events = []

        # Mandante atacando da esquerda para a direita (X: 60 a 98, Y: 15 a 85)
        for i in range(home_shots):
            is_goal = i < home_goals
            if is_goal:
                # Gols ocorrem em média mais próximos da meta
                x = random.uniform(85.0, 96.5)
                y = random.uniform(36.0, 64.0)
                outcome = "Goal"
            else:
                x = random.uniform(68.0, 96.0)
                y = random.uniform(20.0, 80.0)
                outcome = random.choice(["Saved", "Off Target", "Blocked", "Saved"])

            body_part = random.choice(["Right Foot", "Left Foot", "Head"] if x > 88 else ["Right Foot", "Left Foot"])
            is_header = (body_part == "Head")
            xg = cls.calculate_xg(x, y, body_part, is_header)
            
            # Se for gol garantido de perto, ajusta levemente
            if is_goal and xg < 0.15:
                xg = round(random.uniform(0.25, 0.65), 4)

            events.append({
                "clube": home_team,
                "time_tipo": "Mandante",
                "tipo": "Shot",
                "resultado": outcome,
                "minuto": random.randint(3, 90),
                "coord_x": round(x, 1),
                "coord_y": round(y, 1),
                "xg": xg,
                "parte_corpo": body_part,
                "is_goal": is_goal
            })

        # Visitante atacando (para manter no mesmo referencial ofensivo, usamos coordenadas ofensivas)
        for i in range(away_shots):
            is_goal = i < away_goals
            if is_goal:
                x = random.uniform(84.0, 96.0)
                y = random.uniform(38.0, 62.0)
                outcome = "Goal"
            else:
                x = random.uniform(65.0, 95.0)
                y = random.uniform(22.0, 78.0)
                outcome = random.choice(["Saved", "Off Target", "Blocked"])

            body_part = random.choice(["Right Foot", "Left Foot", "Head"] if x > 88 else ["Right Foot", "Left Foot"])
            xg = cls.calculate_xg(x, y, body_part, body_part == "Head")
            if is_goal and xg < 0.15:
                xg = round(random.uniform(0.20, 0.58), 4)

            events.append({
                "clube": away_team,
                "time_tipo": "Visitante",
                "tipo": "Shot",
                "resultado": outcome,
                "minuto": random.randint(4, 90),
                "coord_x": round(x, 1),
                "coord_y": round(y, 1),
                "xg": xg,
                "parte_corpo": body_part,
                "is_goal": is_goal
            })

        events.sort(key=lambda e: e["minuto"])
        return events
