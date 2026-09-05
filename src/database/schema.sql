-- ====================================================================
-- SCHEMA DDL: Analytics Brasileirão Série A (Supabase / PostgreSQL)
-- Modelo Dimensional (Star Schema)
-- ====================================================================

-- 1. Dimensão Clubes
CREATE TABLE IF NOT EXISTS dim_clubes (
    clube_id            SERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL UNIQUE,
    sigla               VARCHAR(10),
    nome_popular        VARCHAR(60) NOT NULL,
    escudo_url          TEXT,
    cidade              VARCHAR(100),
    estado              VARCHAR(2),
    latitude            NUMERIC(8,5),
    longitude           NUMERIC(8,5),
    cor_primaria        VARCHAR(7),   -- Hexadecimal (#RRGGBB)
    cor_secundaria      VARCHAR(7),
    api_football_id     INTEGER,
    football_data_id    INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dimensão Jogadores
CREATE TABLE IF NOT EXISTS dim_jogadores (
    jogador_id          SERIAL PRIMARY KEY,
    nome                VARCHAR(150) NOT NULL,
    posicao             VARCHAR(30),
    data_nascimento     DATE,
    nacionalidade       VARCHAR(60),
    foto_url            TEXT,
    clube_id            INTEGER REFERENCES dim_clubes(clube_id) ON DELETE SET NULL,
    api_football_id     INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dimensão Calendário
CREATE TABLE IF NOT EXISTS dim_calendario (
    calendario_id       INTEGER PRIMARY KEY, -- Formato YYYYMMDD ou surrogate
    data                DATE NOT NULL,
    ano                 SMALLINT NOT NULL,
    mes                 SMALLINT NOT NULL,
    dia_semana          VARCHAR(15) NOT NULL,
    rodada              SMALLINT,
    temporada           SMALLINT NOT NULL,
    is_classico         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Fato Partidas
CREATE TABLE IF NOT EXISTS fato_partidas (
    partida_id                      SERIAL PRIMARY KEY,
    calendario_id                   INTEGER REFERENCES dim_calendario(calendario_id) ON DELETE SET NULL,
    clube_mandante_id               INTEGER NOT NULL REFERENCES dim_clubes(clube_id) ON DELETE RESTRICT,
    clube_visitante_id              INTEGER NOT NULL REFERENCES dim_clubes(clube_id) ON DELETE RESTRICT,
    gols_mandante                   SMALLINT,
    gols_visitante                  SMALLINT,
    posse_mandante                  NUMERIC(5,2),
    posse_visitante                 NUMERIC(5,2),
    chutes_mandante                 SMALLINT,
    chutes_visitante                SMALLINT,
    chutes_gol_mandante             SMALLINT,
    chutes_gol_visitante            SMALLINT,
    chutes_dentro_area_mandante     SMALLINT,
    chutes_dentro_area_visitante    SMALLINT,
    escanteios_mandante             SMALLINT,
    escanteios_visitante            SMALLINT,
    faltas_mandante                 SMALLINT,
    faltas_visitante                SMALLINT,
    xg_mandante                     NUMERIC(5,3),
    xg_visitante                    NUMERIC(5,3),
    resultado                       VARCHAR(15), -- 'MANDANTE', 'VISITANTE', 'EMPATE'
    status                          VARCHAR(20) DEFAULT 'FINISHED',
    fonte                           VARCHAR(30) NOT NULL,
    api_fixture_id                  INTEGER,
    created_at                      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clube_mandante_id, clube_visitante_id, calendario_id)
);

-- 5. Fato Eventos (Localização e Métricas de Lances)
CREATE TABLE IF NOT EXISTS fato_eventos (
    evento_id           SERIAL PRIMARY KEY,
    partida_id          INTEGER NOT NULL REFERENCES fato_partidas(partida_id) ON DELETE CASCADE,
    jogador_id          INTEGER REFERENCES dim_jogadores(jogador_id) ON DELETE SET NULL,
    clube_id            INTEGER NOT NULL REFERENCES dim_clubes(clube_id) ON DELETE RESTRICT,
    tipo_evento         VARCHAR(30) NOT NULL, -- 'Goal', 'Card', 'Shot', 'Subst'
    detalhe             VARCHAR(50),
    minuto              SMALLINT NOT NULL,
    minuto_extra        SMALLINT,
    coord_x             NUMERIC(6,2), -- Escala normalizada 0-100
    coord_y             NUMERIC(6,2), -- Escala normalizada 0-100
    xg_valor            NUMERIC(5,4),
    resultado_evento    VARCHAR(30),  -- 'Goal', 'Saved', 'Blocked', 'Off Target'
    parte_corpo         VARCHAR(20),  -- 'Right Foot', 'Left Foot', 'Head', 'Other'
    fonte               VARCHAR(30) NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_fato_partidas_mandante ON fato_partidas(clube_mandante_id);
CREATE INDEX IF NOT EXISTS idx_fato_partidas_visitante ON fato_partidas(clube_visitante_id);
CREATE INDEX IF NOT EXISTS idx_fato_partidas_calendario ON fato_partidas(calendario_id);
CREATE INDEX IF NOT EXISTS idx_fato_eventos_partida ON fato_eventos(partida_id);
CREATE INDEX IF NOT EXISTS idx_fato_eventos_clube ON fato_eventos(clube_id);
CREATE INDEX IF NOT EXISTS idx_fato_eventos_tipo ON fato_eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_dim_calendario_temp_rodada ON dim_calendario(temporada, rodada);

-- 7. View de Classificação em Tempo Real (calculada a partir de fato_partidas e dim_calendario)
CREATE OR REPLACE VIEW vw_classificacao_2026 AS
WITH jogos AS (
    SELECT 
        p.partida_id,
        p.clube_mandante_id AS clube_id,
        p.gols_mandante AS gols_pro,
        p.gols_visitante AS gols_contra,
        CASE 
            WHEN p.resultado = 'MANDANTE' THEN 3
            WHEN p.resultado = 'EMPATE' THEN 1
            ELSE 0 
        END AS pontos,
        CASE WHEN p.resultado = 'MANDANTE' THEN 1 ELSE 0 END AS vitoria,
        CASE WHEN p.resultado = 'EMPATE' THEN 1 ELSE 0 END AS empate,
        CASE WHEN p.resultado = 'VISITANTE' THEN 1 ELSE 0 END AS derrota
    FROM fato_partidas p
    JOIN dim_calendario c ON p.calendario_id = c.calendario_id
    WHERE c.temporada = 2026 AND p.status = 'FINISHED'
    
    UNION ALL
    
    SELECT 
        p.partida_id,
        p.clube_visitante_id AS clube_id,
        p.gols_visitante AS gols_pro,
        p.gols_mandante AS gols_contra,
        CASE 
            WHEN p.resultado = 'VISITANTE' THEN 3
            WHEN p.resultado = 'EMPATE' THEN 1
            ELSE 0 
        END AS pontos,
        CASE WHEN p.resultado = 'VISITANTE' THEN 1 ELSE 0 END AS vitoria,
        CASE WHEN p.resultado = 'EMPATE' THEN 1 ELSE 0 END AS empate,
        CASE WHEN p.resultado = 'MANDANTE' THEN 1 ELSE 0 END AS derrota
    FROM fato_partidas p
    JOIN dim_calendario c ON p.calendario_id = c.calendario_id
    WHERE c.temporada = 2026 AND p.status = 'FINISHED'
)
SELECT 
    DENSE_RANK() OVER (ORDER BY SUM(j.pontos) DESC, SUM(j.vitoria) DESC, (SUM(j.gols_pro) - SUM(j.gols_contra)) DESC, SUM(j.gols_pro) DESC) AS posicao,
    cl.clube_id,
    cl.nome_popular,
    cl.sigla,
    cl.escudo_url,
    cl.cor_primaria,
    cl.cor_secundaria,
    COUNT(j.partida_id) AS jogos,
    SUM(j.pontos) AS pontos,
    SUM(j.vitoria) AS vitorias,
    SUM(j.empate) AS empates,
    SUM(j.derrota) AS derrotas,
    SUM(j.gols_pro) AS gols_pro,
    SUM(j.gols_contra) AS gols_contra,
    SUM(j.gols_pro) - SUM(j.gols_contra) AS saldo_gols,
    ROUND((SUM(j.pontos)::NUMERIC / NULLIF(COUNT(j.partida_id) * 3, 0)) * 100, 1) AS aproveitamento_pct
FROM dim_clubes cl
LEFT JOIN jogos j ON cl.clube_id = j.clube_id
GROUP BY cl.clube_id, cl.nome_popular, cl.sigla, cl.escudo_url, cl.cor_primaria, cl.cor_secundaria
ORDER BY posicao ASC;
