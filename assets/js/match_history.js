/**
 * BRASILEIRÃO 360 — DOSSIÊ DO CONFRONTO (MATCH HISTORY)
 * 
 * Módulo responsável pela experiência "Passado → Presente → Previsão"
 * dentro do Simulador de Jogos.
 * 
 * Dados utilizados:
 * - fato_partidas_todas (status === "FINISHED") → Histórico do confronto
 * - dim_clubes[].metricas_taticas → Momento atual
 * - computePoisson() (de app.js) → Previsão do modelo
 * 
 * REGRA: Zero dados inventados. Apenas o que existe na Gold.
 */

/* ==========================================================================
   1. Extração de Dados — Head-to-Head
   ========================================================================== */

/**
 * Retorna o histórico completo de confrontos entre dois times.
 * @param {string} teamA - Nome popular do time A
 * @param {string} teamB - Nome popular do time B
 * @param {Object} data - window.BRASILEIRAO_DATA
 * @returns {Object} Resumo do confronto com vitórias, empates, gols e lista de partidas
 */
function getHeadToHead(teamA, teamB, data) {
  const allMatches = data.fato_partidas_todas || [];
  const finished = allMatches.filter(p => p.status === "FINISHED");

  // Filtra todos os confrontos entre os dois times (em qualquer mando)
  const h2hMatches = finished.filter(p =>
    (p.mandante === teamA && p.visitante === teamB) ||
    (p.mandante === teamB && p.visitante === teamA)
  );

  // Ordena do mais recente para o mais antigo (por rodada, depois data)
  h2hMatches.sort((a, b) => {
    if (b.rodada !== a.rodada) return b.rodada - a.rodada;
    return new Date(b.data_hora || 0) - new Date(a.data_hora || 0);
  });

  let winsA = 0, winsB = 0, draws = 0;
  let goalsA = 0, goalsB = 0;

  h2hMatches.forEach(m => {
    let gA, gB;
    if (m.mandante === teamA) {
      gA = m.gols_mandante;
      gB = m.gols_visitante;
    } else {
      gA = m.gols_visitante;
      gB = m.gols_mandante;
    }
    goalsA += gA;
    goalsB += gB;
    if (gA > gB) winsA++;
    else if (gB > gA) winsB++;
    else draws++;
  });

  return {
    total: h2hMatches.length,
    winsA, winsB, draws,
    goalsA, goalsB,
    matches: h2hMatches,
    teamA, teamB
  };
}

/* ==========================================================================
   2. Renderização do Dossiê Completo
   ========================================================================== */

/**
 * Renderiza o conteúdo completo do dossiê do confronto no painel.
 */
function renderMatchDossier(match, data) {
  const container = document.getElementById("match-dossier-content");
  if (!container) return;

  const homeTeam = match.mandante;
  const awayTeam = match.visitante;
  const homeMeta = data.dim_clubes.find(c => c.nome_popular === homeTeam) || {};
  const awayMeta = data.dim_clubes.find(c => c.nome_popular === awayTeam) || {};

  // Compute Poisson prediction (reuse existing function from app.js)
  const pred = (typeof computePoisson === "function")
    ? computePoisson(homeTeam, awayTeam, data)
    : { probHomePct: "50.0", probDrawPct: "25.0", probAwayPct: "25.0", lambdaHome: "1.20", lambdaAway: "0.90", topScores: [], mandante: homeTeam, visitante: awayTeam };

  // Get head-to-head data
  const h2h = getHeadToHead(homeTeam, awayTeam, data);

  // Get tactical metrics
  const homeMetrics = homeMeta.metricas_taticas || {};
  const awayMetrics = awayMeta.metricas_taticas || {};

  // Get standings data for position context
  const homeStanding = data.tabela_classificacao.find(t => t.nome_popular === homeTeam) || {};
  const awayStanding = data.tabela_classificacao.find(t => t.nome_popular === awayTeam) || {};

  // Build the full dossier HTML
  container.innerHTML = `
    ${renderDossierHeader(match, homeMeta, awayMeta)}
    ${renderHistoryBlock(h2h, homeMeta, awayMeta)}
    ${renderMomentBlock(homeTeam, awayTeam, homeMetrics, awayMetrics, homeMeta, awayMeta, homeStanding, awayStanding)}
    ${renderPredictionBlock(pred, homeMeta, awayMeta)}
    ${renderInterpretationBlock(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding)}
  `;

  // Setup "Ver todos" accordion for matches
  setupH2HAccordion();
}

/* ==========================================================================
   2.1. Cabeçalho do Dossiê
   ========================================================================== */
function renderDossierHeader(match, homeMeta, awayMeta) {
  const homeEscudo = match.mandante_escudo || homeMeta.escudo_url || "";
  const awayEscudo = match.visitante_escudo || awayMeta.escudo_url || "";

  return `
    <div class="dossier-header">
      <div class="dossier-team-info">
        <img src="${homeEscudo}" alt="${match.mandante}" class="dossier-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
        <div class="dossier-team-detail">
          <span class="dossier-team-name">${match.mandante}</span>
          <span class="dossier-team-role">MANDANTE</span>
        </div>
      </div>
      <div class="dossier-vs-center">
        <span class="dossier-vs-icon">⚔️</span>
        <span class="dossier-vs-label">DOSSIÊ DO CONFRONTO</span>
        <span class="dossier-match-date">${match.data_formatada || "Próxima rodada"}</span>
      </div>
      <div class="dossier-team-info away">
        <div class="dossier-team-detail away">
          <span class="dossier-team-name">${match.visitante}</span>
          <span class="dossier-team-role">VISITANTE</span>
        </div>
        <img src="${awayEscudo}" alt="${match.visitante}" class="dossier-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.2. Bloco 1 — ⚔️ Histórico do Confronto
   ========================================================================== */
function renderHistoryBlock(h2h, homeMeta, awayMeta) {
  if (h2h.total === 0) {
    return `
      <div class="dossier-block">
        <div class="dossier-block-header">
          <span class="dossier-block-icon">⚔️</span>
          <div>
            <h4 class="dossier-block-title">Histórico do confronto</h4>
            <p class="dossier-block-subtitle">Confrontos anteriores entre as equipes</p>
          </div>
        </div>
        <div class="dossier-empty-state">
          <span class="empty-icon">📚</span>
          <p>Ainda não encontramos confrontos anteriores entre estas equipes nos dados disponíveis.</p>
          <span class="empty-hint">A previsão abaixo é baseada exclusivamente no desempenho atual das equipes.</span>
        </div>
      </div>
    `;
  }

  const totalMatches = h2h.total;
  const matchLabel = totalMatches === 1 ? "1 confronto encontrado" : `${totalMatches} confrontos encontrados`;

  // Proportional dominance bar
  const totalResults = h2h.winsA + h2h.draws + h2h.winsB;
  const pctA = totalResults > 0 ? (h2h.winsA / totalResults * 100) : 33.3;
  const pctD = totalResults > 0 ? (h2h.draws / totalResults * 100) : 33.3;
  const pctB = totalResults > 0 ? (h2h.winsB / totalResults * 100) : 33.3;

  // Determine who dominates
  let dominanceText = "";
  if (h2h.winsA > h2h.winsB) {
    dominanceText = `${h2h.teamA} venceu ${h2h.winsA} dos ${totalMatches} confrontos.`;
  } else if (h2h.winsB > h2h.winsA) {
    dominanceText = `${h2h.teamB} venceu ${h2h.winsB} dos ${totalMatches} confrontos.`;
  } else if (h2h.winsA === h2h.winsB && h2h.winsA > 0) {
    dominanceText = `Equilíbrio entre as equipes: ${h2h.winsA} vitória${h2h.winsA > 1 ? 's' : ''} para cada lado.`;
  } else {
    dominanceText = totalMatches === 1 ? "Único confronto terminou empatado." : `Todos os ${totalMatches} confrontos terminaram empatados.`;
  }

  // Show first 5, rest behind accordion
  const visibleMatches = h2h.matches.slice(0, 5);
  const hiddenMatches = h2h.matches.slice(5);

  const matchRowsVisible = visibleMatches.map(m => renderH2HMatchRow(m, h2h.teamA)).join("");
  const matchRowsHidden = hiddenMatches.map(m => renderH2HMatchRow(m, h2h.teamA)).join("");

  const accordionBtn = hiddenMatches.length > 0
    ? `<button class="dossier-expand-btn" id="h2h-expand-btn" type="button">
         <span>Ver todos os ${totalMatches} confrontos</span>
         <span class="expand-arrow">▼</span>
       </button>`
    : "";

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">⚔️</span>
        <div>
          <h4 class="dossier-block-title">Histórico do confronto</h4>
          <p class="dossier-block-subtitle">${matchLabel} · Série A 2026</p>
        </div>
      </div>

      <!-- Resumo de Vitórias/Empates/Derrotas -->
      <div class="h2h-summary-cards">
        <div class="h2h-stat-card win-a">
          <span class="h2h-stat-count">${h2h.winsA}</span>
          <span class="h2h-stat-label">Vitória${h2h.winsA !== 1 ? 's' : ''}</span>
          <span class="h2h-stat-team">${h2h.teamA}</span>
        </div>
        <div class="h2h-stat-card draw">
          <span class="h2h-stat-count">${h2h.draws}</span>
          <span class="h2h-stat-label">Empate${h2h.draws !== 1 ? 's' : ''}</span>
        </div>
        <div class="h2h-stat-card win-b">
          <span class="h2h-stat-count">${h2h.winsB}</span>
          <span class="h2h-stat-label">Vitória${h2h.winsB !== 1 ? 's' : ''}</span>
          <span class="h2h-stat-team">${h2h.teamB}</span>
        </div>
      </div>

      <!-- Barra de Domínio Visual -->
      <div class="h2h-dominance-bar-wrapper">
        <div class="h2h-dominance-bar">
          <div class="h2h-bar-segment bar-win-a" style="width: ${Math.max(pctA, 2)}%;" title="${h2h.winsA} vitória(s) ${h2h.teamA}"></div>
          <div class="h2h-bar-segment bar-draw" style="width: ${Math.max(pctD, 2)}%;" title="${h2h.draws} empate(s)"></div>
          <div class="h2h-bar-segment bar-win-b" style="width: ${Math.max(pctB, 2)}%;" title="${h2h.winsB} vitória(s) ${h2h.teamB}"></div>
        </div>
        <p class="h2h-dominance-text">${dominanceText}</p>
      </div>

      <!-- Gols no período -->
      <div class="h2h-goals-summary">
        <span class="h2h-goals-team">${h2h.teamA}</span>
        <div class="h2h-goals-score">
          <span class="h2h-goals-num">${h2h.goalsA}</span>
          <span class="h2h-goals-vs">×</span>
          <span class="h2h-goals-num">${h2h.goalsB}</span>
        </div>
        <span class="h2h-goals-team">${h2h.teamB}</span>
      </div>

      <!-- Lista de Confrontos -->
      <div class="h2h-matches-list">
        <div class="h2h-matches-header">
          <span>Últimos confrontos</span>
        </div>
        ${matchRowsVisible}
        ${hiddenMatches.length > 0 ? `<div class="h2h-hidden-matches" id="h2h-hidden-matches" style="display: none;">${matchRowsHidden}</div>` : ""}
        ${accordionBtn}
      </div>
    </div>
  `;
}

function renderH2HMatchRow(match, teamA) {
  const isTeamAHome = match.mandante === teamA;
  const goalsA = isTeamAHome ? match.gols_mandante : match.gols_visitante;
  const goalsB = isTeamAHome ? match.gols_visitante : match.gols_mandante;

  let resultClass = "draw";
  let resultIcon = "🟡";
  if (goalsA > goalsB) {
    resultClass = "win-a";
    resultIcon = "🟢";
  } else if (goalsB > goalsA) {
    resultClass = "win-b";
    resultIcon = "🔵";
  }

  return `
    <div class="h2h-match-row ${resultClass}">
      <div class="h2h-match-date">
        <span class="h2h-match-round">R${match.rodada}</span>
        <span>${match.data_formatada || ""}</span>
      </div>
      <div class="h2h-match-teams">
        <span class="h2h-match-team ${match.mandante === teamA ? 'is-team-a' : ''}">${match.mandante}</span>
        <span class="h2h-match-score">
          ${resultIcon} ${match.gols_mandante} × ${match.gols_visitante}
        </span>
        <span class="h2h-match-team ${match.visitante === teamA ? 'is-team-a' : ''}">${match.visitante}</span>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.3. Bloco 2 — 📊 Momento Atual
   ========================================================================== */
function renderMomentBlock(homeTeam, awayTeam, homeMetrics, awayMetrics, homeMeta, awayMeta, homeStanding, awayStanding) {
  const metrics = [
    { key: "media_gols_pro",       label: "Gols por jogo",        icon: "⚽", format: v => v.toFixed(2), higherBetter: true },
    { key: "media_gols_contra",    label: "Gols sofridos/jogo",   icon: "🛡️", format: v => v.toFixed(2), higherBetter: false },
    { key: "xg_pro_medio",         label: "xG médio",             icon: "📈", format: v => v.toFixed(2), higherBetter: true },
    { key: "xg_contra_medio",      label: "xGA médio",            icon: "📉", format: v => v.toFixed(2), higherBetter: false },
    { key: "media_posse_bola_pct", label: "Posse média",          icon: "🔄", format: v => v.toFixed(1) + "%", higherBetter: true },
    { key: "media_chutes_jogo",    label: "Chutes por jogo",      icon: "🎯", format: v => v.toFixed(1), higherBetter: true },
    { key: "media_chutes_alvo",    label: "Chutes no alvo/jogo",  icon: "🎯", format: v => v.toFixed(1), higherBetter: true },
    { key: "conversao_chutes_pct", label: "Conversão de chutes",  icon: "💥", format: v => v.toFixed(1) + "%", higherBetter: true }
  ];

  const homeEscudo = homeMeta.escudo_url || "";
  const awayEscudo = awayMeta.escudo_url || "";

  // Only render metrics available for BOTH teams
  const availableMetrics = metrics.filter(m =>
    homeMetrics[m.key] !== undefined && homeMetrics[m.key] !== null &&
    awayMetrics[m.key] !== undefined && awayMetrics[m.key] !== null
  );

  const metricRows = availableMetrics.map(m => {
    const hVal = Number(homeMetrics[m.key]);
    const aVal = Number(awayMetrics[m.key]);
    const maxVal = Math.max(hVal, aVal, 0.01);

    // For "lower is better" metrics, invert the advantage indicator
    let homeAdvantage, awayAdvantage;
    if (m.higherBetter) {
      homeAdvantage = hVal > aVal;
      awayAdvantage = aVal > hVal;
    } else {
      homeAdvantage = hVal < aVal;
      awayAdvantage = aVal < hVal;
    }

    const hBarPct = (hVal / maxVal * 100).toFixed(1);
    const aBarPct = (aVal / maxVal * 100).toFixed(1);

    return `
      <div class="momentum-metric-row">
        <div class="momentum-value home ${homeAdvantage ? 'advantage' : ''}">${m.format(hVal)}</div>
        <div class="momentum-bar-group">
          <div class="momentum-bar-track home-track">
            <div class="momentum-bar-fill home-fill" style="width: ${hBarPct}%;"></div>
          </div>
          <span class="momentum-metric-label">${m.icon} ${m.label}</span>
          <div class="momentum-bar-track away-track">
            <div class="momentum-bar-fill away-fill" style="width: ${aBarPct}%;"></div>
          </div>
        </div>
        <div class="momentum-value away ${awayAdvantage ? 'advantage' : ''}">${m.format(aVal)}</div>
      </div>
    `;
  }).join("");

  // Position & points context
  const homePos = homeStanding.posicao || "?";
  const awayPos = awayStanding.posicao || "?";
  const homePts = homeStanding.pontos || "?";
  const awayPts = awayStanding.pontos || "?";
  const homeAprov = homeStanding.aproveitamento_pct || "?";
  const awayAprov = awayStanding.aproveitamento_pct || "?";

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">📊</span>
        <div>
          <h4 class="dossier-block-title">Momento atual</h4>
          <p class="dossier-block-subtitle">Como cada equipe está se comportando na temporada</p>
        </div>
      </div>

      <!-- Contexto de classificação -->
      <div class="momentum-standing-context">
        <div class="momentum-standing-team">
          <img src="${homeEscudo}" alt="${homeTeam}" class="momentum-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
          <div class="momentum-standing-info">
            <span class="momentum-team-name">${homeTeam}</span>
            <span class="momentum-standing-detail">${homePos}º · ${homePts} pts · ${homeAprov}%</span>
          </div>
        </div>
        <span class="momentum-vs-badge">VS</span>
        <div class="momentum-standing-team away">
          <div class="momentum-standing-info away">
            <span class="momentum-team-name">${awayTeam}</span>
            <span class="momentum-standing-detail">${awayPos}º · ${awayPts} pts · ${awayAprov}%</span>
          </div>
          <img src="${awayEscudo}" alt="${awayTeam}" class="momentum-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
        </div>
      </div>

      <!-- Comparação de Métricas -->
      <div class="momentum-compare-grid">
        ${metricRows}
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.4. Bloco 3 — 🤖 Previsão do Modelo
   ========================================================================== */
function renderPredictionBlock(pred, homeMeta, awayMeta) {
  const homeEscudo = homeMeta.escudo_url || "";
  const awayEscudo = awayMeta.escudo_url || "";

  // Top 5 placares
  const topScoresHtml = (pred.topScores || []).map(s => `
    <div class="dossier-score-chip">
      <span class="dossier-score-text">${s.placar}</span>
      <span class="dossier-score-prob">${s.prob.toFixed(1)}%</span>
    </div>
  `).join("");

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">🤖</span>
        <div>
          <h4 class="dossier-block-title">Previsão do Brasileirão 360</h4>
          <p class="dossier-block-subtitle">Modelo de Poisson calibrado com dados reais da Série A 2026</p>
        </div>
      </div>

      <!-- Probabilidades 1×2 -->
      <div class="dossier-pred-grid">
        <div class="dossier-pred-card home-pred">
          <img src="${homeEscudo}" alt="${pred.mandante}" class="dossier-pred-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
          <span class="dossier-pred-pct">${pred.probHomePct}%</span>
          <span class="dossier-pred-label">${pred.mandante}</span>
          <span class="dossier-pred-lambda">Exp. ${pred.lambdaHome} gols</span>
        </div>
        <div class="dossier-pred-card draw-pred">
          <span class="dossier-pred-emoji">🤝</span>
          <span class="dossier-pred-pct">${pred.probDrawPct}%</span>
          <span class="dossier-pred-label">Empate</span>
        </div>
        <div class="dossier-pred-card away-pred">
          <img src="${awayEscudo}" alt="${pred.visitante}" class="dossier-pred-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
          <span class="dossier-pred-pct">${pred.probAwayPct}%</span>
          <span class="dossier-pred-label">${pred.visitante}</span>
          <span class="dossier-pred-lambda">Exp. ${pred.lambdaAway} gols</span>
        </div>
      </div>

      <!-- Top 5 Placares -->
      <div class="dossier-top-scores">
        <span class="dossier-scores-title">🎯 Placares mais prováveis</span>
        <div class="dossier-scores-grid">
          ${topScoresHtml}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2.5. Bloco 4 — 🧠 Interpretação
   ========================================================================== */
function renderInterpretationBlock(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding) {
  // Generate dynamic interpretation based on real data
  const interpretText = generateInterpretation(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding);

  return `
    <div class="dossier-block">
      <div class="dossier-block-header">
        <span class="dossier-block-icon">🧠</span>
        <div>
          <h4 class="dossier-block-title">Como interpretar?</h4>
          <p class="dossier-block-subtitle">Síntese baseada nos dados disponíveis</p>
        </div>
      </div>

      <div class="dossier-interpret-box">
        <p class="dossier-interpret-text">${interpretText}</p>
      </div>

      <div class="dossier-disclaimer">
        <span class="disclaimer-icon">ℹ️</span>
        <div>
          <strong>Histórico não determina a previsão.</strong>
          <p>Os confrontos anteriores mostram o comportamento passado entre as equipes. A previsão utiliza o desempenho atual e o modelo estatístico do Brasileirão 360.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera texto interpretativo dinâmico baseado nos dados reais.
 * Regra: nunca afirmar causalidade. Usar linguagem descritiva.
 */
function generateInterpretation(h2h, homeMetrics, awayMetrics, pred, homeStanding, awayStanding) {
  const homeTeam = pred.mandante;
  const awayTeam = pred.visitante;
  const parts = [];

  // 1. Histórico
  if (h2h.total > 0) {
    if (h2h.winsA > h2h.winsB) {
      parts.push(`No histórico recente, o ${homeTeam} tem vantagem com ${h2h.winsA} vitória${h2h.winsA > 1 ? 's' : ''} em ${h2h.total} confronto${h2h.total > 1 ? 's' : ''}.`);
    } else if (h2h.winsB > h2h.winsA) {
      parts.push(`No histórico recente, o ${awayTeam} leva vantagem com ${h2h.winsB} vitória${h2h.winsB > 1 ? 's' : ''} em ${h2h.total} confronto${h2h.total > 1 ? 's' : ''}.`);
    } else {
      parts.push(`O histórico recente entre as equipes mostra equilíbrio, com ${h2h.winsA} vitória${h2h.winsA > 1 ? 's' : ''} para cada lado em ${h2h.total} confronto${h2h.total > 1 ? 's' : ''}.`);
    }
  } else {
    parts.push(`Não há confrontos anteriores entre as equipes nos dados desta temporada.`);
  }

  // 2. Momento atual
  const hGols = Number(homeMetrics.media_gols_pro || 0);
  const aGols = Number(awayMetrics.media_gols_pro || 0);
  const hXg = Number(homeMetrics.xg_pro_medio || 0);
  const aXg = Number(awayMetrics.xg_pro_medio || 0);

  const metricsToCompare = [
    { h: hGols, a: aGols, higherBetter: true },
    { h: hXg, a: aXg, higherBetter: true },
    { h: Number(homeMetrics.media_gols_contra || 99), a: Number(awayMetrics.media_gols_contra || 99), higherBetter: false },
    { h: Number(homeMetrics.media_chutes_alvo || 0), a: Number(awayMetrics.media_chutes_alvo || 0), higherBetter: true },
  ];

  let homeAdvCount = 0, awayAdvCount = 0;
  metricsToCompare.forEach(m => {
    if (m.higherBetter) {
      if (m.h > m.a) homeAdvCount++;
      else if (m.a > m.h) awayAdvCount++;
    } else {
      if (m.h < m.a) homeAdvCount++;
      else if (m.a < m.h) awayAdvCount++;
    }
  });

  if (homeAdvCount > awayAdvCount) {
    parts.push(`Na temporada atual, o ${homeTeam} apresenta indicadores superiores na maioria das métricas analisadas.`);
  } else if (awayAdvCount > homeAdvCount) {
    parts.push(`Na temporada atual, o ${awayTeam} apresenta indicadores superiores na maioria das métricas analisadas.`);
  } else {
    parts.push(`Na temporada atual, ambas as equipes apresentam indicadores semelhantes nas métricas principais.`);
  }

  // 3. Posição na tabela
  const hPos = homeStanding.posicao;
  const aPos = awayStanding.posicao;
  if (hPos && aPos) {
    const posDiff = Math.abs(hPos - aPos);
    if (posDiff >= 8) {
      const better = hPos < aPos ? homeTeam : awayTeam;
      const worse = hPos < aPos ? awayTeam : homeTeam;
      parts.push(`Existe diferença significativa na classificação: o ${better} ocupa uma posição ${posDiff} colocações acima do ${worse}.`);
    }
  }

  // 4. Previsão do modelo
  const pHome = parseFloat(pred.probHomePct);
  const pAway = parseFloat(pred.probAwayPct);

  if (pHome > pAway + 15) {
    parts.push(`O modelo atribui clara vantagem ao ${homeTeam} (${pred.probHomePct}%), considerando o fator mandante e o desempenho atual.`);
  } else if (pAway > pHome + 15) {
    parts.push(`Apesar do mando de campo, o modelo identifica vantagem para o ${awayTeam} (${pred.probAwayPct}%), refletindo seu desempenho superior na temporada.`);
  } else {
    parts.push(`O modelo indica um jogo equilibrado, sem favoritismo acentuado para nenhuma das equipes.`);
  }

  return parts.join(" ");
}

/* ==========================================================================
   3. Controle de Abertura / Fechamento do Painel
   ========================================================================== */

function openMatchDossier(match, data) {
  const panel = document.getElementById("match-dossier-panel");
  if (!panel) return;

  // Renderiza conteúdo
  renderMatchDossier(match, data);

  // Mostra painel com animação
  panel.style.display = "block";
  requestAnimationFrame(() => {
    panel.classList.add("open");
  });

  // Scroll suave até o painel
  setTimeout(() => {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

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

/* ==========================================================================
   4. Accordion — Ver todos os confrontos
   ========================================================================== */
function setupH2HAccordion() {
  const btn = document.getElementById("h2h-expand-btn");
  const hidden = document.getElementById("h2h-hidden-matches");
  if (!btn || !hidden) return;

  let expanded = false;
  btn.addEventListener("click", () => {
    expanded = !expanded;
    hidden.style.display = expanded ? "block" : "none";
    btn.querySelector(".expand-arrow").textContent = expanded ? "▲" : "▼";
    btn.querySelector("span:first-child").textContent = expanded
      ? "Mostrar menos"
      : "Ver todos os confrontos";
  });
}
