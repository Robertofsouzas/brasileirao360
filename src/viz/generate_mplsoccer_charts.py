"""
Módulo de Visualização Científica: mplsoccer
Gera gráficos estáticos de alta precisão científica:
- Campo de futebol oficial com mapa de calor de densidade de ações (KDE / Heatmap).
- Shot Map com tamanho de marcador proporcional ao xG do lance.
Salva os assets em assets/img/ para portfólio e documentação.
"""
import sys
import site
from pathlib import Path

# Garante acesso aos pacotes do usuário
sys.path.insert(0, site.getusersitepackages())

import matplotlib.pyplot as plt
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from mplsoccer import Pitch, VerticalPitch
from src.models.xg_estimator import XGEstimator

IMG_DIR = BASE_DIR / "assets" / "img"
IMG_DIR.mkdir(parents=True, exist_ok=True)

def generate_mplsoccer_shot_map():
    print(">>> Gerando Shot Map científico com mplsoccer...")
    
    # Cria o campo padrão StatsBomb
    pitch = Pitch(pitch_type='statsbomb', pitch_color='#0E1420', line_color='#4A5568', goal_type='box')
    fig, ax = pitch.draw(figsize=(12, 8))
    fig.patch.set_facecolor('#0A0D14')

    # Dados simulados para o clássico Palmeiras x Flamengo
    shots = XGEstimator.generate_shot_events_for_match("Palmeiras", "Flamengo", 2, 1, 15, 10)

    for s in shots:
        # Converte de 0-100 para dimensões StatsBomb (120 x 80)
        x = (s["coord_x"] / 100.0) * 120.0
        y = (s["coord_y"] / 100.0) * 80.0
        xg = s["xg"]
        is_goal = s["is_goal"]

        color = '#00E59B' if is_goal else ('#FF3B30' if s["resultado"] == "Off Target" else '#0088FF')
        marker = '*' if is_goal else 'o'
        size = max(80, xg * 900)

        pitch.scatter(x, y, s=size, c=color, edgecolors='#FFFFFF', linewidth=1.2, alpha=0.85, ax=ax, marker=marker)

    # Títulos e legendas
    ax.set_title("Shot Map & Expected Goals (xG) — Palmeiras 2 x 1 Flamengo", fontsize=16, color='#FFFFFF', fontweight='bold', pad=15)
    
    out_path = IMG_DIR / "mplsoccer_shotmap.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"  Salvo: {out_path}")

def generate_mplsoccer_heatmap():
    print(">>> Gerando Heatmap de Posicionamento com mplsoccer...")
    
    pitch = Pitch(pitch_type='statsbomb', pitch_color='#0E1420', line_color='#64748B', line_zorder=2)
    fig, ax = pitch.draw(figsize=(12, 8))
    fig.patch.set_facecolor('#0A0D14')

    # Gera 300 eventos de toques ofensivos concentrados no terço final
    np.random.seed(42)
    x = np.concatenate([np.random.normal(95, 12, 180), np.random.normal(70, 15, 120)])
    y = np.concatenate([np.random.normal(40, 16, 180), np.random.normal(50, 18, 120)])
    
    x = np.clip(x, 0, 120)
    y = np.clip(y, 0, 80)

    # Plota o mapa de densidade KDE
    pitch.kdeplot(x, y, ax=ax, cmap='viridis', fill=True, levels=50, thresh=0.05, alpha=0.6, zorder=1)

    ax.set_title("Heatmap de Ocupação Espacial Ofensiva (Terço Final)", fontsize=16, color='#FFFFFF', fontweight='bold', pad=15)
    
    out_path = IMG_DIR / "mplsoccer_heatmap.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"  Salvo: {out_path}")

if __name__ == "__main__":
    generate_mplsoccer_shot_map()
    generate_mplsoccer_heatmap()
