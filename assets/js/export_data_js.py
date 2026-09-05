"""
Exporta o dataset_gold.json como um módulo JS limpo para carregar instantaneamente no index.html.
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
gold_file = BASE_DIR / "data" / "gold" / "dataset_gold.json"
out_js = BASE_DIR / "assets" / "js" / "data.js"
out_js.parent.mkdir(parents=True, exist_ok=True)

with open(gold_file, "r", encoding="utf-8") as f:
    data = json.load(f)

js_content = f"// Dataset Gold consolidado para o Frontend\nwindow.BRASILEIRAO_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n"

with open(out_js, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"data.js gerado com sucesso em: {out_js}")
