/**
 * BRASILEIRÃO 360 — DOSSIÊ DO CONFRONTO (HEAD TO HEAD & PRÉ-JOGO)
 * 
 * Experiência Analítica Integrada:
 * 1. 📚 Passado: Histórico H2H real da API-Football (10-20 jogos com placares e estatísticas)
 * 2. 📊 Presente: Momento das equipes na Série A 2026 (indicadores táticos Gold)
 * 3. 🤖 Futuro: Previsão probabilística Poisson calibrada do Brasileirão 360
 * 
 * REGRAS METODOLÓGICAS:
 * - Zero dados inventados. Médias calculadas estritamente sobre dados existentes.
 * - Independência preditiva: histórico não altera artificialmente a Poisson.
 * - 100% offline-first no navegador: zero chamadas à API remota durante a navegação.
 */

// Estado global do dossiê em exibição
let currentDossierMatch = null;
let currentDossierScope = "brasileirao"; // 'brasileirao' | 'todos'

/* ==========================================================================
   1. Resolução e Extração de Dados H2H
   ========================================================================== */

/**
 * Obtém o histórico H2H do confronto a partir da Gold (ou fallback local).
 */
function getConfrontoData(homeTeam, awayTeam, data, preferredScope) {
  const h2hMap = data.historico_confrontos || {};
  const keyDirect = `${homeTeam}__${awayTeam}`;
  const keyReverse = `${awayTeam}__${homeTeam}`;

  let rawEntry = h2hMap[keyDirect];
  let isDirect = true;

  if (!rawEntry && h2hMap[keyReverse]) {
    rawEntry = h2hMap[keyReverse];
    isDirect = false;
  }

  // Se encontramos na Gold H2H oficial da API-Football
  if (rawEntry) {
    const hasBr = rawEntry.brasileirao && rawEntry.brasileirao.partidas && rawEntry.brasileirao.partidas.length > 0;
    const hasAll = rawEntry.todos && rawEntry.todos.partidas && rawEntry.todos.partidas.length > 0;

    // Determina o escopo ativo
    let activeScope = preferredScope || "brasileirao";
    if (activeScope === "brasileirao" && !hasBr && hasAll) {
      activeScope = "todos";
    }

    const scopeData = rawEntry[activeScope] || rawEntry.todos || { resumo: {}, partidas: [] };

    return {
      hasData: (scopeData.partidas && scopeData.partidas.length > 0),
      isApiSource: true,
      scope: activeScope,
      hasBrasileirao: hasBr,
      totalBrasileirao: hasBr ? rawEntry.brasileirao.partidas.length : 0,
      totalTodas: hasAll ? rawEntry.todos.partidas.length : 0,
      resumo: scopeData.resumo || {},
      partidas: scopeData.partidas || [],
      homeTeam,
      awayTeam
    };
  }

  // Fallback: busca em fato_partidas_todas da Série A 2026
  return getFallbackHeadToHead(homeTeam, awayTeam, data);
}

/**
 * Fallback resiliente usando as partidas da temporada atual (fato_partidas_todas).
 */
function getFallbackHeadToHead(homeTeam, awayTeam, data) {
  const allMatches = data.fato_partidas_todas || [];
  const finished = allMatches.filter(p => p.status === "FINISHED");

  const matches = finished.filter(p =>
    (p.mandante === homeTeam && p.visitante === awayTeam) ||
    (p.mandante === awayTeam && p.visitante === homeTeam)
  );

  matches.sort((a, b) => {
    if (b.rodada !== a.rodada) return b.rodada - a.rodada;
    return new Date(b.data_hora || 0) - new Date(a.data_hora || 0);
  });

  let winsHome = 0, winsAway = 0, draws = 0;
  let goalsHome = 0, goalsAway = 0;

  const standardizedMatches = matches.map(m => {
    const isHome = (m.mandante === homeTeam);
    const gHome = isHome ? m.gols_mandante : m.gols_visitante;
    const gAway = isHome ? m.gols_visitante : m.gols_mandante;

    goalsHome += gHome;
    goalsAway += gAway;

    let vencedor = "DRAW";
    if (gHome > gAway) {
      winsHome++;
      vencedor = "HOME";
    } else if (gAway > gHome) {
      winsAway++;
      vencedor = "AWAY";
    } else {
      draws++;
    }

    return {
      fixture_id: m.partida_id || Math.random(),
      data_iso: m.data_hora || "",
      data_formatada: m.data_formatada || `R${m.rodada} · 2026`,
      temporada: 2026,
      rodada: `Rodada ${m.rodada}`,
      competicao: "Brasileirão Série A",
      is_brasileirao: true,
      mandante: m.mandante,
      visitante: m.visitante,
      gols_mandante: m.gols_mandante,
      gols_visitante: m.gols_visitante,
      vencedor,
      estatisticas: null
    };
  });

  return {
    hasData: (standardizedMatches.length > 0),
    isApiSource: false,
    scope: "brasileirao",
    hasBrasileirao: (standardizedMatches.length > 0),
    totalBrasileirao: standardizedMatches.length,
    totalTodas: standardizedMatches.length,
    resumo: {
      total_jogos: standardizedMatches.length,
      vitorias_a: winsHome,
      vitorias_b: winsAway,
      empates: draws,
      gols_a: goalsHome,
      gols_b: goalsAway,
      jogos_com_estatisticas: 0,
      medias: {
        media_gols_a: standardizedMatches.length ? roundNum(goalsHome / standardizedMatches.length, 2) : 0,
        media_gols_b: standardizedMatches.length ? roundNum(goalsAway / standardizedMatches.length, 2) : 0
      }
    },
    partidas: standardizedMatches,
    homeTeam,
    awayTeam
  };
}

function roundNum(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/* ==========================================================================
   2. Renderização Principal do Dossiê do Confronto
   ========================================================================== */

/**
 * Renderiza o dossiê completo no contêiner #match-dossier-content.
 */
function renderMatchDossier(match, data, preferredScope) {
  const container = document.getElementById("match-dossier-content");
  if (!container) return;

  currentDossierMatch = match;
  if (preferredScope) currentDossierScope = preferredScope;

  const homeTeam = match.mandante;
  const awayTeam = match.visitante;

  const homeMeta = data.dim_clubes.find(c => c.nome_popular === homeTeam) || {};
  const awayMeta = data.dim_clubes.find(c => c.nome_popular === awayTeam) || {};

  // Previsão do modelo Poisson
  const pred = (typeof computePoisson === "function")
    ? computePoisson(homeTeam, awayTeam, data)
    : { probHomePct: "50.0", probDrawPct: "25.0", probAwayPct: "25.0", lambdaHome: "1.20", lambdaAway: "0.90", topScores: [], mandante: homeTeam, visitante: awayTeam };

  // Histórico H2H
  const h2h = getConfrontoData(homeTeam, awayTeam, data, currentDossierScope);
  currentDossierScope = h2h.scope;

  // Métricas táticas e classificação
  const homeMetrics = homeMeta.metricas_taticas || {};
  const awayMetrics = awayMeta.metricas_taticas || {};
  const homeStanding = data.tabela_classificacao.find(t => t.nome_popular === homeTeam) || {};
  const awayStanding = data.tabela_classificacao.find(t => t.nome_popular === awayTeam) || {};

  container.innerHTML = `
    <!-- Cabeçalho com Título, Confronto e Filtro de Competição -->
    ${renderDossierHeader(match, homeMeta, awayMeta, h2h)}

    <!-- BLOCO 1: Histórico do Confronto -->
    ${renderBlock1_History(h2h, homeMeta, awayMeta)}

    <!-- BLOCO 2: Últimos Confrontos -->
    ${renderBlock2_RecentMatches(h2h, homeMeta, awayMeta)}

    <!-- BLOCO 3: Estatísticas Históricas Médias -->
    ${renderBlock3_HistoricalStats(h2h, homeMeta, awayMeta)}

    <!-- BLOCO 4: Momento Atual (Série A 2026) -->
    ${renderBlock4_CurrentMoment(homeTeam, awayTeam, homeMetrics, awayMetrics, homeMeta, awayMeta, homeStanding, awayStanding)}

    <!-- BLOCO 5: Histórico x Momento Atual -->
    ${renderBlock5_HistoryVsMoment(h2h, homeMetrics, awayMetrics, homeStanding, awayStanding)}

    <!-- BLOCO 6: Previsão do Modelo do Brasileirão 360 -->
    ${renderBlock6_ModelPrediction(pred, homeMeta, awayMeta)}

    <!-- BLOCO 7: Resumo Inteligente ("O que os dados mostram?") -->
    ${renderBlock7_SmartSummary(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding)}

    <!-- Rodapé Metodológico -->
    ${renderDossierDisclaimer()}
  `;

  // Configura accordion de confrontos adicionais
  setupH2HAccordion();
}

/* ==========================================================================
   2.1. Cabeçalho e Seletor de Escopo de Competição
   ========================================================================== */
function renderDossierHeader(match, homeMeta, awayMeta, h2h) {
  const homeEscudo = match.mandante_escudo || homeMeta.escudo_url || "";
  const awayEscudo = match.visitante_escudo || awayMeta.escudo_url || "";

  return `
    <div class="dossier-matchup-header">
      <div class="dossier-team-showcase home">
        <img src="${homeEscudo}" alt="${match.mandante}" class="dossier-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
        <div class="dossier-team-info">
          <span class="dossier-team-role">MANDANTE</span>
          <h4 class="dossier-team-name">${match.mandante}</h4>
        </div>
      </div>

      <div class="dossier-center-badge">
        <span class="dossier-vs-chip">⚔️ VS</span>
        <span class="dossier-subtitle-note">Análise completa do confronto</span>
        <span class="dossier-date-chip">${match.data_formatada || "Data a definir"}</span>
      </div>

      <div class="dossier-team-showcase away">
        <div class="dossier-team-info" style="text-align: right;">
          <span class="dossier-team-role">VISITANTE</span>
          <h4 class="dossier-team-name">${match.visitante}</h4>
        </div>
        <img src="${awayEscudo}" alt="${match.visitante}" class="dossier-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
      </div>
    </div>

    <!-- Filtro por Competição (Brasileirão vs Todas as Competições) -->
    <div class="dossier-scope-bar">
      <div class="dossier-scope-label">
        <span>Filtro de Histórico:</span>
      </div>
      <div class="dossier-scope-buttons">
        <button type="button" class="dossier-scope-btn ${h2h.scope === 'brasileirao' ? 'active' : ''}" 
                onclick="window.setH2HScope('brasileirao')" title="Filtrar jogos do Campeonato Brasileiro">
          <span>🇧🇷 Brasileirão (${h2h.totalBrasileirao})</span>
        </button>
        <button type="button" class="dossier-scope-btn ${h2h.scope === 'todos' ? 'active' : ''}" 
                onclick="window.setH2HScope('todos')" title="Incluir todas as competições (Copa do Brasil, Libertadores, etc.)">
          <span>🌐 Todas as Competições (${h2h.totalTodas})</span>
        </button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.2. BLOCO 1: Histórico do Confronto
   ========================================================================== */
function renderBlock1_History(h2h, homeMeta, awayMeta) {
  const home = h2h.homeTeam;
  const away = h2h.awayTeam;
  const resumo = h2h.resumo || {};

  const total = resumo.total_jogos || 0;
  const winsA = resumo.vitorias_a || 0;
  const winsB = resumo.vitorias_b || 0;
  const draws = resumo.empates || 0;
  const goalsA = resumo.gols_a || 0;
  const goalsB = resumo.gols_b || 0;

  if (total === 0) {
    return `
      <div class="dossier-block">
        <div class="dossier-block-header">
          <span class="dossier-block-icon">📚</span>
          <div>
            <h5 class="dossier-block-title">Histórico do confronto</h5>
            <p class="dossier-block-subtitle">Retrospecto direto entre as duas equipes</p>
          </div>
        </div>
        <div class="dossier-empty-state">
          <span style="font-size: 1.5rem;">ℹ️</span>
          <p>Não encontramos confrontos anteriores suficientes nos dados disponíveis para este duelo.</p>
          <small>O simulador e a previsão estatística abaixo continuam operando normalmente com dados da temporada atual.</small>
        </div>
      </div>
    `;
  }

  const pctA = total ? Math.round((winsA / total) * 100) : 0;
  const pctDraw = total ? Math.round((draws / total) * 100) : 0;
  const pctB = total ? (100 - pctA - pctDraw) : 0;

  let balanceText = "";
  if (winsA > winsB) {
    balanceText = `<strong style="color: var(--accent-green);">${home}</strong> tem vantagem com ${winsA} vitórias contra ${winsB} do ${away}.`;
  } else if (winsB > winsA) {
    balanceText = `<strong style="color: var(--accent-purple);">${away}</strong> tem vantagem com ${winsB} vitórias contra ${winsA} do ${home}.`;
  } else {
    balanceText = `Retrospecto equilibrado com ${winsA} vitórias para cada lado e ${draws} empates.`;
  }

  const scopeLabel = h2h.scope === "brasileirao" ? "Série A" : "Todas as competições";
  const limitNote = total > 10 ? `Últimos ${Math.min(total, 20)} jogos analisados` : `${total} confrontos registrados`;

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">📚</span>
        <div>
          <h5 class="dossier-block-title">Histórico do confronto</h5>
          <p class="dossier-block-subtitle">${limitNote} · ${scopeLabel}</p>
        </div>
      </div>

      <!-- Placar de Vitórias e Empates -->
      <div class="dossier-h2h-grid">
        <div class="dossier-h2h-card home">
          <span class="h2h-card-val">${winsA}</span>
          <span class="h2h-card-label">VITÓRIAS</span>
          <span class="h2h-card-team">${home}</span>
          <span class="h2h-card-sub">${goalsA} gols marcados (${roundNum(goalsA / Math.max(total, 1), 2)}/jogo)</span>
        </div>

        <div class="dossier-h2h-card draw">
          <span class="h2h-card-val">${draws}</span>
          <span class="h2h-card-label">EMPATES</span>
          <span class="h2h-card-team">Igualdade</span>
          <span class="h2h-card-sub">${pctDraw}% dos jogos</span>
        </div>

        <div class="dossier-h2h-card away">
          <span class="h2h-card-val">${winsB}</span>
          <span class="h2h-card-label">VITÓRIAS</span>
          <span class="h2h-card-team">${away}</span>
          <span class="h2h-card-sub">${goalsB} gols marcados (${roundNum(goalsB / Math.max(total, 1), 2)}/jogo)</span>
        </div>
      </div>

      <!-- Barra de Dominância Proporcional -->
      <div class="dossier-dominance-bar-wrapper">
        <div class="dossier-dominance-bar">
          <div class="dom-seg-home" style="width: ${pctA}%;" title="${home}: ${winsA} vitórias (${pctA}%)"></div>
          <div class="dom-seg-draw" style="width: ${pctDraw}%;" title="Empates: ${draws} (${pctDraw}%)"></div>
          <div class="dom-seg-away" style="width: ${pctB}%;" title="${away}: ${winsB} vitórias (${pctB}%)"></div>
        </div>
      </div>

      <div class="dossier-h2h-summary-note">
        <span>⚖️ ${balanceText} Saldo total de gols: <strong>${goalsA}</strong> (${home}) × <strong>${goalsB}</strong> (${away}).</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.3. BLOCO 2: Últimos Confrontos (Lista Visual)
   ========================================================================== */
function renderBlock2_RecentMatches(h2h, homeMeta, awayMeta) {
  const partidas = h2h.partidas || [];
  if (partidas.length === 0) return "";

  const home = h2h.homeTeam;
  const away = h2h.awayTeam;

  const displayMatches = partidas.slice(0, 5);
  const hiddenMatches = partidas.slice(5, 20);

  function renderRow(m) {
    const isHomeMandante = (m.mandante === home);
    const gHome = isHomeMandante ? m.gols_mandante : m.gols_visitante;
    const gAway = isHomeMandante ? m.gols_visitante : m.gols_mandante;

    let badgeClass = "badge-draw";
    let badgeText = "Empate";
    if (gHome > gAway) {
      badgeClass = "badge-win-home";
      badgeText = `Vitória ${home}`;
    } else if (gAway > gHome) {
      badgeClass = "badge-win-away";
      badgeText = `Vitória ${away}`;
    }

    const compTag = m.is_brasileirao ? "🇧🇷 Série A" : (m.competicao || "Oficial");

    return `
      <div class="dossier-match-row">
        <div class="match-row-meta">
          <span class="match-row-date">${m.data_formatada || m.data_iso.slice(0, 10)}</span>
          <span class="match-row-comp">${compTag}</span>
        </div>

        <div class="match-row-scoreline">
          <div class="match-row-team home ${isHomeMandante ? 'current-mandante' : ''}">
            <span>${m.mandante}</span>
          </div>
          <div class="match-row-score-chip">
            <span class="score-val">${m.gols_mandante}</span>
            <span class="score-x">×</span>
            <span class="score-val">${m.gols_visitante}</span>
          </div>
          <div class="match-row-team away ${!isHomeMandante ? 'current-mandante' : ''}">
            <span>${m.visitante}</span>
          </div>
        </div>

        <div class="match-row-outcome">
          <span class="outcome-chip ${badgeClass}">${badgeText}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">⏱️</span>
        <div>
          <h5 class="dossier-block-title">Últimos confrontos</h5>
          <p class="dossier-block-subtitle">Resultados diretos mais recentes em ordem cronológica</p>
        </div>
      </div>

      <div class="dossier-matches-list" id="h2h-matches-list">
        ${displayMatches.map(renderRow).join("")}
      </div>

      ${hiddenMatches.length > 0 ? `
        <div id="h2h-hidden-matches" style="display: none;">
          ${hiddenMatches.map(renderRow).join("")}
        </div>
        <div style="text-align: center; margin-top: 12px;">
          <button type="button" class="h2h-accordion-btn" id="h2h-expand-btn">
            <span>Ver todos os ${partidas.length} confrontos</span>
            <span class="expand-arrow">▼</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

/* ==========================================================================
   2.4. BLOCO 3: Estatísticas Históricas Médias
   ========================================================================== */
function renderBlock3_HistoricalStats(h2h, homeMeta, awayMeta) {
  const resumo = h2h.resumo || {};
  const medias = resumo.medias || {};
  const total = resumo.total_jogos || 0;
  const statsCount = resumo.jogos_com_estatisticas || 0;

  if (total === 0) return "";

  const home = h2h.homeTeam;
  const away = h2h.awayTeam;

  // Monta lista de métricas disponíveis
  const statRows = [
    {
      label: "Gols por jogo",
      valA: medias.media_gols_a ?? "-",
      valB: medias.media_gols_b ?? "-",
      unit: "",
      icon: "⚽",
      coverage: total
    }
  ];

  if (statsCount > 0) {
    statRows.push(
      {
        label: "Posse de bola média",
        valA: medias.media_posse_a ? `${medias.media_posse_a}%` : "-",
        valB: medias.media_posse_b ? `${medias.media_posse_b}%` : "-",
        unit: "%",
        icon: "⏱️",
        coverage: statsCount
      },
      {
        label: "Finalizações totais",
        valA: medias.media_chutes_a ?? "-",
        valB: medias.media_chutes_b ?? "-",
        unit: "",
        icon: "🎯",
        coverage: statsCount
      },
      {
        label: "Chutes no alvo",
        valA: medias.media_chutes_alvo_a ?? "-",
        valB: medias.media_chutes_alvo_b ?? "-",
        unit: "",
        icon: "🧤",
        coverage: statsCount
      },
      {
        label: "Escanteios médios",
        valA: medias.media_escanteios_a ?? "-",
        valB: medias.media_escanteios_b ?? "-",
        unit: "",
        icon: "🚩",
        coverage: statsCount
      },
      {
        label: "Faltas cometidas",
        valA: medias.media_faltas_a ?? "-",
        valB: medias.media_faltas_b ?? "-",
        unit: "",
        icon: "🛑",
        coverage: statsCount
      },
      {
        label: "Cartões por jogo",
        valA: medias.media_cartoes_a ?? "-",
        valB: medias.media_cartoes_b ?? "-",
        unit: "",
        icon: "🟨",
        coverage: statsCount
      }
    );
  }

  const transparencyNote = statsCount > 0
    ? `Médias calculadas estritamente com base nos <strong>${statsCount}</strong> de <strong>${total}</strong> confrontos com estatísticas detalhadas registradas na base oficial.`
    : `Médias de gols calculadas com base em todos os <strong>${total}</strong> confrontos. Estatísticas detalhadas de posse e finalizações indisponíveis para partidas mais antigas deste duelo.`;

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">📊</span>
        <div>
          <h5 class="dossier-block-title">Médias nos últimos confrontos</h5>
          <p class="dossier-block-subtitle">Comportamento estatístico direto entre ${home} e ${away}</p>
        </div>
      </div>

      <div class="dossier-stats-table-wrapper">
        <table class="dossier-stats-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 40%;">${home}</th>
              <th style="text-align: center; width: 20%;">Métrica</th>
              <th style="text-align: right; width: 40%;">${away}</th>
            </tr>
          </thead>
          <tbody>
            ${statRows.map(row => `
              <tr>
                <td style="text-align: left; font-weight: 700; color: var(--accent-green);">
                  ${row.valA}
                </td>
                <td style="text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
                  <span style="opacity: 0.7; margin-right: 4px;">${row.icon}</span>
                  ${row.label}
                </td>
                <td style="text-align: right; font-weight: 700; color: var(--accent-purple);">
                  ${row.valB}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="dossier-stat-disclaimer">
        <span>ℹ️ ${transparencyNote}</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.5. BLOCO 4: Momento Atual (Série A 2026)
   ========================================================================== */
function renderBlock4_CurrentMoment(homeTeam, awayTeam, homeMetrics, awayMetrics, homeMeta, awayMeta, homeStanding, awayStanding) {
  const metricsList = [
    { label: "Gols por jogo", valHome: homeMetrics.media_gols_pro, valAway: awayMetrics.media_gols_pro, unit: "", maxVal: 2.5, icon: "⚽" },
    { label: "Gols sofridos/jogo", valHome: homeMetrics.media_gols_contra, valAway: awayMetrics.media_gols_contra, unit: "", maxVal: 2.5, icon: "🛡️", invert: true },
    { label: "xG médio", valHome: homeMetrics.xg_pro_medio, valAway: awayMetrics.xg_pro_medio, unit: "", maxVal: 2.5, icon: "📈" },
    { label: "xGA médio", valHome: homeMetrics.xg_contra_medio, valAway: awayMetrics.xg_contra_medio, unit: "", maxVal: 2.5, icon: "📉", invert: true },
    { label: "Posse média", valHome: homeMetrics.media_posse_bola_pct, valAway: awayMetrics.media_posse_bola_pct, unit: "%", maxVal: 65, icon: "⏱️" },
    { label: "Chutes por jogo", valHome: homeMetrics.media_chutes_jogo, valAway: awayMetrics.media_chutes_jogo, unit: "", maxVal: 20, icon: "🎯" },
    { label: "Chutes no alvo/jogo", valHome: homeMetrics.media_chutes_alvo, valAway: awayMetrics.media_chutes_alvo, unit: "", maxVal: 8, icon: "🎯" },
    { label: "Conversão de chutes", valHome: homeMetrics.conversao_chutes_pct, valAway: awayMetrics.conversao_chutes_pct, unit: "%", maxVal: 20, icon: "💥" }
  ];

  const homePos = homeStanding.posicao || "-";
  const awayPos = awayStanding.posicao || "-";
  const homePts = homeStanding.pontos || "-";
  const awayPts = awayStanding.pontos || "-";
  const homeApr = homeStanding.aproveitamento_pct ? `${homeStanding.aproveitamento_pct}%` : "-";
  const awayApr = awayStanding.aproveitamento_pct ? `${awayStanding.aproveitamento_pct}%` : "-";

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">⚡</span>
        <div>
          <h5 class="dossier-block-title">Momento atual</h5>
          <p class="dossier-block-subtitle">Desempenho e indicadores táticos oficiais na Série A 2026</p>
        </div>
      </div>

      <!-- Mini Tabela de Posição -->
      <div class="dossier-standing-summary">
        <div class="standing-pill home">
          <span class="standing-pos">${homePos}º lugar</span>
          <span class="standing-team">${homeTeam}</span>
          <span class="standing-pts">${homePts} pts · ${homeApr} aprov.</span>
        </div>
        <div class="standing-vs">VS</div>
        <div class="standing-pill away">
          <span class="standing-pos">${awayPos}º lugar</span>
          <span class="standing-team">${awayTeam}</span>
          <span class="standing-pts">${awayPts} pts · ${awayApr} aprov.</span>
        </div>
      </div>

      <!-- Barras Comparativas de Métricas Táticas -->
      <div class="dossier-tactical-bars">
        ${metricsList.map(m => {
          const vH = m.valHome || 0;
          const vA = m.valAway || 0;
          const pctH = Math.min(Math.round((vH / m.maxVal) * 100), 100);
          const pctA = Math.min(Math.round((vA / m.maxVal) * 100), 100);

          return `
            <div class="dossier-metric-row">
              <div class="metric-row-header">
                <span class="val-home">${vH}${m.unit}</span>
                <span class="metric-title">${m.icon} ${m.label}</span>
                <span class="val-away">${vA}${m.unit}</span>
              </div>
              <div class="metric-bars-track">
                <div class="track-home">
                  <div class="bar-fill home" style="width: ${pctH}%;"></div>
                </div>
                <div class="track-away">
                  <div class="bar-fill away" style="width: ${pctA}%;"></div>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.6. BLOCO 5: Histórico × Momento Atual (Camada Interpretativa)
   ========================================================================== */
function renderBlock5_HistoryVsMoment(h2h, homeMetrics, awayMetrics, homeStanding, awayStanding) {
  const home = h2h.homeTeam;
  const away = h2h.awayTeam;
  const resumo = h2h.resumo || {};

  const winsA = resumo.vitorias_a || 0;
  const winsB = resumo.vitorias_b || 0;
  const totalH2H = resumo.total_jogos || 0;

  const posA = homeStanding.posicao || 10;
  const posB = awayStanding.posicao || 10;
  const ptsA = homeStanding.pontos || 0;
  const ptsB = awayStanding.pontos || 0;

  const xgA = homeMetrics.xg_pro_medio || 1.3;
  const xgB = awayMetrics.xg_pro_medio || 1.1;

  let text = "";

  if (totalH2H === 0) {
    text = `Sem histórico de confrontos anteriores registrado na base. A análise pré-jogo fundamenta-se integralmente no momento competitivo de 2026, onde o ${home} (${posA}º) e o ${away} (${posB}º) se enfrentam sob o peso do mando de campo.`;
  } else if (winsA > winsB && posA < posB) {
    text = `<strong>Alinhamento histórico e atual:</strong> O <strong>${home}</strong> domina o retrospecto recente (${winsA} vitórias contra ${winsB}) e também atravessa momento superior na Série A 2026 (${posA}º com ${ptsA} pts vs ${posB}º com ${ptsB} pts). O histórico favorável consolida a vantagem estatística indicada pelo modelo.`;
  } else if (winsB > winsA && posA < posB) {
    text = `<strong>Divergência relevante:</strong> Embora o <strong>${away}</strong> tenha retrospecto histórico superior (${winsB} vitórias contra ${winsA}), os indicadores da temporada 2026 mostram o <strong>${home}</strong> em momento muito mais consistente (${posA}º com ${ptsA} pts contra ${posB}º do adversário). O modelo prioriza os números recentes da temporada.`;
  } else if (winsA > winsB && posB < posA) {
    text = `<strong>Tabu em jogo:</strong> O <strong>${home}</strong> tem histórico recente favorável (${winsA} vitórias contra ${winsB}), mas na Série A 2026 o <strong>${away}</strong> vive fase superior (${posB}º com ${ptsB} pts contra ${posA}º com ${ptsA} pts). O confronto coloca à prova o retrospecto histórico diante do momento presente.`;
  } else {
    text = `<strong>Equilíbrio acentuado:</strong> O histórico direto aponta paridade (${winsA} vitórias para ${home}, ${winsB} para ${away}), e a diferença na tabela em 2026 (${Math.abs(ptsA - ptsB)} pontos) reforça a expectativa de um jogo disputado, onde o fator mando de campo exerce papel preponderante.`;
  }

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">⚖️</span>
        <div>
          <h5 class="dossier-block-title">Histórico × Momento atual</h5>
          <p class="dossier-block-subtitle">O que chama a atenção ao cruzar passado e presente?</p>
        </div>
      </div>

      <div class="dossier-insight-card">
        <span class="insight-icon">🔍</span>
        <div class="insight-text">
          <p>${text}</p>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.7. BLOCO 6: Previsão do Modelo do Brasileirão 360
   ========================================================================== */
function renderBlock6_ModelPrediction(pred, homeMeta, awayMeta) {
  const home = pred.mandante;
  const away = pred.visitante;

  const pH = parseFloat(pred.probHomePct);
  const pD = parseFloat(pred.probDrawPct);
  const pA = parseFloat(pred.probAwayPct);

  let favoriteName = "Empate mais provável";
  let favoriteColor = "var(--accent-gold)";
  if (pH >= pD && pH >= pA) {
    favoriteName = `Favoritismo: ${home}`;
    favoriteColor = "var(--accent-green)";
  } else if (pA >= pD && pA >= pH) {
    favoriteName = `Favoritismo: ${away}`;
    favoriteColor = "var(--accent-purple)";
  }

  const topScores = pred.topScores ? pred.topScores.slice(0, 5) : [];

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">🤖</span>
        <div>
          <h5 class="dossier-block-title">Previsão do Brasileirão 360</h5>
          <p class="dossier-block-subtitle">Modelo estatístico de Poisson calibrado com dados da Série A 2026</p>
        </div>
      </div>

      <!-- Cards de Probabilidade 1X2 -->
      <div class="dossier-pred-grid">
        <div class="dossier-pred-card home ${pH >= pD && pH >= pA ? 'fav-highlight' : ''}">
          <span class="pred-label">Vitória Mandante</span>
          <span class="pred-val" style="color: var(--accent-green);">${pred.probHomePct}%</span>
          <span class="pred-team">${home}</span>
          <span class="pred-lambda">Exp. Gols: <strong>${pred.lambdaHome}</strong></span>
        </div>

        <div class="dossier-pred-card draw ${pD >= pH && pD >= pA ? 'fav-highlight' : ''}">
          <span class="pred-label">Empate</span>
          <span class="pred-val" style="color: var(--accent-gold);">${pred.probDrawPct}%</span>
          <span class="pred-team">Igualdade</span>
          <span class="pred-lambda">Placares baixos</span>
        </div>

        <div class="dossier-pred-card away ${pA >= pD && pA >= pH ? 'fav-highlight' : ''}">
          <span class="pred-label">Vitória Visitante</span>
          <span class="pred-val" style="color: var(--accent-purple);">${pred.probAwayPct}%</span>
          <span class="pred-team">${away}</span>
          <span class="pred-lambda">Exp. Gols: <strong>${pred.lambdaAway}</strong></span>
        </div>
      </div>

      <!-- Top Placares Prováveis -->
      <div class="dossier-top-scores-box">
        <span class="top-scores-title">Top 5 Placares Mais Prováveis:</span>
        <div class="scores-chips-row">
          ${topScores.map((s, idx) => {
            const placar = s.placar || s.score || "-";
            const probNum = typeof s.prob === 'number' ? s.prob.toFixed(1) : s.prob;
            return `
              <div class="score-chip-item ${idx === 0 ? 'top-1' : ''}">
                <span class="chip-score">${placar}</span>
                <span class="chip-prob">${probNum}%</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.8. BLOCO 7: Resumo Inteligente ("O que os dados mostram?")
   ========================================================================== */
function renderBlock7_SmartSummary(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding) {
  const home = h2h.homeTeam;
  const away = h2h.awayTeam;
  const resumo = h2h.resumo || {};

  const total = resumo.total_jogos || 0;
  const winsA = resumo.vitorias_a || 0;
  const winsB = resumo.vitorias_b || 0;
  const goalsA = resumo.gols_a || 0;
  const goalsB = resumo.gols_b || 0;

  const pH = parseFloat(pred.probHomePct);
  const pA = parseFloat(pred.probAwayPct);

  let pastPart = "";
  if (total > 0) {
    if (winsA > winsB) {
      pastPart = `O <strong>${home}</strong> venceu <strong>${winsA}</strong> dos últimos <strong>${total}</strong> confrontos diretos e marcou <strong>${goalsA}</strong> gols no período (contra <strong>${goalsB}</strong> do ${away}).`;
    } else if (winsB > winsA) {
      pastPart = `O <strong>${away}</strong> leva vantagem no retrospecto com <strong>${winsB}</strong> vitórias em <strong>${total}</strong> jogos e <strong>${goalsB}</strong> gols marcados.`;
    } else {
      pastPart = `O retrospecto recente apresenta equilíbrio estrito, com <strong>${winsA}</strong> vitórias para cada lado e saldo de gols de <strong>${goalsA} × ${goalsB}</strong> em <strong>${total}</strong> partidas.`;
    }
  } else {
    pastPart = `Este duelo não possui histórico de confrontos anteriores consolidado na base.`;
  }

  let presentPart = "";
  const xgA = homeMetrics.xg_pro_medio || 1.0;
  const xgB = awayMetrics.xg_pro_medio || 1.0;
  if (xgA > xgB * 1.15) {
    presentPart = `Na atual temporada de 2026, o <strong>${home}</strong> demonstra superioridade em volume ofensivo e qualidade de chances (xG médio de ${xgA} vs ${xgB}).`;
  } else if (xgB > xgA * 1.15) {
    presentPart = `Em 2026, o <strong>${away}</strong> tem produzido oportunidades com maior consistência (xG médio de ${xgB} vs ${xgA}).`;
  } else {
    presentPart = `Na Série A 2026, ambas as equipes mantêm produção ofensiva próxima (xG de ${xgA} vs ${xgB}).`;
  }

  let futurePart = "";
  if (pH > pA) {
    futurePart = `O modelo estatístico do Brasileirão 360 aponta <strong>${home}</strong> como favorito com <strong>${pred.probHomePct}%</strong> de chance de vitória, frente a <strong>${pred.probAwayPct}%</strong> do adversário e <strong>${pred.probDrawPct}%</strong> de empate.`;
  } else if (pA > pH) {
    futurePart = `O modelo do Brasileirão 360 projeta favoritismo para o <strong>${away}</strong> (<strong>${pred.probAwayPct}%</strong>), contra <strong>${pred.probHomePct}%</strong> do mandante.`;
  } else {
    futurePart = `O modelo projeta probabilidade equilibrada com forte tendência a empate (<strong>${pred.probDrawPct}%</strong>).`;
  }

  return `
    <div class="dossier-block dossier-smart-summary-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">🧠</span>
        <div>
          <h5 class="dossier-block-title">O que os dados mostram?</h5>
          <p class="dossier-block-subtitle">Síntese narrativa integrada: Passado · Presente · Futuro</p>
        </div>
      </div>

      <div class="smart-summary-card">
        <p class="summary-paragraph">
          ${pastPart} ${presentPart} ${futurePart}
        </p>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.9. Rodapé e Nota de Responsabilidade Metodológica
   ========================================================================== */
function renderDossierDisclaimer() {
  return `
    <div class="dossier-disclaimer-box">
      <span style="font-size: 1.1rem; opacity: 0.85;">🛡️</span>
      <p>
        <strong>Atenção metodológica:</strong> O histórico de confrontos é puramente contextual. Nosso modelo preditivo baseia-se no momento das equipes na Série A 2026 (ataque, defesa e mando de campo), garantindo estimativas estatisticamente fundamentadas sem contaminação por dados de temporadas distantes.
      </p>
    </div>
  `;
}

/* ==========================================================================
   3. Interatividade e Controles
   ========================================================================== */

/**
 * Altera o escopo do H2H ('brasileirao' ou 'todos') e re-renderiza o dossiê.
 */
window.setH2HScope = function(scope) {
  if (!currentDossierMatch || !window.BRASILEIRAO_DATA) return;
  currentDossierScope = scope;
  renderMatchDossier(currentDossierMatch, window.BRASILEIRAO_DATA, scope);
};

/**
 * Abre o dossiê para a partida selecionada.
 */
function openMatchDossier(match, data) {
  const panel = document.getElementById("match-dossier-panel");
  if (!panel) return;

  currentDossierMatch = match;
  renderMatchDossier(match, data, currentDossierScope);

  panel.style.display = "block";
  requestAnimationFrame(() => {
    panel.classList.add("open");
  });
}

/**
 * Fecha suavemente o dossiê.
 */
window.closeMatchDossier = function(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }
  const panel = document.getElementById("match-dossier-panel");
  if (panel) {
    panel.classList.remove("open");
    setTimeout(() => {
      panel.style.display = "none";
    }, 300);
  }
};

/**
 * Accordion para expandir/recolher confrontos antigos.
 */
function setupH2HAccordion() {
  const btn = document.getElementById("h2h-expand-btn");
  const hidden = document.getElementById("h2h-hidden-matches");
  if (!btn || !hidden) return;

  let expanded = false;
  btn.addEventListener("click", () => {
    expanded = !expanded;
    hidden.style.display = expanded ? "block" : "none";
    const arrow = btn.querySelector(".expand-arrow");
    if (arrow) arrow.textContent = expanded ? "▲" : "▼";
    const textSpan = btn.querySelector("span:first-child");
    if (textSpan) {
      textSpan.textContent = expanded ? "Mostrar menos" : "Ver todos os confrontos";
    }
  });
}
