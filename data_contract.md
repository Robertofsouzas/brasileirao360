# Data Contract: Analytics Brasileirão Série A

**Versão:** 1.0.0  
**Data:** 2026-08-29  
**Status:** Publicado / Ativo  
**Engenheiro de Dados:** Beto (Analytics Engineer)  
**Destinatários:** Agente 1 (Backend/Dados), Agente 2 (Visual/Frontend), Stakeholders BI

---

## 1. Visão Geral & Convenções

Este documento é a **única fonte da verdade** para a modelagem dimensional (Star Schema) armazenada no Supabase / PostgreSQL e consumida pelas camadas de visualização e análise preditiva.

- **Nomenclatura:** Snake_case para tabelas e colunas em português (`dim_clubes`, `fato_partidas`).
- **Padrão de Coordenadas em Campo (mplsoccer/pitch):**
  - Sistema de referência: `StatsBomb pitch metric` ou normalizado `[0.0, 100.0]` para X (comprimento) e `[0.0, 100.0]` para Y (largura).
  - Orientação: X = 0 (linha de fundo defensiva), X = 100 (linha de fundo ofensiva / gol adversário).
- **Tipos de Dados:** Padrão PostgreSQL (`INTEGER`, `VARCHAR`, `NUMERIC`, `BOOLEAN`, `DATE`, `TIMESTAMPTZ`).

---

## 2. Star Schema (Modelo Dimensional)

### 2.1 `dim_clubes`
Cadastro mestre das agremiações esportivas participantes da Série A.

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `clube_id` | `INTEGER PRIMARY KEY` | Não | ID surrogate do clube no DW | `1` |
| `nome` | `VARCHAR(100)` | Não | Nome oficial completo | `'SE Palmeiras'` |
| `sigla` | `VARCHAR(10)` | Sim | Sigla ou abreviação padrão | `'PAL'` |
| `nome_popular` | `VARCHAR(60)` | Não | Nome comum/usual | `'Palmeiras'` |
| `escudo_url` | `TEXT` | Sim | URL HTTPS do escudo oficial vetorial/PNG | `'https://crests.football-data.org/1769.png'` |
| `cidade` | `VARCHAR(100)` | Sim | Cidade sede do clube | `'São Paulo'` |
| `estado` | `VARCHAR(2)` | Sim | UF (2 caracteres) | `'SP'` |
| `latitude` | `NUMERIC(8,5)` | Sim | Latitude geográfica da sede/estádio | `-23.52750` |
| `longitude` | `NUMERIC(8,5)` | Sim | Longitude geográfica da sede/estádio | `-46.67860` |
| `cor_primaria` | `VARCHAR(7)` | Sim | Cor principal em Hexadecimal | `'#006437'` |
| `cor_secundaria` | `VARCHAR(7)` | Sim | Cor secundária em Hexadecimal | `'#FFFFFF'` |
| `api_football_id` | `INTEGER` | Sim | Identificador no API-Football | `121` |
| `football_data_id`| `INTEGER` | Sim | Identificador no football-data.org | `1769` |

---

### 2.2 `dim_jogadores`
Catálogo de atletas relacionados às partidas e eventos.

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `jogador_id` | `INTEGER PRIMARY KEY` | Não | ID surrogate do jogador | `101` |
| `nome` | `VARCHAR(150)` | Não | Nome do atleta | `'Raphael Veiga'` |
| `posicao` | `VARCHAR(30)` | Sim | Posição tática ('Goleiro', 'Zagueiro', 'Lateral', 'Meia', 'Atacante') | `'Meia'` |
| `data_nascimento`| `DATE` | Sim | Data de nascimento | `'1995-06-19'` |
| `nacionalidade` | `VARCHAR(60)` | Sim | País de nacionalidade | `'Brasil'` |
| `foto_url` | `TEXT` | Sim | URL da foto do atleta | `'https://...'` |
| `clube_id` | `INTEGER FK` | Sim | Chave estrangeira para `dim_clubes` | `1` |
| `api_football_id` | `INTEGER` | Sim | Identificador no API-Football | `1024` |

---

### 2.3 `dim_calendario`
Dimensão de tempo e contexto temporal das rodadas.

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `calendario_id` | `INTEGER PRIMARY KEY` | Não | ID surrogate da data/rodada | `20260128` |
| `data` | `DATE` | Não | Data da partida | `'2026-01-28'` |
| `ano` | `SMALLINT` | Não | Ano civil | `2026` |
| `mes` | `SMALLINT` | Não | Mês civil (1 a 12) | `1` |
| `dia_semana` | `VARCHAR(15)` | Não | Dia por extenso em português | `'Quarta-feira'` |
| `rodada` | `SMALLINT` | Não | Número da rodada (1 a 38) | `1` |
| `temporada` | `SMALLINT` | Não | Ano da edição do campeonato | `2026` |
| `is_classico` | `BOOLEAN` | Não | Flag se o confronto é clássico regional | `FALSE` |

---

### 2.4 `fato_partidas`
Grão: 1 registro por partida realizada ou agendada.

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `partida_id` | `INTEGER PRIMARY KEY` | Não | ID surrogate da partida | `1001` |
| `calendario_id` | `INTEGER FK` | Não | FK para `dim_calendario` | `20260128` |
| `clube_mandante_id`| `INTEGER FK`| Não | FK do mandante em `dim_clubes` | `1` |
| `clube_visitante_id`| `INTEGER FK`| Não | FK do visitante em `dim_clubes` | `2` |
| `gols_mandante` | `SMALLINT` | Sim | Gols marcados pelo mandante | `2` |
| `gols_visitante` | `SMALLINT` | Sim | Gols marcados pelo visitante | `1` |
| `posse_mandante` | `NUMERIC(5,2)`| Sim | Posse de bola % mandante | `58.50` |
| `posse_visitante` | `NUMERIC(5,2)`| Sim | Posse de bola % visitante | `41.50` |
| `chutes_mandante` | `SMALLINT` | Sim | Total de finalizações do mandante | `16` |
| `chutes_visitante`| `SMALLINT` | Sim | Total de finalizações do visitante | `9` |
| `chutes_gol_mandante` | `SMALLINT` | Sim | Finalizações no alvo mandante | `6` |
| `chutes_gol_visitante` | `SMALLINT` | Sim | Finalizações no alvo visitante | `3` |
| `chutes_dentro_area_mandante` | `SMALLINT` | Sim | Chutes na grande área (mandante) | `10` |
| `chutes_dentro_area_visitante` | `SMALLINT` | Sim | Chutes na grande área (visitante) | `4` |
| `escanteios_mandante` | `SMALLINT` | Sim | Escanteios a favor do mandante | `7` |
| `escanteios_visitante` | `SMALLINT` | Sim | Escanteios a favor do visitante | `3` |
| `faltas_mandante` | `SMALLINT` | Sim | Faltas cometidas pelo mandante | `12` |
| `faltas_visitante`| `SMALLINT` | Sim | Faltas cometidas pelo visitante | `15` |
| `xg_mandante` | `NUMERIC(5,3)` | Sim | Expected Goals estimado mandante | `1.842` |
| `xg_visitante` | `NUMERIC(5,3)` | Sim | Expected Goals estimado visitante | `0.780` |
| `resultado` | `VARCHAR(15)` | Sim | `'MANDANTE'`, `'VISITANTE'` ou `'EMPATE'` | `'MANDANTE'` |
| `status` | `VARCHAR(20)` | Não | `'FINISHED'`, `'SCHEDULED'`, `'IN_PLAY'` | `'FINISHED'` |
| `fonte` | `VARCHAR(30)` | Não | Fonte de ingestão | `'football-data.org'` |
| `api_fixture_id` | `INTEGER` | Sim | ID original na API | `200450` |

---

### 2.5 `fato_eventos`
Grão: 1 registro por evento com localização espacial ou temporal na partida (gols, cartões, chutes, substituições).

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `evento_id` | `INTEGER PRIMARY KEY` | Não | ID surrogate do evento | `50001` |
| `partida_id` | `INTEGER FK` | Não | FK para `fato_partidas` | `1001` |
| `jogador_id` | `INTEGER FK` | Sim | FK para `dim_jogadores` | `101` |
| `clube_id` | `INTEGER FK` | Não | FK para `dim_clubes` | `1` |
| `tipo_evento` | `VARCHAR(30)` | Não | `'Goal'`, `'Card'`, `'Shot'`, `'Subst'` | `'Shot'` |
| `detalhe` | `VARCHAR(50)` | Sim | Especificação ('Normal Goal', 'Yellow Card', 'Saved') | `'Saved'` |
| `minuto` | `SMALLINT` | Não | Minuto da partida (1-90+) | `34` |
| `minuto_extra` | `SMALLINT` | Sim | Minuto de acréscimo | `2` |
| `coord_x` | `NUMERIC(6,2)` | Sim | Posição X normalizada (0 a 100) | `88.50` |
| `coord_y` | `NUMERIC(6,2)` | Sim | Posição Y normalizada (0 a 100) | `48.20` |
| `xg_valor` | `NUMERIC(5,4)` | Sim | Valor individual de xG do lance | `0.3420` |
| `resultado_evento` | `VARCHAR(30)` | Sim | `'Goal'`, `'Saved'`, `'Blocked'`, `'Off Target'` | `'Saved'` |
| `parte_corpo` | `VARCHAR(20)` | Sim | `'Right Foot'`, `'Left Foot'`, `'Head'`, `'Other'` | `'Right Foot'` |
| `fonte` | `VARCHAR(30)` | Não | Origem dos dados | `'api-football'` |

---

## 3. Contrato da Camada Analítica (Previsões & Simulações)

### 3.1 Tabela de Probabilidades de Partida (Poisson)
- Output: `prob_vitoria_mandante` (float 0-1), `prob_empate` (float 0-1), `prob_vitoria_visitante` (float 0-1), `placar_mais_provavel` (string "2x1", etc).
- Método: Distribuição bivariada / Poisson independente com fatores de ataque e defesa dos clubes ajustados pelo mando de campo.

### 3.2 Projeção de Tabela Final (Monte Carlo)
- Output: `projecao_pontos_media`, `projecao_posicao_media`, `prob_campeao` (%), `prob_libertadores_g4` (%), `prob_sulamericana` (%), `prob_rebaixamento_z4` (%).
- Iterações padrão: 10.000 simulações das rodadas restantes.

### 3.3 Benchmark de Odds de Mercado & Desmargem (Overround)
Validação comparativa entre as probabilidades preditivas do modelo estatístico (Poisson) e a precificação de mercado (Bookmakers).

| Campo | Tipo | Nulo? | Descrição | Exemplo |
|---|---|---|---|---|
| `odd_mandante` | `NUMERIC(5,2)` | Sim | Cotação decimal pré-jogo para vitória mandante (1) | `2.12` |
| `odd_empate` | `NUMERIC(5,2)` | Sim | Cotação decimal pré-jogo para empate (X) | `3.50` |
| `odd_visitante` | `NUMERIC(5,2)` | Sim | Cotação decimal pré-jogo para vitória visitante (2) | `3.45` |
| `prob_mercado_mandante_pct` | `NUMERIC(5,2)` | Sim | Probabilidade de vitória mandante normalizada sem margem | `45.0` |
| `prob_mercado_empate_pct` | `NUMERIC(5,2)` | Sim | Probabilidade de empate normalizada sem margem | `27.3` |
| `prob_mercado_visitante_pct`| `NUMERIC(5,2)` | Sim | Probabilidade de vitória visitante normalizada sem margem | `27.7` |
| `overround_pct` | `NUMERIC(5,2)` | Sim | Margem bruta total aplicada pela casa (overround) | `104.7` |
| `casa_apostas` | `VARCHAR(50)` | Sim | Livro esportivo / Provedor de referência | `'Betano'` |
| `odds_captured_at` | `TIMESTAMPTZ` | Sim | Timestamp exato da cotação pré-jogo capturada | `'2026-09-04T22:30:00Z'` |

#### Regras de Cálculo e Integridade:
1. **Regra de Timing da Odd:** Utiliza-se estritamente a **cotação mais recente disponível antes do apito inicial** (cotação de fechamento / *closing line* pré-jogo). É vedado o uso da cotação de abertura (*opening line*), uma vez que não reflete a liquidez, notícias de última hora ou volume consolidado de apostas.
2. **Conversão de Probabilidade e Remoção do Overround:**
   - Probabilidade implícita bruta: $P_{\text{bruta}} = \frac{1}{\text{Odd Decimal}}$
   - Margem total da casa (Overround): $O = P_{\text{bruta, 1}} + P_{\text{bruta, X}} + P_{\text{bruta, 2}}$ ($O > 1.0$)
   - Probabilidade normalizada pura: $P_{\text{norm, i}} = \left(\frac{P_{\text{bruta, i}}}{O}\right) \times 100\%$
   - A soma de $P_{\text{norm, 1}} + P_{\text{norm, X}} + P_{\text{norm, 2}}$ **deve somar exatamente 100.0%**.
   - É **estritamente vedado** comparar probabilidades brutas (com margem embutida) diretamente com a saída do modelo de Poisson.

---

## 4. Regras de Integridade para o Frontend

1. Todo componente que renderiza um campo de futebol **DEVE** utilizar o sistema de coordenadas de 0 a 100 para X e Y.
2. Não inventar IDs ou abreviações de clubes: consultar sempre os dados fornecidos em `dim_clubes`.
3. Cores oficiais de cada clube em gráficos e barras de status devem preferencialmente seguir `cor_primaria` e `cor_secundaria`.
4. Em caso de ausência de xG em eventos históricos sem coordenada exata, o valor deve ser explicitamente sinalizado como `null` ou `estimado`.
5. No Simulador de Confrontos, o Benchmark de Mercado deve ser exibido como visualização alternável (via toggle) em relação ao Shot Map do confronto, mantendo a simplicidade visual ("Meu Modelo" vs "Mercado") sem expor jargões desnecessários na interface.
