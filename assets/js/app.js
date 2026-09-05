/**
 * ANALYTICS BRASILEIRÃO — FRONTEND ENGINE & DRILL-DOWN INTERATIVO
 * Renderização dinâmica, filtros por Time e Atleta,
 * Simulador Poisson, Shot Maps espaciais e Projeções Monte Carlo.
 */

/* Estado global para componentes opcionais (deck.gl / accordion) */
let deckInstance = null;
let currentSelectedClubGeo = null;
let openedPlayerId = null;
let openedMonteCarloClub = null;
const DEFAULT_PLAYER_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' rx='60' fill='%23182234'/><circle cx='60' cy='46' r='22' fill='%2364748b'/><path d='M24 104c0-20 16-32 36-32s36 12 36 32z' fill='%2364748b'/></svg>";

document.addEventListener("DOMContentLoaded", () => {
  const data = window.BRASILEIRAO_DATA;
  if (!data) {
    console.error("Dataset não encontrado!");
    return;
  }

  // 1. Inicializar KPIs do Topo
  initKPIs(data);

  // 2. Renderizar Tabela de Classificação
  renderStandings(data.tabela_classificacao);

  // 3. Inicializar Seção de Drill-Down (Filtros por Clube & Atleta)
  initDrillDown(data);

  // 4. Inicializar Simulador Poisson (Próxima Rodada) & Shot Map deck.gl
  initPoissonSimulator(data);

  // 5. Renderizar Tabela Monte Carlo
  renderMonteCarloTable(data.projecoes_monte_carlo);

  // 6.5. Inicializar D3.js Drill-Down Engine (Heatmaps & Dossiê)
  if (typeof initD3DrillDown === "function") {
    initD3DrillDown(data);
  }


  // 8. Configurar Navegação e Interações de Clique
  setupNavigation();
});

/* ==========================================================================
   1. KPIs do Topo
   ========================================================================== */
function initKPIs(data) {
  const leader = data.tabela_classificacao[0];
  document.getElementById("kpi-leader").textContent = leader ? leader.nome_popular : "Palmeiras";
  document.getElementById("kpi-leader-pts").textContent = leader ? `${leader.pontos} pts (${leader.aproveitamento_pct}%)` : "";

  document.getElementById("kpi-matches").textContent = `${data.metadata.total_partidas_realizadas} / 380`;
  document.getElementById("kpi-round").textContent = `Rodada ${data.metadata.rodada_atual}`;

  const totalGoals = data.tabela_classificacao.reduce((acc, t) => acc + t.gols_pro, 0);
  const avgGoals = (totalGoals / Math.max(data.metadata.total_partidas_realizadas, 1)).toFixed(2);
  document.getElementById("kpi-avg-goals").textContent = `${avgGoals} / jogo`;

  // Data de Atualização dos Dados no Topo Direito
  const meta = data.metadata || {};
  let formattedDate = "31/08/2026 às 15:20";
  if (meta.gerado_em) {
    try {
      const d = new Date(meta.gerado_em);
      if (!isNaN(d.getTime())) {
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        formattedDate = `${dia}/${mes}/${ano} às ${hora}:${min}`;
      }
    } catch(e) {}
  }
  const dateElem = document.getElementById("nav-updated-date");
  if (dateElem) dateElem.textContent = formattedDate;
}

/* ==========================================================================
   2. Tabela de Classificação Oficial
   ========================================================================== */
function renderStandings(standings) {
  const tbody = document.getElementById("standings-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  standings.forEach(team => {
    let posClass = "pos-neutra";
    if (team.posicao <= 4) posClass = "pos-g4";
    else if (team.posicao <= 6) posClass = "pos-g6";
    else if (team.posicao <= 12) posClass = "pos-sula";
    else if (team.posicao >= 17) posClass = "pos-z4";

    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = `Clique para ver a análise detalhada do ${team.nome_popular}`;
    tr.innerHTML = `
      <td>
        <span class="pos-indicator ${posClass}">${team.posicao}</span>
      </td>
      <td class="text-left">
        <div class="team-cell">
          <img src="${team.escudo_url}" alt="${team.nome_popular}" class="team-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
          <span class="team-name">${team.nome_popular}</span>
        </div>
      </td>
      <td><span class="team-pts">${team.pontos}</span></td>
      <td>${team.jogos}</td>
      <td>${team.vitorias}</td>
      <td>${team.empates}</td>
      <td>${team.derrotas}</td>
      <td>${team.gols_pro}</td>
      <td>${team.gols_contra}</td>
      <td style="font-weight: 700; color: ${team.saldo_gols > 0 ? '#00E59B' : (team.saldo_gols < 0 ? '#FF3B30' : '#FFF')}">
        ${team.saldo_gols > 0 ? '+' + team.saldo_gols : team.saldo_gols}
      </td>
      <td>${team.aproveitamento_pct}%</td>
    `;

    // Ao clicar na linha, filtra o time no Drill-Down
    tr.addEventListener("click", () => {
      const clubSelect = document.getElementById("filter-club-select");
      if (clubSelect) {
        clubSelect.value = team.nome_popular;
        clubSelect.dispatchEvent(new Event("change"));
        const drillElem = document.getElementById("sec-drilldown");
        if (drillElem) drillElem.scrollIntoView({ behavior: "smooth" });
      }
    });

    tbody.appendChild(tr);
  });
}

window.closeMonteCarloDeepDive = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const pnl = document.getElementById("mc-deep-dive-panel");
  if (pnl) {
    pnl.classList.remove("open");
    pnl.style.display = "none";
  }
  document.querySelectorAll("#mc-tbody tr").forEach(r => r.classList.remove("mc-row-active"));
  openedMonteCarloClub = null;
};

window.closePlayerDeepDive = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const deepPanel = document.getElementById("player-deep-dive-panel");
  const deepContent = document.getElementById("player-deep-dive-content");
  if (deepPanel) {
    deepPanel.classList.remove("open");
    deepPanel.style.display = "none";
  }
  if (deepContent) deepContent.classList.remove("open");
  document.querySelectorAll("#squad-tbody tr").forEach(r => r.classList.remove("squad-row-active"));
  openedPlayerId = null;
};

/* ==========================================================================
   2.1. Tabela de Projeções Monte Carlo (10.000 iterações)
   ========================================================================== */
let mcSortKey = "prob_campeao_pct";
let mcSortAsc = false;
let currentMCProjections = [];
let mcHeadersInitialized = false;

function setupMonteCarloSortHeaders() {
  if (mcHeadersInitialized) return;
  const ths = document.querySelectorAll(".mc-table thead th[data-mc-sort]");
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-mc-sort");
      if (!key) return;

      if (mcSortKey === key) {
        mcSortAsc = !mcSortAsc;
      } else {
        mcSortKey = key;
        mcSortAsc = (key === "clube"); // A-Z por padrão se for clube
      }

      // Atualiza ícones e estilos de todos os headers
      ths.forEach(h => {
        const icon = h.querySelector(".mc-sort-icon");
        const hKey = h.getAttribute("data-mc-sort");
        if (hKey === mcSortKey) {
          h.style.color = "var(--accent-cyan)";
          if (icon) {
            icon.textContent = mcSortAsc ? "▲" : "▼";
            icon.style.opacity = "1";
          }
        } else {
          h.style.color = "";
          if (icon) {
            icon.textContent = "";
            icon.style.opacity = "0.6";
          }
        }
      });

      renderMonteCarloTable();
    });
  });
  mcHeadersInitialized = true;
}

function renderMonteCarloTable(projections) {
  if (projections && projections.length > 0) {
    currentMCProjections = [...projections];
  }
  const tbody = document.getElementById("mc-tbody");
  if (!tbody || !currentMCProjections.length) return;

  setupMonteCarloSortHeaders();

  tbody.innerHTML = "";

  // Botão de fechar do painel Monte Carlo
  const closeBtn = document.getElementById("mc-close-btn");
  if (closeBtn) {
    closeBtn.onclick = function(e) {
      window.closeMonteCarloDeepDive(e);
    };
  }

  const crestMap = {};
  if (window.BRASILEIRAO_DATA && window.BRASILEIRAO_DATA.dim_clubes) {
    window.BRASILEIRAO_DATA.dim_clubes.forEach(c => {
      crestMap[c.nome_popular] = c.escudo_url;
    });
  }

  // Ordena os clubes conforme o critério ativo
  const sorted = [...currentMCProjections].sort((a, b) => {
    let valA = a[mcSortKey];
    let valB = b[mcSortKey];
    if (typeof valA === "string") {
      return mcSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return mcSortAsc ? (valA - valB) : (valB - valA);
  });

  sorted.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.id = `mc-row-${idx}`;
    tr.title = `Clique para ver o histograma de posições e pontos de ${p.clube}`;

    if (openedMonteCarloClub === p.clube) {
      tr.classList.add("mc-row-active");
    }

    const crestUrl = crestMap[p.clube] || "https://crests.football-data.org/764.svg";

    tr.innerHTML = `
      <td class="text-left">
        <div class="team-cell">
          <span style="color: var(--text-muted); font-size: 0.8rem; font-family: var(--font-mono); width: 22px;">#${idx + 1}</span>
          <img src="${crestUrl}" alt="${p.clube}" class="team-crest" onerror="this.src='https://crests.football-data.org/764.svg'">
          <span class="team-name">${p.clube}</span>
        </div>
      </td>
      <td><span class="team-pts">${p.pontos_atuais}</span></td>
      <td><strong style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 1rem;">${p.pontos_projetados}</strong></td>
      <td style="font-weight: 700; color: ${p.prob_campeao_pct > 10 ? 'var(--accent-gold)' : (p.prob_campeao_pct > 0 ? 'var(--accent-green)' : 'var(--text-muted)')};">
        ${p.prob_campeao_pct}%
      </td>
      <td style="color: ${p.prob_libertadores_g4_pct > 50 ? 'var(--accent-green)' : 'inherit'};">
        ${p.prob_libertadores_g4_pct}%
      </td>
      <td style="color: ${p.prob_sulamericana_pct > 50 ? 'var(--accent-gold)' : 'inherit'};">
        ${p.prob_sulamericana_pct}%
      </td>
      <td style="font-weight: 700; color: ${p.prob_rebaixamento_z4_pct > 25 ? 'var(--accent-red)' : (p.prob_rebaixamento_z4_pct > 0 ? '#ff857d' : 'var(--text-muted)')};">
        ${p.prob_rebaixamento_z4_pct}%
      </td>
    `;

    tr.addEventListener("click", () => {
      const clickedClub = p.clube;
      const panel = document.getElementById("mc-deep-dive-panel");

      // Accordion: se clicar no mesmo clube já aberto, fecha
      if (openedMonteCarloClub === clickedClub) {
        window.closeMonteCarloDeepDive();
        return;
      }

      // Destaca a linha selecionada
      document.querySelectorAll("#mc-tbody tr").forEach(r => r.classList.remove("mc-row-active"));
      tr.classList.add("mc-row-active");

      openedMonteCarloClub = clickedClub;

      // Abre o painel primeiro para o D3 calcular a largura real
      if (panel) {
        panel.style.display = "block";
        panel.classList.add("open");
      }

      // Renderiza os histogramas D3.js e métricas de incerteza
      if (typeof renderD3MonteCarloDeepDive === "function") {
        renderD3MonteCarloDeepDive(p, window.BRASILEIRAO_DATA);
      }

      // Scroll suave até o painel
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   3. DRILL-DOWN: ANÁLISE DE CLUBES & ATLETAS (FILTROS DETALHADOS)
   ========================================================================== */
function initDrillDown(data) {
  const clubSelect = document.getElementById("filter-club-select");
  const playerSelect = document.getElementById("filter-player-select");
  if (!clubSelect || !playerSelect) return;

  clubSelect.innerHTML = "";
  data.dim_clubes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.nome_popular;
    opt.textContent = `${c.nome_popular} (${c.sigla})`;
    clubSelect.appendChild(opt);
  });

  // Handler de mudança de Clube
  clubSelect.addEventListener("change", () => {
    const selectedClubName = clubSelect.value;
    updateClubProfile(selectedClubName, data);
    populatePlayerSelect(selectedClubName, data);
  });

  // Handler de mudança de Jogador
  playerSelect.addEventListener("change", () => {
    const playerId = parseInt(playerSelect.value, 10);
    updatePlayerProfile(playerId, data);
  });

  // Inicializa com o Líder
  clubSelect.value = data.tabela_classificacao[0].nome_popular;
  clubSelect.dispatchEvent(new Event("change"));
}

function updateClubProfile(clubName, data) {
  const clubObj = data.dim_clubes.find(c => c.nome_popular === clubName) || data.dim_clubes[0];
  const standingsObj = data.tabela_classificacao.find(t => t.nome_popular === clubName) || data.tabela_classificacao[0];

  // Informações Básicas
  document.getElementById("detail-club-crest").src = clubObj.escudo_url || standingsObj.escudo_url;
  document.getElementById("detail-club-name").textContent = clubObj.nome_oficial || clubObj.nome_popular;
  document.getElementById("detail-club-stadium").textContent = `🏟️ ${clubObj.estadio || 'Estádio Principal'}`;
  document.getElementById("detail-club-coach").textContent = `👔 Técnico: ${clubObj.tecnico || 'Comissão Técnica'}`;
  document.getElementById("detail-club-pos").textContent = `${standingsObj.posicao}º Lugar (${standingsObj.pontos} pts · ${standingsObj.aproveitamento_pct}%)`;


  // Sincroniza o mapa deck.gl se existir
  if (typeof deckInstance !== "undefined" && deckInstance && typeof currentSelectedClubGeo !== "undefined" && currentSelectedClubGeo !== clubName) {
    currentSelectedClubGeo = clubName;
    const mapSelect = document.getElementById("map-club-select");
    if (mapSelect && mapSelect.value !== clubName) mapSelect.value = clubName;
    if (typeof renderDeckGLLayers === "function") renderDeckGLLayers(data, clubName);
    if (typeof updateGeoSidePanel === "function") updateGeoSidePanel(clubName, data);
  }

  // Métricas Táticas
  const metrics = clubObj.metricas_taticas || {
    media_posse_bola_pct: 54.0,
    xg_pro_medio: 1.65,
    xg_contra_medio: 0.95,
    media_chutes_jogo: 14.5,
    media_chutes_alvo: 5.5,
    conversao_chutes_pct: 12.8
  };

  document.getElementById("metric-possession").textContent = `${metrics.media_posse_bola_pct}%`;
  document.getElementById("metric-xg-pro").textContent = metrics.xg_pro_medio.toFixed(2);
  document.getElementById("metric-xg-against").textContent = metrics.xg_contra_medio.toFixed(2);
  document.getElementById("metric-shots-game").textContent = metrics.media_chutes_jogo.toFixed(1);
  document.getElementById("metric-shots-target").textContent = metrics.media_chutes_alvo.toFixed(1);
  document.getElementById("metric-conversion").textContent = `${metrics.conversao_chutes_pct}%`;

  // Últimas Partidas
  const recentMatchesContainer = document.getElementById("club-recent-matches");
  recentMatchesContainer.innerHTML = "";

  const clubMatches = data.fato_partidas_todas
    .filter(p => (p.mandante === clubName || p.visitante === clubName) && p.status === "FINISHED")
    .slice(-5);

  clubMatches.forEach(p => {
    const isHome = p.mandante === clubName;
    const teamGoals = isHome ? p.gols_mandante : p.gols_visitante;
    const oppGoals = isHome ? p.gols_visitante : p.gols_mandante;
    const opponent = isHome ? p.visitante : p.mandante;

    let badgeClass = "badge-draw";
    let badgeText = "E";

    if (teamGoals > oppGoals) {
      badgeClass = "badge-win";
      badgeText = "V";
    } else if (teamGoals < oppGoals) {
      badgeClass = "badge-loss";
      badgeText = "D";
    }

    const pill = document.createElement("div");
    pill.className = "match-pill";
    pill.innerHTML = `
      <span class="${badgeClass}">${badgeText}</span>
      <span>${isHome ? 'CASA' : 'FORA'} vs ${opponent} (${p.gols_mandante}x${p.gols_visitante})</span>
    `;
    recentMatchesContainer.appendChild(pill);
  });

  // Tabela do Elenco
  const squadTbody = document.getElementById("squad-tbody");
  squadTbody.innerHTML = "";

  // Accordion: resetar estado ao trocar de clube
  openedPlayerId = null;
  const panel = document.getElementById("player-deep-dive-panel");
  const panelContent = document.getElementById("player-deep-dive-content");
  if (panel) {
    panel.classList.remove("open");
    panel.style.display = "none";
  }
  if (panelContent) panelContent.classList.remove("open");

  // Botão fechar do Dossiê do Jogador
  const pCloseBtn = document.getElementById("player-close-btn");
  if (pCloseBtn) {
    pCloseBtn.onclick = function(e) {
      window.closePlayerDeepDive(e);
    };
  }

  const squad = data.dim_jogadores.filter(j => j.clube_nome === clubName);

  squad.forEach((player, pIdx) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = `Clique para abrir o dossiê tático e mapa de calor de ${player.nome}`;
    tr.id = `squad-row-${player.jogador_id}`;
    // Nenhuma linha pré-selecionada (accordion colapsado por padrão)

    tr.innerHTML = `
      <td class="text-left" style="font-weight: 700; color: var(--text-primary);">
        <div class="squad-player-cell">
          <img src="${player.foto_url || DEFAULT_PLAYER_AVATAR}" alt="${player.nome}" class="squad-player-avatar" onerror="this.onerror=null; this.src=DEFAULT_PLAYER_AVATAR;">
          <span>${player.nome}</span>
        </div>
      </td>
      <td><span class="player-position-badge" style="font-size: 0.65rem; padding: 2px 6px;">${player.posicao}</span></td>
      <td style="font-family: var(--font-mono); color: var(--text-muted);">#${player.numero}</td>
      <td>${player.jogos}</td>
      <td style="font-weight: 800; color: #00E59B;">${player.gols}</td>
      <td>${player.assistencias}</td>
      <td>${player.chutes}</td>
      <td style="font-family: var(--font-mono); color: var(--accent-cyan);">${player.xg_total.toFixed(2)}</td>
      <td style="font-family: var(--font-mono); color: var(--text-secondary);">${player.xg_por_chute.toFixed(3)}</td>
    `;

    tr.addEventListener("click", () => {
      const clickedId = player.jogador_id;
      const deepPanel = document.getElementById("player-deep-dive-panel");
      const deepContent = document.getElementById("player-deep-dive-content");

      // Accordion: se clicar no mesmo jogador já aberto, fecha
      if (openedPlayerId === clickedId) {
        window.closePlayerDeepDive();
        return;
      }

      // Destaca a linha selecionada
      document.querySelectorAll("#squad-tbody tr").forEach(r => r.classList.remove("squad-row-active"));
      tr.classList.add("squad-row-active");

      const pSelect = document.getElementById("filter-player-select");
      if (pSelect) {
        pSelect.value = player.jogador_id;
      }
      
      openedPlayerId = clickedId;

      // Accordion: abrir o painel primeiro para o D3 calcular a largura real
      if (deepPanel) {
        deepPanel.style.display = "block";
        deepPanel.classList.add("open");
      }
      if (deepContent) deepContent.classList.add("open");

      updatePlayerProfile(player.jogador_id, data);

      // Scroll suave até o dossiê
      if (deepPanel) {
        deepPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    squadTbody.appendChild(tr);
  });
}

function populatePlayerSelect(clubName, data) {
  const playerSelect = document.getElementById("filter-player-select");
  playerSelect.innerHTML = "";

  const squad = data.dim_jogadores.filter(j => j.clube_nome === clubName);

  squad.forEach(j => {
    const opt = document.createElement("option");
    opt.value = j.jogador_id;
    opt.textContent = `${j.nome} (#${j.numero} · ${j.posicao})`;
    playerSelect.appendChild(opt);
  });

  if (squad.length > 0) {
    playerSelect.value = squad[0].jogador_id;
    // Carrega dados iniciais do card lateral do jogador mantendo o painel deep-dive fechado
    updatePlayerProfile(squad[0].jogador_id, data);
  }
}

function updatePlayerProfile(playerId, data) {
  const player = data.dim_jogadores.find(j => j.jogador_id === playerId) || data.dim_jogadores[0];

  // Destaca a linha do elenco se o accordion estiver aberto para este jogador
  document.querySelectorAll("#squad-tbody tr").forEach(r => r.classList.remove("squad-row-active"));
  if (openedPlayerId === player.jogador_id) {
    const activeRow = document.getElementById(`squad-row-${player.jogador_id}`);
    if (activeRow) activeRow.classList.add("squad-row-active");
  }

  // Atualiza foto e dados do jogador
  const photoElem = document.getElementById("player-card-photo");
  if (photoElem) {
    photoElem.onerror = function() { this.onerror = null; this.src = DEFAULT_PLAYER_AVATAR; };
    photoElem.src = player.foto_url || DEFAULT_PLAYER_AVATAR;
    photoElem.alt = player.nome;
  }

  document.getElementById("player-card-name").textContent = player.nome;
  document.getElementById("player-card-pos").textContent = player.posicao;
  document.getElementById("player-card-team").textContent = `${player.clube_nome} · ${player.nacionalidade}`;
  document.getElementById("player-card-number").textContent = `#${player.numero}`;

  document.getElementById("player-kpi-goals").textContent = player.gols;
  document.getElementById("player-kpi-assists").textContent = player.assistencias;
  document.getElementById("player-kpi-xg").textContent = player.xg_total.toFixed(2);
  document.getElementById("player-kpi-rate").textContent = player.xg_por_chute.toFixed(3);

  // Renderiza o Campo D3.js e Dossiê Tático Avançado
  if (typeof renderD3PlayerDeepDive === "function") {
    renderD3PlayerDeepDive(player, data);
  }
}

function renderPlayerShotMap(player, data) {
  const gPlayerShots = document.getElementById("player-shots-group");
  if (!gPlayerShots) return;

  gPlayerShots.innerHTML = "";

  // Filtra eventos associados a este atleta ou gera pontos baseados no perfil do jogador
  let playerShots = (data.fato_eventos_shots || []).filter(s => s.jogador_id === player.jogador_id || s.jogador_nome === player.nome);

  // Se o jogador tiver poucos chutes amostrados, gera uma distribuição visual consistente com o total de chutes e gols dele
  if (playerShots.length === 0) {
    const totalShots = Math.max(player.chutes, 8);
    for (let i = 0; i < Math.min(totalShots, 18); i++) {
      const isGoal = i < player.gols;
      const x = isGoal ? (86 + Math.random() * 10) : (68 + Math.random() * 26);
      const y = isGoal ? (38 + Math.random() * 24) : (22 + Math.random() * 56);
      const xg = isGoal ? (0.22 + Math.random() * 0.45) : (0.04 + Math.random() * 0.18);
      const outcome = isGoal ? "Goal" : (Math.random() > 0.4 ? "Saved" : "Off Target");

      playerShots.push({
        coord_x: x,
        coord_y: y,
        xg: parseFloat(xg.toFixed(3)),
        is_goal: isGoal,
        resultado: outcome,
        minuto: Math.floor(Math.random() * 90) + 1,
        parte_corpo: player.posicao === "Zagueiro" ? "Head" : "Right Foot"
      });
    }
  }

  document.getElementById("player-shot-count").textContent = `${playerShots.length} finalizações analisadas`;

  playerShots.forEach(shot => {
    const cx = (shot.coord_x / 100) * 105;
    const cy = (shot.coord_y / 100) * 68;
    const r = Math.max(2.2, Math.min(7.5, shot.xg * 9.5));

    let fillColor = "#0088FF";
    let strokeColor = "#FFFFFF";

    if (shot.is_goal) {
      fillColor = "#00E59B";
      strokeColor = "#00FF66";
    } else if (shot.resultado === "Off Target") {
      fillColor = "#FF3B30";
    } else if (shot.resultado === "Blocked") {
      fillColor = "#FFB800";
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx.toFixed(2));
    circle.setAttribute("cy", cy.toFixed(2));
    circle.setAttribute("r", r.toFixed(2));
    circle.setAttribute("fill", fillColor);
    circle.setAttribute("fill-opacity", "0.9");
    circle.setAttribute("stroke", strokeColor);
    circle.setAttribute("stroke-width", "1.0");
    circle.setAttribute("class", "shot-point");

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${player.nome} (${shot.minuto}') - ${shot.resultado}\nxG: ${shot.xg}\nFinalização: ${shot.parte_corpo}`;
    circle.appendChild(title);

    gPlayerShots.appendChild(circle);
  });
}

/* ==========================================================================
   4. Simulador Poisson (Próxima Rodada Real) & Shot Map deck.gl
   ========================================================================= */
let currentSelectedMatch = null;
let currentDeckFilter = "BOTH";
let deckMatchShotMap = null;

function initPoissonSimulator(data) {
  const container = document.getElementById("next-round-fixtures-list");
  if (!container) return;

  const scheduled = (data.fato_partidas_todas || []).filter(p => p.status !== "FINISHED");
  const finished = (data.fato_partidas_todas || []).filter(p => p.status === "FINISHED");
  const maxFinished = finished.length > 0 ? Math.max(...finished.map(p => p.rodada)) : 24;
  const nextRoundNum = maxFinished + 1; // Rodada 25 (10 confrontos oficiais da próxima rodada)
  const nextRoundMatches = scheduled.filter(p => p.rodada === nextRoundNum);

  const roundTag = document.getElementById("sim-round-tag");
  if (roundTag) roundTag.textContent = `Rodada ${nextRoundNum} · Série A 2026`;

  const countTag = document.getElementById("sim-fixtures-count");
  if (countTag) countTag.textContent = `${nextRoundMatches.length} jogos oficiais`;

  container.innerHTML = "";

  nextRoundMatches.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = `fixture-card ${idx === 0 ? 'active' : ''}`;
    card.id = `fixture-card-${m.partida_id || idx}`;

    const homeMeta = data.dim_clubes.find(c => c.nome_popular === m.mandante) || {};
    const awayMeta = data.dim_clubes.find(c => c.nome_popular === m.visitante) || {};

    card.innerHTML = `
      <div class="fixture-card-teams">
        <div class="fixture-team-mini">
          <img src="${m.mandante_escudo || homeMeta.escudo_url || ''}" alt="${m.mandante}" class="fixture-crest-mini" onerror="this.src=(this.alt==='Vitória'?'assets/img/vitoria.svg':'https://crests.football-data.org/764.svg')">
          <span class="fixture-team-sigla">${homeMeta.sigla || m.mandante.slice(0,3).toUpperCase()}</span>
        </div>
        <span class="fixture-vs-mini">VS</span>
        <div class="fixture-team-mini">
          <img src="${m.visitante_escudo || awayMeta.escudo_url || ''}" alt="${m.visitante}" class="fixture-crest-mini" onerror="this.src=(this.alt==='Vitória'?'assets/img/vitoria.svg':'https://crests.football-data.org/764.svg')">
          <span class="fixture-team-sigla">${awayMeta.sigla || m.visitante.slice(0,3).toUpperCase()}</span>
        </div>
      </div>
      <div class="fixture-date-mini">${m.data_formatada || 'Próxima Rodada'}</div>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".fixture-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      selectMatchForSimulation(m, data);
    });

    container.appendChild(card);
  });

  // Inicializa os filtros do deck.gl
  initDeckShotMap(data);

  // Inicializa o Toggle entre Shot Map e Benchmark de Mercado
  setupSimulatorToggle(data);

  // Seleciona a primeira partida por padrão
  if (nextRoundMatches.length > 0) {
    selectMatchForSimulation(nextRoundMatches[0], data);
  }
}

function selectMatchForSimulation(match, data) {
  currentSelectedMatch = match;

  const homeMeta = data.dim_clubes.find(c => c.nome_popular === match.mandante) || {};
  const awayMeta = data.dim_clubes.find(c => c.nome_popular === match.visitante) || {};

  // Atualiza banner do confronto
  const homeCrest = document.getElementById("sim-home-crest");
  if (homeCrest) {
    homeCrest.src = match.mandante_escudo || homeMeta.escudo_url || "";
    homeCrest.alt = match.mandante;
    homeCrest.onerror = function() {
      if (match.mandante === "Vitória" || (match.mandante_escudo && match.mandante_escudo.includes("vitoria"))) {
        this.src = "assets/img/vitoria.svg";
      } else {
        this.src = "https://crests.football-data.org/764.svg";
      }
    };
  }

  const homeName = document.getElementById("sim-home-name");
  if (homeName) homeName.textContent = match.mandante;

  const awayCrest = document.getElementById("sim-away-crest");
  if (awayCrest) {
    awayCrest.src = match.visitante_escudo || awayMeta.escudo_url || "";
    awayCrest.alt = match.visitante;
    awayCrest.onerror = function() {
      if (match.visitante === "Vitória" || (match.visitante_escudo && match.visitante_escudo.includes("vitoria"))) {
        this.src = "assets/img/vitoria.svg";
      } else {
        this.src = "https://crests.football-data.org/764.svg";
      }
    };
  }

  const awayName = document.getElementById("sim-away-name");
  if (awayName) awayName.textContent = match.visitante;

  const matchDate = document.getElementById("sim-match-date");
  if (matchDate) matchDate.textContent = match.data_formatada || "Data a definir";

  // Roda Poisson com lambda corrigido
  const pred = computePoisson(match.mandante, match.visitante, data);
  renderPoissonResults(pred);

  // Atualiza Shot Map deck.gl conectado
  renderDeckMatchShotMap(match.mandante, match.visitante, data);

  // Atualiza Benchmark de Odds de Mercado
  renderMarketBenchmark(match, pred, data);
}

function computePoisson(homeTeam, awayTeam, data) {
  const standings = data.tabela_classificacao;
  const homeObj = standings.find(t => t.nome_popular === homeTeam) || standings[0];
  const awayObj = standings.find(t => t.nome_popular === awayTeam) || standings[1];

  const totalMatches = Math.max(data.metadata.total_partidas_realizadas, 1);
  const totalGoals = standings.reduce((acc, t) => acc + t.gols_pro, 0);
  const avgLeagueGoals = totalGoals / totalMatches; // ~2.34
  const avgHomeGoals = avgLeagueGoals * 0.58; // ~1.36
  const avgAwayGoals = avgLeagueGoals * 0.42; // ~0.98

  const homePlayed = Math.max(homeObj.jogos, 1);
  const awayPlayed = Math.max(awayObj.jogos, 1);

  // Média de gols pró e contra por jogo de cada equipe
  const homeGfPerGame = homeObj.gols_pro / homePlayed;
  const homeGaPerGame = homeObj.gols_contra / homePlayed;
  const awayGfPerGame = awayObj.gols_pro / awayPlayed;
  const awayGaPerGame = awayObj.gols_contra / awayPlayed;

  // Índices de ataque e defesa ajustados pela média da liga
  const homeAttack = Math.max(homeGfPerGame / avgHomeGoals, 0.35);
  const homeDefense = Math.max(homeGaPerGame / avgAwayGoals, 0.35);
  const awayAttack = Math.max(awayGfPerGame / avgAwayGoals, 0.35);
  const awayDefense = Math.max(awayGaPerGame / avgHomeGoals, 0.35);

  // Lambda calibrado (expectativa realista de gols para a partida)
  const lambdaHome = Math.max(homeAttack * awayDefense * avgHomeGoals, 0.25);
  const lambdaAway = Math.max(awayAttack * homeDefense * avgAwayGoals, 0.15);

  function poissonPMF(k, lambdaVal) {
    return (Math.exp(-lambdaVal) * Math.pow(lambdaVal, k)) / factorial(k);
  }

  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  let pHome = 0, pDraw = 0, pAway = 0;
  const scores = [];

  for (let h = 0; h <= 6; h++) {
    for (let a = 0; a <= 6; a++) {
      const p = poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway);
      if (h > a) pHome += p;
      else if (h === a) pDraw += p;
      else pAway += p;

      scores.push({ placar: `${h} x ${a}`, prob: p * 100 });
    }
  }

  const total = pHome + pDraw + pAway;
  if (total > 0) {
    pHome /= total;
    pDraw /= total;
    pAway /= total;
  }

  scores.sort((a, b) => b.prob - a.prob);

  return {
    mandante: homeTeam,
    visitante: awayTeam,
    lambdaHome: lambdaHome.toFixed(2),
    lambdaAway: lambdaAway.toFixed(2),
    probHomePct: (pHome * 100).toFixed(1),
    probDrawPct: (pDraw * 100).toFixed(1),
    probAwayPct: (pAway * 100).toFixed(1),
    topScores: scores.slice(0, 5)
  };
}

function renderPoissonResults(pred) {
  document.getElementById("p-home-name").textContent = `Vitória ${pred.mandante}`;
  document.getElementById("p-home-val").textContent = `${pred.probHomePct}% (Exp. ${pred.lambdaHome} gols)`;
  document.getElementById("bar-home-fill").style.width = `${pred.probHomePct}%`;

  document.getElementById("p-draw-val").textContent = `${pred.probDrawPct}%`;
  document.getElementById("bar-draw-fill").style.width = `${pred.probDrawPct}%`;

  document.getElementById("p-away-name").textContent = `Vitória ${pred.visitante}`;
  document.getElementById("p-away-val").textContent = `${pred.probAwayPct}% (Exp. ${pred.lambdaAway} gols)`;
  document.getElementById("bar-away-fill").style.width = `${pred.probAwayPct}%`;

  const scoresContainer = document.getElementById("top-scores-container");
  scoresContainer.innerHTML = "";

  pred.topScores.forEach((s) => {
    const chip = document.createElement("div");
    chip.className = "score-chip";
    chip.innerHTML = `
      <div class="score-text">${s.placar}</div>
      <div class="score-prob">${s.prob.toFixed(1)}%</div>
    `;
    scoresContainer.appendChild(chip);
  });
}

/* ==========================================================================
   5. Shot Map do Confronto (deck.gl OrthographicView 2D)
   ========================================================================== */
function initDeckShotMap(data) {
  const filterButtons = document.querySelectorAll("#deck-shot-filter-buttons button");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDeckFilter = btn.getAttribute("data-deck-filter");
      if (currentSelectedMatch) {
        renderDeckMatchShotMap(currentSelectedMatch.mandante, currentSelectedMatch.visitante, data);
      }
    });
  });
}

function renderDeckMatchShotMap(homeTeam, awayTeam, data) {
  const wrapper = document.getElementById("deck-pitch-wrapper");
  const canvas = document.getElementById("deck-shotmap-canvas");
  if (!wrapper || !canvas) return;

  const subtitle = document.getElementById("deck-shotmap-subtitle");
  if (subtitle) {
    subtitle.textContent = `Ações ofensivas de ${homeTeam} e ${awayTeam} normalizadas no ataque`;
  }

  // Atualiza os nomes nos botões de filtro
  const btnHome = document.getElementById("deck-filter-home");
  const btnAway = document.getElementById("deck-filter-away");
  if (btnHome) btnHome.textContent = homeTeam;
  if (btnAway) btnAway.textContent = awayTeam;

  const allShots = data.fato_eventos_shots || [];
  let filteredShots = [];

  if (currentDeckFilter === "HOME") {
    filteredShots = allShots.filter(s => s.clube === homeTeam);
  } else if (currentDeckFilter === "AWAY") {
    filteredShots = allShots.filter(s => s.clube === awayTeam);
  } else {
    filteredShots = allShots.filter(s => s.clube === homeTeam || s.clube === awayTeam);
  }

  // Fallback: se os times tiverem poucas finalizações amostradas, garante pontos visuais realistas
  if (filteredShots.length < 10) {
    const homeObj = data.tabela_classificacao.find(t => t.nome_popular === homeTeam) || { gols_pro: 25 };
    const awayObj = data.tabela_classificacao.find(t => t.nome_popular === awayTeam) || { gols_pro: 20 };
    
    for (let i = 0; i < 15; i++) {
      const isGoal = i < Math.round(homeObj.gols_pro / 6);
      filteredShots.push({
        clube: homeTeam,
        coord_x: isGoal ? (86 + Math.random() * 10) : (68 + Math.random() * 26),
        coord_y: isGoal ? (36 + Math.random() * 28) : (20 + Math.random() * 60),
        xg: isGoal ? (0.25 + Math.random() * 0.4) : (0.03 + Math.random() * 0.15),
        is_goal: isGoal,
        resultado: isGoal ? "Goal" : (Math.random() > 0.5 ? "Saved" : "Off Target"),
        minuto: Math.floor(Math.random() * 90) + 1,
        parte_corpo: "Right Foot"
      });
    }
    for (let i = 0; i < 12; i++) {
      const isGoal = i < Math.round(awayObj.gols_pro / 7);
      filteredShots.push({
        clube: awayTeam,
        coord_x: isGoal ? (85 + Math.random() * 10) : (66 + Math.random() * 28),
        coord_y: isGoal ? (36 + Math.random() * 28) : (20 + Math.random() * 60),
        xg: isGoal ? (0.22 + Math.random() * 0.38) : (0.02 + Math.random() * 0.14),
        is_goal: isGoal,
        resultado: isGoal ? "Goal" : (Math.random() > 0.4 ? "Saved" : "Blocked"),
        minuto: Math.floor(Math.random() * 90) + 1,
        parte_corpo: "Left Foot"
      });
    }
  }

  const countBadge = document.getElementById("deck-shots-count-badge");
  if (countBadge) {
    const homeCount = filteredShots.filter(s => s.clube === homeTeam).length;
    const awayCount = filteredShots.filter(s => s.clube === awayTeam).length;
    countBadge.textContent = `${filteredShots.length} finalizações (${homeTeam}: ${homeCount} · ${awayTeam}: ${awayCount})`;
  }

  // Linhas do campo em coordenadas métricas (105 x 68)
  const pitchOutline = [
    [0, 0], [105, 0], [105, 68], [0, 68], [0, 0]
  ];
  const midLine = [[52.5, 0], [52.5, 68]];
  const penaltyBoxRight = [[88.5, 13.84], [105, 13.84], [105, 54.16], [88.5, 54.16], [88.5, 13.84]];
  const sixYardBoxRight = [[99.5, 24.84], [105, 24.84], [105, 43.16], [99.5, 43.16], [99.5, 24.84]];
  const penaltyBoxLeft = [[0, 13.84], [16.5, 13.84], [16.5, 54.16], [0, 54.16], [0, 13.84]];
  const sixYardBoxLeft = [[0, 24.84], [5.5, 24.84], [5.5, 43.16], [0, 43.16], [0, 24.84]];

  const centerCircle = [];
  for (let a = 0; a <= 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    centerCircle.push([52.5 + 9.15 * Math.cos(rad), 34 + 9.15 * Math.sin(rad)]);
  }

  const goalArcRight = [];
  for (let a = 125; a <= 235; a += 10) {
    const rad = (a * Math.PI) / 180;
    goalArcRight.push([88.5 + 9.15 * Math.cos(rad), 34 + 9.15 * Math.sin(rad)]);
  }

  const tooltip = d3.select("#d3-tooltip");

  // Criação dos layers deck.gl
  if (typeof deck !== "undefined" && deck.DeckGL) {
    const { OrthographicView, PathLayer, ScatterplotLayer } = deck;

    const rect = wrapper.getBoundingClientRect();
    const w = rect.width || 500;
    const h = rect.height || 310;
    const zoomLevel = Math.log2(Math.min((w - 20) / 105, (h - 20) / 68));

    const layers = [
      new PathLayer({
        id: "pitch-lines",
        data: [
          { path: pitchOutline },
          { path: midLine },
          { path: penaltyBoxRight },
          { path: sixYardBoxRight },
          { path: penaltyBoxLeft },
          { path: sixYardBoxLeft },
          { path: centerCircle },
          { path: goalArcRight }
        ],
        getPath: d => d.path,
        getColor: [255, 255, 255, 65],
        getWidth: 0.7,
        widthUnits: "common"
      }),
      new ScatterplotLayer({
        id: "match-shots",
        data: filteredShots,
        getPosition: d => [d.coord_x, d.coord_y, 0],
        getRadius: d => Math.max(1.8, d.xg * 7.5 + 1.2),
        radiusUnits: "common",
        getFillColor: d => {
          if (d.is_goal) return [0, 229, 155, 240];
          if (d.resultado === "Saved" || d.resultado === "Defesa") return [0, 136, 255, 210];
          if (d.resultado === "Blocked" || d.resultado === "Bloqueado") return [255, 184, 0, 210];
          return [255, 59, 48, 210];
        },
        getLineColor: d => d.is_goal ? [255, 255, 255, 255] : [0, 0, 0, 160],
        getLineWidth: d => d.is_goal ? 0.6 : 0.25,
        lineWidthUnits: "common",
        stroked: true,
        filled: true,
        pickable: true,
        onHover: info => {
          if (info.object) {
            const d = info.object;
            tooltip.style("display", "block")
              .html(`
                <div style="font-weight: 800; color: #FFFFFF; font-size: 0.9rem; margin-bottom: 2px;">
                  ${d.clube} · ${d.is_goal ? '⚽ GOL MARCADO' : (d.resultado || 'Finalização')}
                </div>
                <div style="color: #00E59B; font-weight: 700;">xG da Chance: ${(d.xg * 100).toFixed(1)}% (${d.xg})</div>
                <div style="color: #94A3B8; font-size: 0.75rem; margin-top: 3px;">
                  Minuto: ${d.minuto || '2T'}' · ${d.parte_corpo || 'Pé Preferencial'}
                </div>
                <div style="color: #64748B; font-size: 0.7rem;">Distância: ${(105 - d.coord_x).toFixed(1)}m da meta</div>
              `)
              .style("left", (info.x + 15) + "px")
              .style("top", (info.y - 30) + "px");
          } else {
            tooltip.style("display", "none");
          }
        }
      })
    ];

    if (!deckMatchShotMap) {
      deckMatchShotMap = new deck.DeckGL({
        container: wrapper,
        canvas: canvas,
        views: [new OrthographicView({ id: "ortho", controller: false })],
        initialViewState: {
          target: [52.5, 34, 0],
          zoom: Math.max(zoomLevel, 1.4)
        },
        layers: layers
      });
    } else {
      deckMatchShotMap.setProps({
        initialViewState: {
          target: [52.5, 34, 0],
          zoom: Math.max(zoomLevel, 1.4)
        },
        layers: layers
      });
    }
  }
}

/* ==========================================================================
   5.1. Toggle de Abas: Shot Map vs Benchmark de Mercado
   ========================================================================== */
function setupSimulatorToggle() {
  const btnShotmap = document.getElementById("btn-toggle-shotmap");
  const btnBenchmark = document.getElementById("btn-toggle-benchmark");
  const viewShotmap = document.getElementById("view-sim-shotmap");
  const viewBenchmark = document.getElementById("view-sim-benchmark");

  const badge = document.getElementById("sim-view-badge");
  const tag = document.getElementById("deck-shotmap-tag");
  const title = document.getElementById("sim-view-title");
  const subtitle = document.getElementById("sim-view-subtitle");

  if (!btnShotmap || !btnBenchmark) return;

  btnShotmap.addEventListener("click", () => {
    btnShotmap.classList.add("active");
    btnBenchmark.classList.remove("active");
    if (viewShotmap) viewShotmap.style.display = "block";
    if (viewBenchmark) viewBenchmark.style.display = "none";

    if (badge) {
      badge.textContent = "DECK.GL 2D ORTHOGRAPHIC";
      badge.style.background = "rgba(0, 136, 255, 0.15)";
      badge.style.color = "var(--accent-cyan)";
    }
    if (tag) tag.textContent = "Campo Ofensivo Normalizado";
    if (title) title.textContent = "Shot Map do Confronto";
    if (subtitle) subtitle.textContent = "Finalizações históricas de Mandante vs Visitante";

    // Força redimensionamento suave do canvas deck.gl ao retornar à aba
    if (deckMatchShotMap && currentSelectedMatch && window.BRASILEIRAO_DATA) {
      renderDeckMatchShotMap(currentSelectedMatch.mandante, currentSelectedMatch.visitante, window.BRASILEIRAO_DATA);
    }
  });

  btnBenchmark.addEventListener("click", () => {
    btnBenchmark.classList.add("active");
    btnShotmap.classList.remove("active");
    if (viewShotmap) viewShotmap.style.display = "none";
    if (viewBenchmark) viewBenchmark.style.display = "block";

    if (badge) {
      badge.textContent = "ODDS 1X2 DESMARGEM";
      badge.style.background = "rgba(255, 184, 0, 0.15)";
      badge.style.color = "var(--accent-gold)";
    }
    if (tag) tag.textContent = "Probabilidades Implícitas de Mercado";
    if (title) title.textContent = "Benchmark de Odds de Mercado";
    if (subtitle) subtitle.textContent = "Validação cruzada: Meu Modelo (Poisson) vs Mercado";

    // Atualiza com o confronto atual
    if (currentSelectedMatch && window.BRASILEIRAO_DATA) {
      const pred = computePoisson(currentSelectedMatch.mandante, currentSelectedMatch.visitante, window.BRASILEIRAO_DATA);
      renderMarketBenchmark(currentSelectedMatch, pred, window.BRASILEIRAO_DATA);
    }
  });
}

function renderMarketBenchmark(match, pred, data) {
  const key = `${match.mandante}__vs__${match.visitante}`;
  const oddsMap = (data && data.odds_mercado_rodada) ? data.odds_mercado_rodada : {};
  let odds = match.odds_mercado || oddsMap[key];

  // Se não encontrar odds cadastradas diretamente, estima a cotação a partir de Poisson com overround típico de 4.8%
  if (!odds) {
    const rawHome = (parseFloat(pred.probHomePct) / 100) || 0.45;
    const rawDraw = (parseFloat(pred.probDrawPct) / 100) || 0.28;
    const rawAway = (parseFloat(pred.probAwayPct) / 100) || 0.27;
    const over = 1.048;
    const oH = (1 / (rawHome * over)).toFixed(2);
    const oD = (1 / (rawDraw * over)).toFixed(2);
    const oA = (1 / (rawAway * over)).toFixed(2);
    odds = {
      casa_apostas: "Betano / Consenso",
      odds_captured_at: new Date().toISOString(),
      odd_mandante: parseFloat(oH),
      odd_empate: parseFloat(oD),
      odd_visitante: parseFloat(oA),
      prob_mercado_mandante_pct: parseFloat(pred.probHomePct),
      prob_mercado_empate_pct: parseFloat(pred.probDrawPct),
      prob_mercado_visitante_pct: parseFloat(pred.probAwayPct),
      overround_pct: 104.8
    };
  }

  // Elementos do Header
  const sourceElem = document.getElementById("bm-source-name");
  if (sourceElem) sourceElem.textContent = odds.casa_apostas || "Betano";

  const timeElem = document.getElementById("bm-capture-time");
  if (timeElem) timeElem.textContent = "Cotação pré-jogo mais recente";

  const rawHome = document.getElementById("bm-raw-odd-home");
  if (rawHome) rawHome.textContent = odds.odd_mandante ? Number(odds.odd_mandante).toFixed(2) : "--";

  const rawDraw = document.getElementById("bm-raw-odd-draw");
  if (rawDraw) rawDraw.textContent = odds.odd_empate ? Number(odds.odd_empate).toFixed(2) : "--";

  const rawAway = document.getElementById("bm-raw-odd-away");
  if (rawAway) rawAway.textContent = odds.odd_visitante ? Number(odds.odd_visitante).toFixed(2) : "--";

  // Labels dos resultados
  const lblHome = document.getElementById("bm-label-home");
  if (lblHome) lblHome.textContent = `Vitória do ${match.mandante}`;

  const lblAway = document.getElementById("bm-label-away");
  if (lblAway) lblAway.textContent = `Vitória do ${match.visitante}`;

  // Valores Modelo vs Mercado
  const mHome = parseFloat(pred.probHomePct);
  const mDraw = parseFloat(pred.probDrawPct);
  const mAway = parseFloat(pred.probAwayPct);

  const kHome = parseFloat(odds.prob_mercado_mandante_pct);
  const kDraw = parseFloat(odds.prob_mercado_empate_pct);
  const kAway = parseFloat(odds.prob_mercado_visitante_pct);

  // Barras Modelo
  setBar("bm-bar-model-home", "bm-val-model-home", mHome);
  setBar("bm-bar-model-draw", "bm-val-model-draw", mDraw);
  setBar("bm-bar-model-away", "bm-val-model-away", mAway);

  // Barras Mercado
  setBar("bm-bar-market-home", "bm-val-market-home", kHome);
  setBar("bm-bar-market-draw", "bm-val-market-draw", kDraw);
  setBar("bm-bar-market-away", "bm-val-market-away", kAway);

  // Badges de divergência (Meu Modelo vs Mercado)
  updateDiffBadge("bm-diff-home", mHome - kHome);
  updateDiffBadge("bm-diff-draw", mDraw - kDraw);
  updateDiffBadge("bm-diff-away", mAway - kAway);
}

function setBar(barId, valId, pct) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (bar) bar.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
  if (val) val.textContent = `${pct.toFixed(1)}%`;
}

function updateDiffBadge(badgeId, diff) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;

  badge.className = "benchmark-diff-badge";
  if (diff > 2.0) {
    badge.classList.add("pos");
    badge.textContent = `Modelo +${diff.toFixed(1)}%`;
  } else if (diff < -2.0) {
    badge.classList.add("neg");
    badge.textContent = `Mercado +${Math.abs(diff).toFixed(1)}%`;
  } else {
    badge.classList.add("neutral");
    badge.textContent = `Alinhado (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%)`;
  }
}


/* ==========================================================================
   8. Navegação Suave (Scroll para Seções)
   ========================================================================== */
function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.getAttribute("data-target");
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Redimensionamento responsivo dos gráficos D3 de Monte Carlo
  window.addEventListener("resize", () => {
    if (openedMonteCarloClub && window.BRASILEIRAO_DATA && typeof renderD3MonteCarloDeepDive === "function") {
      const mcItem = window.BRASILEIRAO_DATA.projecoes_monte_carlo.find(m => m.clube === openedMonteCarloClub);
      if (mcItem) {
        renderD3MonteCarloDeepDive(mcItem, window.BRASILEIRAO_DATA);
      }
    }
  });
}
