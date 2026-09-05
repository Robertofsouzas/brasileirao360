"""
Aplica as URLs oficiais e fidedignas dos 82 jogadores em src/models/clubes_metadata.py
e regenera data/gold/dataset_gold.json e assets/js/data.js.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(ROOT))

from src.pipeline.official_player_photos import OFFICIAL_PLAYER_PHOTOS

def apply_photos():
    meta_path = ROOT / "src" / "models" / "clubes_metadata.py"
    content = meta_path.read_text(encoding="utf-8")

    updated_count = 0
    for key, new_url in OFFICIAL_PLAYER_PHOTOS.items():
        club, name = key.split(":", 1)
        
        # Procura o bloco com o nome do jogador
        # Ex: "nome": "Raphael Veiga" ... "foto_url": "..."
        pattern = re.compile(
            rf'("nome":\s*"{re.escape(name)}"[^}}]+?"foto_url":\s*")[^"]+(")',
            re.DOTALL
        )
        
        match = pattern.search(content)
        if match:
            content = pattern.sub(rf'\g<1>{new_url}\g<2>', content, count=1)
            updated_count += 1
        else:
            print(f"Não foi possível encontrar padrão para: {key}")

    meta_path.write_text(content, encoding="utf-8")
    print(f"Sucesso! Atualizadas {updated_count} fotos em {meta_path}")

if __name__ == "__main__":
    apply_photos()
