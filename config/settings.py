"""
Configurações e variáveis de ambiente do projeto Analytics Brasileirão.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Diretório raiz
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega .env
load_dotenv(BASE_DIR / ".env")

# API Keys
FOOTBALL_DATA_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dsxwsdzoxbkhigjcwgwv.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_ef8wnc8Kr6FfqACIZYghIQ_TIJhY1q-")

# Diretórios de Dados
DATA_DIR = BASE_DIR / "data"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"

for directory in [DATA_DIR, BRONZE_DIR, SILVER_DIR, GOLD_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
