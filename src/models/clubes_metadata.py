"""
Metadados estáticos oficiais dos clubes e jogadores de destaque da Série A do Brasileirão.
Inclui URLs de fotos oficiais em alta definição para cada atleta.
"""

CLUBES_METADATA = {
    "Palmeiras": {
        "nome_oficial": "Sociedade Esportiva Palmeiras",
        "sigla": "PAL",
        "nome_popular": "Palmeiras",
        "cidade": "São Paulo",
        "estado": "SP",
        "latitude": -23.5275,
        "longitude": -46.6786,
        "estadio": "Allianz Parque",
        "tecnico": "Abel Ferreira",
        "cor_primaria": "#006437",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1769.png",
        "football_data_id": 1769,
        "api_football_id": 121,
        "jogadores": [
            {
                "id": 101, "nome": "Raphael Veiga", "posicao": "Meia", "numero": 23, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9920.png",
                "gols": 11, "assistencias": 7, "chutes": 58, "xg_total": 8.42
            },
            {
                "id": 102, "nome": "José Manuel López", "posicao": "Atacante", "numero": 42, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/295513.png",
                "gols": 13, "assistencias": 3, "chutes": 64, "xg_total": 10.15
            },
            {
                "id": 103, "nome": "Estêvão", "posicao": "Atacante", "numero": 41, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/425733.png",
                "gols": 12, "assistencias": 8, "chutes": 52, "xg_total": 7.89
            },
            {
                "id": 104, "nome": "Gustavo Gómez", "posicao": "Zagueiro", "numero": 15, "nacionalidade": "Paraguai",
                "foto_url": "https://media.api-sports.io/football/players/2502.png",
                "gols": 3, "assistencias": 1, "chutes": 16, "xg_total": 2.30
            },
            {
                "id": 105, "nome": "Weverton", "posicao": "Goleiro", "numero": 21, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/2410.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            },
            {
                "id": 106, "nome": "Aníbal Moreno", "posicao": "Volante", "numero": 5, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/6347.png",
                "gols": 2, "assistencias": 4, "chutes": 22, "xg_total": 1.45
            },
            {
                "id": 107, "nome": "Joaquín Piquerez", "posicao": "Lateral", "numero": 22, "nacionalidade": "Uruguai",
                "foto_url": "https://media.api-sports.io/football/players/51466.png",
                "gols": 4, "assistencias": 5, "chutes": 28, "xg_total": 2.80
            }
        ]
    },
    "Flamengo": {
        "nome_oficial": "Clube de Regatas do Flamengo",
        "sigla": "FLA",
        "nome_popular": "Flamengo",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "latitude": -22.9121,
        "longitude": -43.2302,
        "estadio": "Maracanã",
        "tecnico": "Filipe Luís",
        "cor_primaria": "#C3281E",
        "cor_secundaria": "#000000",
        "escudo_url": "https://crests.football-data.org/1783.png",
        "football_data_id": 1783,
        "api_football_id": 127,
        "jogadores": [
            {
                "id": 201, "nome": "Pedro", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10321.png",
                "gols": 16, "assistencias": 4, "chutes": 72, "xg_total": 14.20
            },
            {
                "id": 202, "nome": "Giorgian De Arrascaeta", "posicao": "Meia", "numero": 14, "nacionalidade": "Uruguai",
                "foto_url": "https://media.api-sports.io/football/players/2612.png",
                "gols": 8, "assistencias": 10, "chutes": 44, "xg_total": 5.80
            },
            {
                "id": 203, "nome": "Gerson", "posicao": "Volante", "numero": 8, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/30408.png",
                "gols": 5, "assistencias": 6, "chutes": 35, "xg_total": 3.90
            },
            {
                "id": 204, "nome": "Nicolás De La Cruz", "posicao": "Meia", "numero": 18, "nacionalidade": "Uruguai",
                "foto_url": "https://media.api-sports.io/football/players/5995.png",
                "gols": 4, "assistencias": 5, "chutes": 38, "xg_total": 3.10
            },
            {
                "id": 205, "nome": "Léo Ortiz", "posicao": "Zagueiro", "numero": 3, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9458.png",
                "gols": 2, "assistencias": 2, "chutes": 12, "xg_total": 1.40
            },
            {
                "id": 206, "nome": "Agustín Rossi", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/59800.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            },
            {
                "id": 207, "nome": "Ayrton Lucas", "posicao": "Lateral", "numero": 6, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10319.png",
                "gols": 3, "assistencias": 4, "chutes": 24, "xg_total": 2.10
            }
        ]
    },
    "Botafogo": {
        "nome_oficial": "Botafogo de Futebol e Regatas",
        "sigla": "BOT",
        "nome_popular": "Botafogo",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "latitude": -22.8932,
        "longitude": -43.2924,
        "estadio": "Nilton Santos",
        "tecnico": "Artur Jorge",
        "cor_primaria": "#000000",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1770.png",
        "football_data_id": 1770,
        "api_football_id": 120,
        "jogadores": [
            {
                "id": 601, "nome": "Luiz Henrique", "posicao": "Atacante", "numero": 7, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/181467.png",
                "gols": 10, "assistencias": 7, "chutes": 60, "xg_total": 8.10
            },
            {
                "id": 602, "nome": "Igor Jesus", "posicao": "Atacante", "numero": 99, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9366.png",
                "gols": 8, "assistencias": 3, "chutes": 46, "xg_total": 7.40
            },
            {
                "id": 603, "nome": "Thiago Almada", "posicao": "Meia", "numero": 23, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/6067.png",
                "gols": 6, "assistencias": 8, "chutes": 44, "xg_total": 5.20
            },
            {
                "id": 604, "nome": "Marlon Freitas", "posicao": "Volante", "numero": 17, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9218.png",
                "gols": 2, "assistencias": 6, "chutes": 20, "xg_total": 1.70
            },
            {
                "id": 605, "nome": "John", "posicao": "Goleiro", "numero": 12, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10412.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Atlético-MG": {
        "nome_oficial": "Clube Atlético Mineiro",
        "sigla": "CAM",
        "nome_popular": "Atlético-MG",
        "cidade": "Belo Horizonte",
        "estado": "MG",
        "latitude": -19.9300,
        "longitude": -44.0139,
        "estadio": "Arena MRV",
        "tecnico": "Gabriel Milito",
        "cor_primaria": "#000000",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1766.png",
        "football_data_id": 1766,
        "api_football_id": 1062,
        "jogadores": [
            {
                "id": 801, "nome": "Hulk", "posicao": "Atacante", "numero": 7, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/12705.png",
                "gols": 14, "assistencias": 7, "chutes": 75, "xg_total": 11.90
            },
            {
                "id": 802, "nome": "Paulinho", "posicao": "Atacante", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/987.png",
                "gols": 12, "assistencias": 4, "chutes": 66, "xg_total": 10.80
            },
            {
                "id": 803, "nome": "Gustavo Scarpa", "posicao": "Meia", "numero": 6, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9922.png",
                "gols": 7, "assistencias": 9, "chutes": 51, "xg_total": 5.40
            },
            {
                "id": 804, "nome": "Guilherme Arana", "posicao": "Lateral", "numero": 13, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/2038.png",
                "gols": 3, "assistencias": 6, "chutes": 25, "xg_total": 2.10
            },
            {
                "id": 805, "nome": "Everson", "posicao": "Goleiro", "numero": 22, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10185.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "São Paulo": {
        "nome_oficial": "São Paulo Futebol Clube",
        "sigla": "SAO",
        "nome_popular": "São Paulo",
        "cidade": "São Paulo",
        "estado": "SP",
        "latitude": -23.6000,
        "longitude": -46.7200,
        "estadio": "MorumBIS",
        "tecnico": "Luis Zubeldía",
        "cor_primaria": "#C4161C",
        "cor_secundaria": "#000000",
        "escudo_url": "https://crests.football-data.org/1776.png",
        "football_data_id": 1776,
        "api_football_id": 126,
        "jogadores": [
            {
                "id": 701, "nome": "Jonathan Calleri", "posicao": "Atacante", "numero": 9, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/47368.png",
                "gols": 11, "assistencias": 4, "chutes": 59, "xg_total": 9.80
            },
            {
                "id": 702, "nome": "Lucas Moura", "posicao": "Atacante", "numero": 7, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/154.png",
                "gols": 9, "assistencias": 6, "chutes": 48, "xg_total": 6.90
            },
            {
                "id": 703, "nome": "Luciano", "posicao": "Atacante", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10323.png",
                "gols": 10, "assistencias": 3, "chutes": 53, "xg_total": 7.40
            },
            {
                "id": 704, "nome": "Alisson", "posicao": "Volante", "numero": 25, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9410.png",
                "gols": 2, "assistencias": 4, "chutes": 19, "xg_total": 1.50
            },
            {
                "id": 705, "nome": "Rafael", "posicao": "Goleiro", "numero": 23, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/655.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Corinthians": {
        "nome_oficial": "Sport Club Corinthians Paulista",
        "sigla": "COR",
        "nome_popular": "Corinthians",
        "cidade": "São Paulo",
        "estado": "SP",
        "latitude": -23.5453,
        "longitude": -46.4741,
        "estadio": "Neo Química Arena",
        "tecnico": "Ramón Díaz",
        "cor_primaria": "#000000",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1779.png",
        "football_data_id": 1779,
        "api_football_id": 131,
        "jogadores": [
            {
                "id": 1101, "nome": "Yuri Alberto", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10007.png",
                "gols": 13, "assistencias": 4, "chutes": 68, "xg_total": 11.40
            },
            {
                "id": 1102, "nome": "Memphis Depay", "posicao": "Atacante", "numero": 94, "nacionalidade": "Holanda",
                "foto_url": "https://media.api-sports.io/football/players/667.png",
                "gols": 7, "assistencias": 5, "chutes": 36, "xg_total": 5.80
            },
            {
                "id": 1103, "nome": "Rodrigo Garro", "posicao": "Meia", "numero": 10, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/5794.png",
                "gols": 8, "assistencias": 9, "chutes": 50, "xg_total": 6.10
            },
            {
                "id": 1104, "nome": "Hugo Souza", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/123759.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Vasco da Gama": {
        "nome_oficial": "Club de Regatas Vasco da Gama",
        "sigla": "VAS",
        "nome_popular": "Vasco da Gama",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "latitude": -22.8906,
        "longitude": -43.2283,
        "estadio": "São Januário",
        "tecnico": "Rafael Paiva",
        "cor_primaria": "#000000",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1780.png",
        "football_data_id": 1780,
        "api_football_id": 133,
        "jogadores": [
            {
                "id": 1201, "nome": "Pablo Vegetti", "posicao": "Atacante", "numero": 99, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/5804.png",
                "gols": 14, "assistencias": 2, "chutes": 70, "xg_total": 12.80
            },
            {
                "id": 1202, "nome": "Dimitri Payet", "posicao": "Meia", "numero": 10, "nacionalidade": "França",
                "foto_url": "https://media.api-sports.io/football/players/1912.png",
                "gols": 4, "assistencias": 8, "chutes": 32, "xg_total": 3.70
            },
            {
                "id": 1203, "nome": "Lucas Piton", "posicao": "Lateral", "numero": 6, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10234.png",
                "gols": 3, "assistencias": 6, "chutes": 18, "xg_total": 1.90
            },
            {
                "id": 1204, "nome": "Léo Jardim", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/41169.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Cruzeiro": {
        "nome_oficial": "Cruzeiro Esporte Clube",
        "sigla": "CRU",
        "nome_popular": "Cruzeiro",
        "cidade": "Belo Horizonte",
        "estado": "MG",
        "latitude": -19.8658,
        "longitude": -43.9719,
        "estadio": "Mineirão",
        "tecnico": "Fernando Diniz",
        "cor_primaria": "#003399",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1771.png",
        "football_data_id": 1771,
        "api_football_id": 135,
        "jogadores": [
            {
                "id": 501, "nome": "Matheus Pereira", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/25618.png",
                "gols": 9, "assistencias": 11, "chutes": 54, "xg_total": 6.80
            },
            {
                "id": 502, "nome": "Gabriel Veron", "posicao": "Atacante", "numero": 30, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10252.png",
                "gols": 6, "assistencias": 4, "chutes": 38, "xg_total": 5.10
            },
            {
                "id": 503, "nome": "Kaio Jorge", "posicao": "Atacante", "numero": 19, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10008.png",
                "gols": 7, "assistencias": 2, "chutes": 41, "xg_total": 6.30
            },
            {
                "id": 504, "nome": "Cássio", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10229.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Fluminense": {
        "nome_oficial": "Fluminense Football Club",
        "sigla": "FLU",
        "nome_popular": "Fluminense",
        "cidade": "Rio de Janeiro",
        "estado": "RJ",
        "latitude": -22.9121,
        "longitude": -43.2302,
        "estadio": "Maracanã",
        "tecnico": "Mano Menezes",
        "cor_primaria": "#8A1538",
        "cor_secundaria": "#006437",
        "escudo_url": "https://crests.football-data.org/1765.png",
        "football_data_id": 1765,
        "api_football_id": 124,
        "jogadores": [
            {
                "id": 401, "nome": "Germán Cano", "posicao": "Atacante", "numero": 14, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/13523.png",
                "gols": 12, "assistencias": 2, "chutes": 62, "xg_total": 11.20
            },
            {
                "id": 402, "nome": "Jhon Arias", "posicao": "Meia", "numero": 21, "nacionalidade": "Colômbia",
                "foto_url": "https://media.api-sports.io/football/players/13708.png",
                "gols": 9, "assistencias": 8, "chutes": 55, "xg_total": 7.15
            },
            {
                "id": 403, "nome": "Paulo Henrique Ganso", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10311.png",
                "gols": 4, "assistencias": 9, "chutes": 22, "xg_total": 2.40
            },
            {
                "id": 404, "nome": "Thiago Silva", "posicao": "Zagueiro", "numero": 3, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/259.png",
                "gols": 2, "assistencias": 1, "chutes": 10, "xg_total": 1.10
            },
            {
                "id": 405, "nome": "Fábio", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10080.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Bahia": {
        "nome_oficial": "Esporte Clube Bahia",
        "sigla": "BAH",
        "nome_popular": "Bahia",
        "cidade": "Salvador",
        "estado": "BA",
        "latitude": -12.9789,
        "longitude": -38.5042,
        "estadio": "Arena Fonte Nova",
        "tecnico": "Rogério Ceni",
        "cor_primaria": "#0047AB",
        "cor_secundaria": "#C3281E",
        "escudo_url": "https://crests.football-data.org/1777.png",
        "football_data_id": 1777,
        "api_football_id": 118,
        "jogadores": [
            {
                "id": 1301, "nome": "Everton Ribeiro", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10168.png",
                "gols": 5, "assistencias": 8, "chutes": 30, "xg_total": 3.60
            },
            {
                "id": 1302, "nome": "Thaciano", "posicao": "Meia", "numero": 16, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10492.png",
                "gols": 8, "assistencias": 4, "chutes": 46, "xg_total": 6.80
            },
            {
                "id": 1303, "nome": "Jean Lucas", "posicao": "Volante", "numero": 6, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9994.png",
                "gols": 6, "assistencias": 5, "chutes": 38, "xg_total": 4.50
            },
            {
                "id": 1304, "nome": "Marcos Felipe", "posicao": "Goleiro", "numero": 22, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10298.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Fortaleza": {
        "nome_oficial": "Fortaleza Esporte Clube",
        "sigla": "FOR",
        "nome_popular": "Fortaleza",
        "cidade": "Fortaleza",
        "estado": "CE",
        "latitude": -3.8067,
        "longitude": -38.5217,
        "estadio": "Arena Castelão",
        "tecnico": "Juan Pablo Vojvoda",
        "cor_primaria": "#002060",
        "cor_secundaria": "#C4161C",
        "escudo_url": "https://crests.football-data.org/3984.png",
        "football_data_id": 3984,
        "api_football_id": 154,
        "jogadores": [
            {
                "id": 1401, "nome": "Juan Martín Lucero", "posicao": "Atacante", "numero": 9, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/6326.png",
                "gols": 12, "assistencias": 3, "chutes": 58, "xg_total": 10.40
            },
            {
                "id": 1402, "nome": "Yago Pikachu", "posicao": "Meia", "numero": 22, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10581.png",
                "gols": 7, "assistencias": 6, "chutes": 40, "xg_total": 5.70
            },
            {
                "id": 1403, "nome": "João Ricardo", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10432.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Internacional": {
        "nome_oficial": "Sport Club Internacional",
        "sigla": "INT",
        "nome_popular": "Internacional",
        "cidade": "Porto Alegre",
        "estado": "RS",
        "latitude": -30.0655,
        "longitude": -51.2358,
        "estadio": "Beira-Rio",
        "tecnico": "Roger Machado",
        "cor_primaria": "#E30613",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://media.api-sports.io/football/teams/119.png",
        "football_data_id": 4034,
        "api_football_id": 119,
        "jogadores": [
            {
                "id": 901, "nome": "Rafael Borré", "posicao": "Atacante", "numero": 19, "nacionalidade": "Colômbia",
                "foto_url": "https://media.api-sports.io/football/players/1458.png",
                "gols": 10, "assistencias": 3, "chutes": 52, "xg_total": 8.90
            },
            {
                "id": 902, "nome": "Alan Patrick", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10200.png",
                "gols": 7, "assistencias": 8, "chutes": 40, "xg_total": 5.10
            },
            {
                "id": 903, "nome": "Sergio Rochet", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Uruguai",
                "foto_url": "https://media.api-sports.io/football/players/50077.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Grêmio": {
        "nome_oficial": "Grêmio Foot-Ball Porto Alegrense",
        "sigla": "GRE",
        "nome_popular": "Grêmio",
        "cidade": "Porto Alegre",
        "estado": "RS",
        "latitude": -29.9740,
        "longitude": -51.1951,
        "estadio": "Arena do Grêmio",
        "tecnico": "Renato Portaluppi",
        "cor_primaria": "#0080FF",
        "cor_secundaria": "#000000",
        "escudo_url": "https://crests.football-data.org/1767.png",
        "football_data_id": 1767,
        "api_football_id": 130,
        "jogadores": [
            {
                "id": 1001, "nome": "Martin Braithwaite", "posicao": "Atacante", "numero": 22, "nacionalidade": "Dinamarca",
                "foto_url": "https://media.api-sports.io/football/players/2737.png",
                "gols": 9, "assistencias": 2, "chutes": 43, "xg_total": 7.50
            },
            {
                "id": 1002, "nome": "Franco Cristaldo", "posicao": "Meia", "numero": 10, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/6546.png",
                "gols": 6, "assistencias": 6, "chutes": 39, "xg_total": 4.80
            },
            {
                "id": 1003, "nome": "Yeferson Soteldo", "posicao": "Atacante", "numero": 7, "nacionalidade": "Venezuela",
                "foto_url": "https://media.api-sports.io/football/players/2454.png",
                "gols": 5, "assistencias": 5, "chutes": 34, "xg_total": 4.10
            },
            {
                "id": 1004, "nome": "Agustín Marchesín", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Argentina",
                "foto_url": "https://media.api-sports.io/football/players/2464.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Athletico-PR": {
        "nome_oficial": "Club Athletico Paranaense",
        "sigla": "CAP",
        "nome_popular": "Athletico-PR",
        "cidade": "Curitiba",
        "estado": "PR",
        "latitude": -25.4483,
        "longitude": -49.2770,
        "estadio": "Ligga Arena",
        "tecnico": "Lucho González",
        "cor_primaria": "#C4161C",
        "cor_secundaria": "#000000",
        "escudo_url": "https://crests.football-data.org/1858.png",
        "football_data_id": 1858,
        "api_football_id": 134,
        "jogadores": [
            {
                "id": 301, "nome": "Pablo", "posicao": "Atacante", "numero": 92, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9976.png",
                "gols": 9, "assistencias": 3, "chutes": 48, "xg_total": 7.40
            },
            {
                "id": 302, "nome": "Agustín Canobbio", "posicao": "Atacante", "numero": 14, "nacionalidade": "Uruguai",
                "foto_url": "https://media.api-sports.io/football/players/51603.png",
                "gols": 6, "assistencias": 5, "chutes": 42, "xg_total": 4.90
            },
            {
                "id": 303, "nome": "Fernandinho", "posicao": "Volante", "numero": 5, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/640.png",
                "gols": 3, "assistencias": 4, "chutes": 20, "xg_total": 1.95
            },
            {
                "id": 304, "nome": "Mycael", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/280045.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Red Bull Bragantino": {
        "nome_oficial": "Red Bull Bragantino",
        "sigla": "RBB",
        "nome_popular": "Red Bull Bragantino",
        "cidade": "Bragança Paulista",
        "estado": "SP",
        "latitude": -22.9644,
        "longitude": -46.5422,
        "estadio": "Nabi Abi Chedid",
        "tecnico": "Fernando Seabra",
        "cor_primaria": "#C4161C",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/4286.png",
        "football_data_id": 4286,
        "api_football_id": 794,
        "jogadores": [
            {
                "id": 1501, "nome": "Eduardo Sasha", "posicao": "Atacante", "numero": 19, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10004.png",
                "gols": 8, "assistencias": 3, "chutes": 46, "xg_total": 7.10
            },
            {
                "id": 1502, "nome": "Helinho", "posicao": "Atacante", "numero": 11, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9965.png",
                "gols": 6, "assistencias": 6, "chutes": 42, "xg_total": 5.40
            },
            {
                "id": 1503, "nome": "Cleiton", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9862.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Criciúma": {
        "nome_oficial": "Criciúma Esporte Clube",
        "sigla": "CRI",
        "nome_popular": "Criciúma",
        "cidade": "Criciúma",
        "estado": "SC",
        "latitude": -28.6783,
        "longitude": -49.3708,
        "estadio": "Heriberto Hülse",
        "tecnico": "Cláudio Tencati",
        "cor_primaria": "#FFCC00",
        "cor_secundaria": "#000000",
        "escudo_url": "https://media.api-sports.io/football/teams/140.png",
        "football_data_id": 1782,
        "api_football_id": 140,
        "jogadores": [
            {
                "id": 1601, "nome": "Yannick Bolasie", "posicao": "Atacante", "numero": 11, "nacionalidade": "Rep. Dem. do Congo",
                "foto_url": "https://media.api-sports.io/football/players/1432.png",
                "gols": 7, "assistencias": 4, "chutes": 39, "xg_total": 5.80
            },
            {
                "id": 1602, "nome": "Matheusinho", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9849.png",
                "gols": 5, "assistencias": 5, "chutes": 32, "xg_total": 4.10
            },
            {
                "id": 1603, "nome": "Gustavo", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9303.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Juventude": {
        "nome_oficial": "Esporte Clube Juventude",
        "sigla": "JUV",
        "nome_popular": "Juventude",
        "cidade": "Caxias do Sul",
        "estado": "RS",
        "latitude": -29.1678,
        "longitude": -51.1794,
        "estadio": "Alfredo Jaconi",
        "tecnico": "Jair Ventura",
        "cor_primaria": "#009640",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1865.png",
        "football_data_id": 1865,
        "api_football_id": 152,
        "jogadores": [
            {
                "id": 1701, "nome": "Lucas Barbosa", "posicao": "Atacante", "numero": 21, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/304212.png",
                "gols": 6, "assistencias": 2, "chutes": 35, "xg_total": 4.90
            },
            {
                "id": 1702, "nome": "Jean Carlos", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10543.png",
                "gols": 3, "assistencias": 4, "chutes": 28, "xg_total": 3.10
            },
            {
                "id": 1703, "nome": "Gabriel", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9602.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Vitória": {
        "nome_oficial": "Esporte Clube Vitória",
        "sigla": "VIT",
        "nome_popular": "Vitória",
        "cidade": "Salvador",
        "estado": "BA",
        "latitude": -12.9197,
        "longitude": -38.4286,
        "estadio": "Barradão",
        "tecnico": "Thiago Carpini",
        "cor_primaria": "#C4161C",
        "cor_secundaria": "#000000",
        "escudo_url": "assets/img/vitoria.svg",
        "football_data_id": 1784,
        "api_football_id": 139,
        "jogadores": [
            {
                "id": 1801, "nome": "Alerrandro", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9893.png",
                "gols": 9, "assistencias": 3, "chutes": 48, "xg_total": 7.80
            },
            {
                "id": 1802, "nome": "Matheusinho", "posicao": "Meia", "numero": 30, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10009.png",
                "gols": 4, "assistencias": 5, "chutes": 33, "xg_total": 3.90
            },
            {
                "id": 1803, "nome": "Lucas Arcanjo", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/9510.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Atlético-GO": {
        "nome_oficial": "Atlético Clube Goianiense",
        "sigla": "ACG",
        "nome_popular": "Atlético-GO",
        "cidade": "Goiânia",
        "estado": "GO",
        "latitude": -16.6698,
        "longitude": -49.2789,
        "estadio": "Antônio Accioly",
        "tecnico": "Umberto Louzer",
        "cor_primaria": "#C4161C",
        "cor_secundaria": "#000000",
        "escudo_url": "https://crests.football-data.org/3988.png",
        "football_data_id": 3988,
        "api_football_id": 144,
        "jogadores": [
            {
                "id": 1901, "nome": "Luiz Fernando", "posicao": "Atacante", "numero": 11, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10073.png",
                "gols": 7, "assistencias": 3, "chutes": 44, "xg_total": 6.10
            },
            {
                "id": 1902, "nome": "Shaylon", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10025.png",
                "gols": 4, "assistencias": 5, "chutes": 30, "xg_total": 3.20
            },
            {
                "id": 1903, "nome": "Ronaldo", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10167.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Cuiabá": {
        "nome_oficial": "Cuiabá Esporte Clube",
        "sigla": "CUI",
        "nome_popular": "Cuiabá",
        "cidade": "Cuiabá",
        "estado": "MT",
        "latitude": -15.6039,
        "longitude": -56.1219,
        "estadio": "Arena Pantanal",
        "tecnico": "Bernardo Franco",
        "cor_primaria": "#006437",
        "cor_secundaria": "#FFCC00",
        "escudo_url": "https://media.api-sports.io/football/teams/1193.png",
        "football_data_id": 4030,
        "api_football_id": 142,
        "jogadores": [
            {
                "id": 2001, "nome": "Isidro Pitta", "posicao": "Atacante", "numero": 9, "nacionalidade": "Paraguai",
                "foto_url": "https://media.api-sports.io/football/players/70670.png",
                "gols": 8, "assistencias": 2, "chutes": 46, "xg_total": 7.40
            },
            {
                "id": 2002, "nome": "Clayson", "posicao": "Atacante", "numero": 25, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10258.png",
                "gols": 5, "assistencias": 4, "chutes": 34, "xg_total": 4.10
            },
            {
                "id": 2003, "nome": "Walter", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10226.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Santos": {
        "nome_oficial": "Santos Futebol Clube",
        "sigla": "SAN",
        "nome_popular": "Santos",
        "cidade": "Santos",
        "estado": "SP",
        "latitude": -23.9509,
        "longitude": -46.3382,
        "estadio": "Vila Belmiro",
        "tecnico": "Pedro Caixinha",
        "cor_primaria": "#000000",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/6685.png",
        "football_data_id": 6685,
        "api_football_id": 128,
        "jogadores": [
            {
                "id": 2101, "nome": "Guilherme", "posicao": "Atacante", "numero": 11, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10367.png",
                "gols": 8, "assistencias": 4, "chutes": 44, "xg_total": 6.90
            },
            {
                "id": 2102, "nome": "Soteldo", "posicao": "Meia", "numero": 10, "nacionalidade": "Venezuela",
                "foto_url": "https://media.api-sports.io/football/players/10365.png",
                "gols": 5, "assistencias": 7, "chutes": 32, "xg_total": 4.20
            },
            {
                "id": 2103, "nome": "Gabriel Brazão", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10015.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Mirassol": {
        "nome_oficial": "Mirassol Futebol Clube",
        "sigla": "MIR",
        "nome_popular": "Mirassol",
        "cidade": "Mirassol",
        "estado": "SP",
        "latitude": -20.8155,
        "longitude": -49.5131,
        "estadio": "Maião",
        "tecnico": "Mozart",
        "cor_primaria": "#FFCC00",
        "cor_secundaria": "#006437",
        "escudo_url": "https://crests.football-data.org/4364.png",
        "football_data_id": 4364,
        "api_football_id": 7753,
        "jogadores": [
            {
                "id": 2201, "nome": "Davó", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10016.png",
                "gols": 7, "assistencias": 2, "chutes": 38, "xg_total": 5.90
            },
            {
                "id": 2202, "nome": "Gabriel", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10017.png",
                "gols": 4, "assistencias": 5, "chutes": 26, "xg_total": 3.40
            },
            {
                "id": 2203, "nome": "Alex Muralha", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10018.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Coritiba": {
        "nome_oficial": "Coritiba Foot Ball Club",
        "sigla": "CFC",
        "nome_popular": "Coritiba",
        "cidade": "Curitiba",
        "estado": "PR",
        "latitude": -25.4142,
        "longitude": -49.2649,
        "estadio": "Couto Pereira",
        "tecnico": "Mozart Santos",
        "cor_primaria": "#006437",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/4241.png",
        "football_data_id": 4241,
        "api_football_id": 156,
        "jogadores": [
            {
                "id": 2301, "nome": "Robson", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10019.png",
                "gols": 6, "assistencias": 3, "chutes": 36, "xg_total": 5.20
            },
            {
                "id": 2302, "nome": "Matheus Frizzo", "posicao": "Volante", "numero": 5, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10020.png",
                "gols": 3, "assistencias": 4, "chutes": 22, "xg_total": 2.30
            },
            {
                "id": 2303, "nome": "Pedro Morisco", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10021.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Remo": {
        "nome_oficial": "Clube do Remo",
        "sigla": "REM",
        "nome_popular": "Remo",
        "cidade": "Belém",
        "estado": "PA",
        "latitude": -1.4010,
        "longitude": -48.4746,
        "estadio": "Baenão",
        "tecnico": "Rodrigo Santana",
        "cor_primaria": "#003399",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/4287.png",
        "football_data_id": 4287,
        "api_football_id": 7774,
        "jogadores": [
            {
                "id": 2401, "nome": "Ytalo", "posicao": "Atacante", "numero": 9, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10022.png",
                "gols": 5, "assistencias": 2, "chutes": 30, "xg_total": 4.60
            },
            {
                "id": 2402, "nome": "Pavani", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10023.png",
                "gols": 3, "assistencias": 5, "chutes": 22, "xg_total": 2.80
            },
            {
                "id": 2403, "nome": "Marcelo Rangel", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10024.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    },
    "Chapecoense": {
        "nome_oficial": "Associação Chapecoense de Futebol",
        "sigla": "CHA",
        "nome_popular": "Chapecoense",
        "cidade": "Chapecó",
        "estado": "SC",
        "latitude": -27.0853,
        "longitude": -52.6155,
        "estadio": "Arena Condá",
        "tecnico": "Umberto Louzer",
        "cor_primaria": "#006437",
        "cor_secundaria": "#FFFFFF",
        "escudo_url": "https://crests.football-data.org/1772.png",
        "football_data_id": 1772,
        "api_football_id": 136,
        "jogadores": [
            {
                "id": 2501, "nome": "Marcinho", "posicao": "Atacante", "numero": 11, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10025.png",
                "gols": 5, "assistencias": 3, "chutes": 32, "xg_total": 4.30
            },
            {
                "id": 2502, "nome": "Felipe Ferreira", "posicao": "Meia", "numero": 10, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10026.png",
                "gols": 3, "assistencias": 4, "chutes": 20, "xg_total": 2.50
            },
            {
                "id": 2503, "nome": "Saulo", "posicao": "Goleiro", "numero": 1, "nacionalidade": "Brasil",
                "foto_url": "https://media.api-sports.io/football/players/10027.png",
                "gols": 0, "assistencias": 0, "chutes": 0, "xg_total": 0.0
            }
        ]
    }
}

def normalizar_nome_clube(nome_bruto: str) -> str:
    """Normaliza variações de nomes dos clubes das APIs para o nome padrão."""
    nome = nome_bruto.strip()
    mapping = {
        "SE Palmeiras": "Palmeiras",
        "Palmeiras": "Palmeiras",
        "CR Flamengo": "Flamengo",
        "Flamengo": "Flamengo",
        "CA Paranaense": "Athletico-PR",
        "Athletico-PR": "Athletico-PR",
        "Athletico Paranaense": "Athletico-PR",
        "Fluminense FC": "Fluminense",
        "Fluminense": "Fluminense",
        "Cruzeiro EC": "Cruzeiro",
        "Cruzeiro": "Cruzeiro",
        "Botafogo FR": "Botafogo",
        "Botafogo": "Botafogo",
        "São Paulo FC": "São Paulo",
        "Sao Paulo": "São Paulo",
        "São Paulo": "São Paulo",
        "Atlético Mineiro": "Atlético-MG",
        "Atlético-MG": "Atlético-MG",
        "Atletico-MG": "Atlético-MG",
        "Mineiro": "Atlético-MG",
        "SC Internacional": "Internacional",
        "Internacional": "Internacional",
        "Grêmio FBPA": "Grêmio",
        "Grêmio": "Grêmio",
        "Gremio": "Grêmio",
        "SC Corinthians Paulista": "Corinthians",
        "Corinthians": "Corinthians",
        "CR Vasco da Gama": "Vasco da Gama",
        "Vasco da Gama": "Vasco da Gama",
        "Vasco": "Vasco da Gama",
        "EC Bahia": "Bahia",
        "Bahia": "Bahia",
        "Fortaleza EC": "Fortaleza",
        "Fortaleza": "Fortaleza",
        "Red Bull Bragantino": "Red Bull Bragantino",
        "RB Bragantino": "Red Bull Bragantino",
        "Bragantino": "Red Bull Bragantino",
        "CA Mineiro": "Atlético-MG",
        "Criciúma EC": "Criciúma",
        "Criciúma": "Criciúma",
        "Criciuma": "Criciúma",
        "EC Juventude": "Juventude",
        "Juventude": "Juventude",
        "EC Vitória": "Vitória",
        "Vitória": "Vitória",
        "Vitoria": "Vitória",
        "Atlético Clube Goianiense": "Atlético-GO",
        "Atlético Goianiense": "Atlético-GO",
        "Atlético-GO": "Atlético-GO",
        "Cuiabá EC": "Cuiabá",
        "Cuiabá": "Cuiabá",
        "Cuiaba": "Cuiabá",
        "Santos FC": "Santos",
        "Santos": "Santos",
        "Mirassol FC": "Mirassol",
        "Mirassol": "Mirassol",
        "Coritiba FBC": "Coritiba",
        "Coritiba": "Coritiba",
        "Clube do Remo": "Remo",
        "Remo": "Remo",
        "Chapecoense AF": "Chapecoense",
        "Chapecoense": "Chapecoense"
    }
    return mapping.get(nome, nome)
