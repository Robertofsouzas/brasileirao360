# Brasileirão 360 ⚽📊
### Inteligência Tática, Engenharia de Dados & Modelos Preditivos do Brasileirão Série A

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org/)
[![deck.gl](https://img.shields.io/badge/deck.gl-v8.9-12B47D?style=for-the-badge)](https://deck.gl/)
[![PostgreSQL / Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Monte Carlo](https://img.shields.io/badge/Monte_Carlo-10.000_Simulações-8B5CF6?style=for-the-badge)](#-modelos-matemáticos--estatísticos)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📌 Visão Geral & Propósito do Projeto

O **Brasileirão 360** é uma plataforma analítica end-to-end desenvolvida para transformar a compreensão estatística do Campeonato Brasileiro Série A. O projeto une **Engenharia de Dados**, **Modelagem Estocástica Preditiva** e **Visualização Espacial Avançada**, entregando um ecossistema que vai desde a ingestão automatizada de dados brutos de APIs esportivas até visualizações ricas e interativas.

### 🎯 Principais Objetivos:
1. **Democratizar a Inteligência Tática:** Traduzir conceitos avançados de ciência de dados esportivos (*Expected Goals*, densidade espacial de chutes, matriz de Poisson e convergência de Monte Carlo) em uma interface limpa, moderna e acessível sem abrir mão do rigor estatístico.
2. **Projeção Científica de Desfechos:** Estimar com precisão as probabilidades de Título, vagas na Copa Libertadores (Fase de Grupos e Pré-Libertadores), Copa Sul-Americana, Permanência e Rebaixamento através de **10.000 simulações de Monte Carlo** de todas as rodadas restantes.
3. **Validação com Mercado Real:** Confrontar as estimativas do modelo preditivo de Poisson contra as probabilidades implícitas de casas de apostas reais (com **desmargem matemática de 100% do overround**).
4. **Arquitetura de Analytics Engineering Profissional:** Implementar um pipeline estruturado com arquitetura Medalhão (Bronze, Silver, Gold), modelagem dimensional Star Schema em PostgreSQL/Supabase e governança por meio de Contrato de Dados (*Data Contract*).

---

## 🚀 Principais Recursos & Módulos da Aplicação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BRASILEIRÃO 360                                │
├──────────────────────────┬────────────────────────────┬─────────────────────┤
│   CLASSIFICAÇÃO & TEMAS  │    SIMULADOR DE JOGOS      │     PROJEÇÕES MC    │
│  • Tabela Oficial        │  • Poisson Bivariado 1X2   │  • 10.000 Cenários  │
│  • Segmentadores Clube   │  • Matriz de Placares      │  • Posição (1º-20º) │
│  • Dossiê D3 do Atleta   │  • Shot Map deck.gl        │  • Pontos Finais    │
│  • Zonas de Perigo xG    │  • Benchmark Odds Mercado  │  • Gemini AI Text   │
└──────────────────────────┴────────────────────────────┴─────────────────────┘
```

### 1. Classificação Oficial da Série A
- Tabela de classificação completa e atualizada dos 20 clubes participantes.
- Zonas de destino codificadas por cor: G4 Libertadores (Verde), Pré-Libertadores (Verde-água), Sul-Americana (Âmbar) e Z4 Rebaixamento (Vermelho).
- Estatísticas detalhadas: Pontos, Jogos, Vitórias, Empates, Derrotas, Gols Pró, Gols Contra, Saldo de Gols e Aproveitamento percentual.

### 2. Times & Jogadores em Detalhe (Drill-Down Tático)
- **Segmentadores Refinados:** Filtros modernos com design glassmórfico escuro, badges temáticos (`🛡️ CLUBE`, `👤 JOGADOR`), setas em SVG esmeralda e anel de foco customizado.
- **Card do Clube:** Escudo em alta definição, estádio, comissão técnica, métricas médias da temporada (posse de bola, xG pró/contra, chutes no alvo e taxa de conversão) e histórico recente de partidas com pílulas V/E/D.
- **Elenco & Tabela Interativa:** Lista completa dos atletas com posições, jogos, gols, assistências, volume de finalizações e taxas de xG acumulado e por chute.
- **Campo Tático do Atleta (D3.js):**
  - **🔥 Mapa de Calor (Heatmap 2D):** Superfície contínua de densidade de chutes com decaimento exponencial e suavização Gaussiana.
  - **🎯 Shot Map:** Círculos posicionados nas coordenadas exatas $(X, Y)$ da finalização com raio proporcional ao valor de xG e cores correspondentes ao desfecho (Gol, Defesa, Bloqueado, Para Fora).
  - **⚡ Híbrido:** Sobreposição simultânea do mapa de calor e das finalizações pontuais.
  - **📐 Zonas xG:** Divisão do campo em setores de perigo ofensivo (pequena área, área central, flancos e média distância).

### 3. Simulador de Confrontos da Rodada
- **Previsão Bivariada de Poisson:** Cálculo da expectativa de gols do mandante ($\lambda_M$) e do visitante ($\lambda_V$) com base na força de ataque e defesa dos clubes e fator de mando de campo.
- **Visualização Dupla Alternável (Toggle):**
  - **🎯 Shot Map do Confronto:** Renderizado com **deck.gl (OrthographicView)** exibindo a evidência espacial e o histórico de finalizações das duas equipes.
  - **📊 Benchmark de Odds de Mercado:** Confronto direto das probabilidades do Modelo Poisson contra as cotações reais pré-jogo de bookmakers (Betano / The Odds API), aplicando desmargem matemática rigorosa de 100% sobre o overround bruto.

### 4. Projeções de Final de Temporada (Monte Carlo)
- **10.000 Simulações Completas:** Projeção estocástica de todas as partidas restantes do campeonato.
- **Tabela de Probabilidades:** Percentuais exatos de cada time para Título, G4, Pré-Libertadores, Sul-Americana, Permanência e Rebaixamento.
- **Drill-Down Estocástico por Clube:**
  - **Histograma de Posição Final (1º ao 20º lugar):** Gráfico interativo com barras coloridas pelas zonas do campeonato, permitindo inspecionar cada colocação via hover no desktop ou toque no mobile/tablet.
  - **Distribuição de Pontos Finais:** Histograma com a dispersão de pontos projetados e grau de incerteza da campanha.
  - **Tooltips Interativos (Desktop + Mobile):** Tooltip contextual em todas as barras com contagem de simulações, porcentagem, zonas e frases descritivas sem jargões.
  - **Card Interpretativo (Gemini AI):** Síntese analítica em linguagem natural alimentada por IA sobre a situação do clube na reta final.

---

## 🛠️ Tecnologias & Ferramentas Utilizadas

### Frontend & Visualização de Dados
| Tecnologia | Função no Projeto |
|---|---|
| **HTML5 Semântico** | Estruturação acessível, tags semânticas, meta tags descritivas |
| **Vanilla CSS3** | Design System exclusivo, Dark Mode, Glassmorphism, CSS Custom Properties, layout em Grid e Flexbox responsivo |
| **JavaScript (ES6+)** | Lógica modular de visualizações, eventos de toque/clique e renderização dinâmica |
| **D3.js (v7)** | Criação de gráficos analíticos: Shot Map do atleta, Heatmap 2D Gaussiano, Zonas de Perigo e Histogramas Monte Carlo |
| **deck.gl (v8.9)** | Renderização WebGL acelerada por hardware de mapas de chutes espaciais em visão ortográfica |
| **Google Fonts** | Tipografia profissional: *Outfit* (títulos), *Inter* (interface) e *JetBrains Mono* (números e métricas) |

### Ciência de Dados & Modelos Preditivos
| Tecnologia / Método | Finalidade |
|---|---|
| **Distribuição de Poisson** | Cálculo de probabilidades de gols e placares exatos $P(X=x, Y=y) = P(X=x) \cdot P(Y=y)$ |
| **Simulação de Monte Carlo** | Execução de 10.000 iterações do campeonato para convergência probabilística da classificação |
| **Expected Goals (xG)** | Modelo trigonométrico para ponderar o perigo de finalizações por distância, ângulo e parte do corpo |
| **Desmargem de Odds (Overround)** | Normalização matemática de cotações para comparação justa: $P_{\text{norm}} = \frac{1/\text{Odd}}{\sum(1/\text{Odds})}$ |
| **Google Gemini API** | Inteligência artificial generativa para diagnósticos estatísticos narrativos automatizados |
| **mplsoccer & Matplotlib** | Geração estática de mapas de densidade ofensiva (KDE) e finalizações científicas |

### Engenharia de Dados & Backend
| Tecnologia | Função no Projeto |
|---|---|
| **Python 3.10+** | Linguagem principal de ingestão, pipeline e modelagem preditiva |
| **NumPy & Pandas** | Manipulação de DataFrames, transformações matriciais e cálculos vetorizados |
| **Requests** | Extração de dados via APIs REST com retry e controle de rate-limit |
| **Supabase (PostgreSQL)** | Armazenamento relacional e dimensional com Star Schema |
| **APIs de Dados Esportivos** | football-data.org (tabela/jogos), API-Football v3 (eventos e chutes) e The Odds API (cotações de mercado) |

---

## 🧠 Modelos Matemáticos & Estatísticos

### 1. Modelo Preditivo de Poisson (Confrontos 1X2)
Para cada confronto entre o mandante $M$ e o visitante $V$, as taxas de gols esperados ($\lambda_M$ e $\lambda_V$) são calculadas a partir das forças de ataque e defesa calibradas na temporada:

$$\lambda_M = \text{ForçaAtaque}_M \times \text{ForçaDefesa}_V \times \text{FatorMando}_M \times \mu_{\text{gols}}$$

$$\lambda_V = \text{ForçaAtaque}_V \times \text{ForçaDefesa}_M \times \mu_{\text{gols}}$$

A probabilidade de um placar exato com $x$ gols do mandante e $y$ gols do visitante é dada pela distribuição independente de Poisson:

$$P(X=x, Y=y) = \frac{\lambda_M^x e^{-\lambda_M}}{x!} \times \frac{\lambda_V^y e^{-\lambda_V}}{y!}$$

### 2. Simulação de Monte Carlo da Série A (10.000 Ciclos)
- A cada iteração $k \in \{1, \dots, 10.000\}$, todos os jogos restantes da tabela são simulados via distribuição de Poisson estocástica.
- A tabela de classificação é reordenada pelos critérios oficiais do Brasileirão (Pontos $\rightarrow$ Vitórias $\rightarrow$ Saldo de Gols $\rightarrow$ Gols Pró).
- As frequências relativas acumuladas de todas as 10.000 temporadas determinam as probabilidades exatas de cada clube atingir cada faixa da classificação.

### 3. Remoção de Margem de Bookmakers (Desmargem de 100%)
As odds de mercado brutas contêm a margem de lucro da casa de apostas (*overround* $O \approx 104\% \text{ a } 106\%$):

$$P_{\text{bruta}, i} = \frac{1}{\text{Odd}_i}, \quad O = \sum_{i \in \{1, X, 2\}} P_{\text{bruta}, i}$$

$$P_{\text{desmargiada}, i} = \left( \frac{P_{\text{bruta}, i}}{O} \right) \times 100\%$$

Isso garante que $\sum P_{\text{desmargiada}} = 100.0\%$, permitindo a comparação direta com o modelo estatístico.

---

## 📂 Estrutura do Repositório

```text
brasileirao360/
├── index.html                    # Dashboard Web Interativo Principal
├── data_contract.md              # Contrato de Dados (Fonte Única da Verdade)
├── README.md                     # Documentação Técnica e do Negócio
├── requirements.txt              # Dependências Python do ecossistema
├── .env.example                  # Template seguro de variáveis de ambiente
├── .gitignore                    # Regras de exclusão de artefatos e credenciais
│
├── assets/
│   ├── css/
│   │   └── style.css             # Design System Dark Mode Glassmorphism
│   ├── js/
│   │   ├── data.js               # Dataset Gold consolidado com métricas e simulações
│   │   ├── d3_charts.js          # Módulos de visualização espacial e histogramas D3.js
│   │   └── app.js                # Orquestração do frontend, filtros e interações
│   └── img/
│       ├── hero_tactical_banner.jpg # Banner de identidade visual do projeto
│       ├── mplsoccer_shotmap.png    # Shot Map científico gerado em Python
│       └── mplsoccer_heatmap.png    # Heatmap KDE de finalizações
│
├── config/
│   └── settings.py               # Configurações globais e paths do projeto
│
├── data/
│   ├── bronze/                   # (Ignorado no Git) Dados brutos de APIs
│   ├── silver/                   # (Ignorado no Git) Dados normalizados
│   └── gold/
│       └── dataset_gold.json     # Star Schema unificado e calibrado
│
└── src/
    ├── database/
    │   ├── schema.sql            # DDL SQL completo para PostgreSQL / Supabase
    │   └── supabase_sync.py      # Sincronizador REST com o Supabase
    ├── ingestion/
    │   ├── football_data_ingest.py # Ingestão da Série A
    │   └── api_football_ingest.py  # Ingestão de dados detalhados
    ├── models/
    │   ├── clubes_metadata.py    # Cores oficiais, escudos e metadados
    │   ├── poisson_model.py      # Modelo preditivo bivariado de Poisson
    │   ├── monte_carlo.py        # Simulador estocástico de Monte Carlo
    │   └── xg_estimator.py       # Estimador trigonométrico de Expected Goals
    ├── pipeline/
    │   ├── build_dataset.py      # Orquestrador Bronze -> Silver -> Gold
    │   ├── fetch_market_odds.py  # Coletor e calculador de desmargem de odds
    │   └── official_player_photos.py # Resolução e mapeamento de atletas
    └── viz/
        └── generate_mplsoccer_charts.py # Gerador de visualizações científicas
```

---

## ⚡ Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/Robertofsouzas/brasileirao360.git
cd brasileirao360
```

### 2. Configurar o Ambiente Python
Recomenda-se o uso de um ambiente virtual:
```bash
python -m venv venv

# No Windows (PowerShell):
venv\Scripts\Activate.ps1

# No Linux/macOS:
source venv/bin/activate
```

Instale as dependências necessárias:
```bash
pip install -r requirements.txt
```

### 3. Visualizar o Dashboard Web
Para abrir a aplicação imediatamente no navegador:
```bash
python -m http.server 8080
```
Acesse no seu navegador: **[http://localhost:8080](http://localhost:8080)**

### 4. (Opcional) Reprocessar o Pipeline de Dados
Para atualizar as partidas, recalibrar o modelo de Poisson e rodar novamente as 10.000 simulações de Monte Carlo:
```bash
# 1. Configurar variáveis no .env (a partir do .env.example)
cp .env.example .env

# 2. Executar o pipeline de dados
python src/pipeline/build_dataset.py

# 3. Atualizar o arquivo data.js consumido pelo frontend
python assets/js/export_data_js.py
```

### 5. (Opcional) Sincronizar com o Supabase / PostgreSQL
1. Crie o schema dimensional executando o script `src/database/schema.sql` no SQL Editor do seu projeto Supabase.
2. Sincronize os dados processados:
```bash
python src/database/supabase_sync.py
```

---

## 📑 Governança & Contrato de Dados

Todo o tráfego de dados, esquemas de tabelas e definições de métricas são estritamente regidos pelo [**Contrato de Dados (data_contract.md)**](file:///c:/workspace-Projetos/Projeto_Analise-brasileiracao/data_contract.md), garantindo conformidade entre o pipeline Python, o banco de dados dimensional e o frontend interativo.

---

## 👨‍💻 Autor & Créditos

Desenvolvido por **Roberto Souza** (RFSTechs).

- **GitHub:** [@Robertofsouzas](https://github.com/Robertofsouzas)
- **Projeto:** [brasileirao360](https://github.com/Robertofsouzas/brasileirao360)

---

> *Este projeto é voltado para pesquisa analítica, demonstração de engenharia de dados e modelagem estatística esportiva.*
