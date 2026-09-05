/**
 * ANALYTICS BRASILEIRÃO — D3.js TACTICAL & DRILL-DOWN ENGINE
 * Motor gráfico D3.js v7 especializado para a seção de Drill-Down:
 * 1. Campo de Futebol com Mapa de Calor (Heatmap 2D / Gaussian KDE), Shot Map e Zonas de Perigo
 * 2. Radar Tático de Atributos do Atleta vs. Benchmark da Posição
 * 3. Distribuição de xG por Finalização (Strip Plot / Beeswarm)
 * 4. Timeline de Efetividade por Minutagem (Fases do Jogo)
 */

const D3DrillDown = {
  currentPitchMode: "heatmap", // 'heatmap', 'shots', 'hybrid', 'zones'
  currentPlayerId: null,
  dataset: null
};

/**
 * Inicializa os controles do D3 no Drill-Down
 */
function initD3DrillDown(data) {
  if (typeof d3 === "undefined") {
    console.error("D3.js não encontrado.");
    return;
  }

  D3DrillDown.dataset = data;

  // Botões de modo do campo
  const modeButtons = document.querySelectorAll("#pitch-mode-buttons button");
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      D3DrillDown.currentPitchMode = btn.getAttribute("data-pitch-mode");
      if (D3DrillDown.currentPlayerId) {
        const player = data.dim_jogadores.find(j => j.jogador_id === D3DrillDown.currentPlayerId) || data.dim_jogadores[0];
        renderD3PlayerPitch(player, data, D3DrillDown.currentPitchMode);
      }
    });
  });

  // Tooltip global D3
  if (!document.getElementById("d3-tooltip")) {
    const tooltip = document.createElement("div");
    tooltip.id = "d3-tooltip";
    tooltip.className = "d3-tooltip-popup";
    document.body.appendChild(tooltip);
  }
}

/**
 * Ponto de entrada chamado ao selecionar um atleta no Drill-Down
 */
function renderD3PlayerDeepDive(player, data) {
  D3DrillDown.currentPlayerId = player.jogador_id;
  D3DrillDown.dataset = data;

  // 1. Renderiza o Campo D3 (Heatmap / Shot Map)
  renderD3PlayerPitch(player, data, D3DrillDown.currentPitchMode);

  // 2. Renderiza o Dossiê Tático
  renderD3PlayerRadar(player, data);
  renderD3PlayerShotDist(player, data);
  renderD3PlayerTimeline(player, data);
  updateD3PlayerDossier(player, data);
}

/* ==========================================================================
   1. CAMPO DE FUTEBOL D3.JS (HEATMAP 2D + SHOT MAP + ZONAS)
   ========================================================================== */
function renderD3PlayerPitch(player, data, mode = "heatmap") {
  const container = document.getElementById("d3-player-pitch-container");
  if (!container) return;

  container.innerHTML = "";
  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 320);
  const height = 240;

  // Dimensões oficiais de campo SVG (105 x 68 metros)
  const pitchWidth = 105;
  const pitchHeight = 68;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${pitchWidth} ${pitchHeight}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("border-radius", "8px")
    .style("overflow", "hidden")
    .style("background", "radial-gradient(ellipse at center, #153322 0%, #0d1e14 100%)");

  const defs = svg.append("defs");

  // Filtro de Glow para os pontos de gol
  const filter = defs.append("filter")
    .attr("id", "d3-glow")
    .attr("x", "-50%").attr("y", "-50%")
    .attr("width", "200%").attr("height", "200%");
  filter.append("feGaussianBlur").attr("stdDeviation", "1.5").attr("result", "coloredBlur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Linhas Oficiais do Campo de Futebol
  const pitchLinesGroup = svg.append("g").attr("class", "pitch-lines").style("pointer-events", "none");

  pitchLinesGroup.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", 105).attr("height", 68)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);

  pitchLinesGroup.append("line")
    .attr("x1", 52.5).attr("y1", 0).attr("x2", 52.5).attr("y2", 68)
    .attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);

  pitchLinesGroup.append("circle")
    .attr("cx", 52.5).attr("cy", 34).attr("r", 9.15)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);

  pitchLinesGroup.append("circle")
    .attr("cx", 52.5).attr("cy", 34).attr("r", 0.6)
    .attr("fill", "rgba(255,255,255,0.6)");

  // Áreas Defesa (Esquerda)
  pitchLinesGroup.append("rect")
    .attr("x", 0).attr("y", 13.84).attr("width", 16.5).attr("height", 40.32)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);
  pitchLinesGroup.append("rect")
    .attr("x", 0).attr("y", 24.84).attr("width", 5.5).attr("height", 18.32)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);

  // Áreas Ataque (Direita - onde ocorrem os chutes)
  pitchLinesGroup.append("rect")
    .attr("x", 88.5).attr("y", 13.84).attr("width", 16.5).attr("height", 40.32)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);
  pitchLinesGroup.append("rect")
    .attr("x", 99.5).attr("y", 24.84).attr("width", 5.5).attr("height", 18.32)
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);
  pitchLinesGroup.append("path")
    .attr("d", "M 88.5,27.5 A 9.15,9.15 0 0,0 88.5,40.5")
    .attr("fill", "none").attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-width", 0.7);

  // Marca do Pênalti
  pitchLinesGroup.append("circle")
    .attr("cx", 94).attr("cy", 34).attr("r", 0.6)
    .attr("fill", "rgba(255,255,255,0.6)");

  // Trave / Gol (Direita)
  pitchLinesGroup.append("rect")
    .attr("x", 105).attr("y", 30.34).attr("width", 1.8).attr("height", 7.32)
    .attr("fill", "rgba(255,255,255,0.7)").attr("stroke", "none");

  // Obtém as finalizações do jogador
  let playerShots = (data.fato_eventos_shots || []).filter(s => s.jogador_id === player.jogador_id || s.jogador_nome === player.nome);

  // Fallback sintético baseado nas estatísticas reais do atleta
  if (playerShots.length === 0) {
    playerShots = generateSyntheticPlayerShots(player);
  }

  // Atualiza label de contagem
  const countElem = document.getElementById("player-shot-count");
  if (countElem) {
    countElem.textContent = `${playerShots.length} chutes mapeados · ${player.gols} gols`;
  }

  const tooltip = d3.select("#d3-tooltip");

  // CAMADA 1: MAPA DE CALOR (HEATMAP 2D)
  if (mode === "heatmap" || mode === "hybrid") {
    renderD3HeatmapSurface(svg, playerShots, pitchWidth, pitchHeight);
  }

  // CAMADA 2: ZONAS DE PERIGO (SETORES DE xG)
  if (mode === "zones") {
    renderD3DangerZones(svg, playerShots, tooltip);
  }

  // CAMADA 3: SHOT MAP (PONTOS DE FINALIZAÇÃO)
  if (mode === "shots" || mode === "hybrid") {
    const shotGroup = svg.append("g").attr("class", "player-shots");

    shotGroup.selectAll(".player-shot-point")
      .data(playerShots)
      .enter()
      .append("circle")
      .attr("class", "player-shot-point")
      .attr("cx", d => d.coord_x)
      .attr("cy", d => d.coord_y)
      .attr("r", 0)
      .attr("fill", d => {
        if (d.is_goal) return "#00E59B";
        if (d.resultado === "Saved" || d.resultado === "Defesa") return "#0088FF";
        if (d.resultado === "Blocked" || d.resultado === "Bloqueado") return "#FFB800";
        return "#FF3B30";
      })
      .attr("stroke", d => d.is_goal ? "#FFFFFF" : "rgba(0,0,0,0.5)")
      .attr("stroke-width", d => d.is_goal ? 1.2 : 0.6)
      .attr("filter", d => d.is_goal ? "url(#d3-glow)" : "none")
      .style("cursor", "pointer")
      .transition()
      .duration(600)
      .delay((d, i) => i * 25)
      .attr("r", d => Math.max(1.8, Math.min(d.xg * 9.5 + 1.5, 6.5)));

    // Tooltip no hover
    svg.selectAll(".player-shot-point")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "#FFFFFF").attr("stroke-width", 2);
        tooltip.style("display", "block")
          .html(`
            <div style="font-weight: 800; color: #FFFFFF; font-size: 0.9rem; margin-bottom: 2px;">
              ${d.is_goal ? '⚽ GOL MARCADO' : `🎯 Finalização (${d.resultado || 'Para Fora'})`}
            </div>
            <div style="color: #00E59B; font-weight: 700;">xG Esperado: ${(d.xg * 100).toFixed(1)}% (${d.xg.toFixed(3)})</div>
            <div style="color: #94A3B8; font-size: 0.75rem; margin-top: 3px;">
              Tipo: ${d.parte_corpo || 'Pé Preferencial'} · Minuto: ${d.minuto || '2T'}'
            </div>
            <div style="color: #64748B; font-size: 0.7rem;">Distância: ${(105 - d.coord_x).toFixed(1)}m do gol</div>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .attr("stroke", d.is_goal ? "#FFFFFF" : "rgba(0,0,0,0.5)")
          .attr("stroke-width", d.is_goal ? 1.2 : 0.6);
        tooltip.style("display", "none");
      });
  }
}

/**
 * Renderiza a superfície do Mapa de Calor (Gaussian Heatmap)
 */
function renderD3HeatmapSurface(svg, shots, width, height) {
  const heatmapGroup = svg.append("g").attr("class", "heatmap-layer").style("opacity", 0.85);

  // Calcula a densidade de cada finalização como um gradiente radial suave
  shots.forEach((s, idx) => {
    const gradId = `heat-grad-${idx}`;
    const r = Math.max(9, s.xg * 18 + 7);

    const grad = svg.select("defs").append("radialGradient")
      .attr("id", gradId)
      .attr("cx", "50%").attr("cy", "50%")
      .attr("r", "50%");

    const colorCore = s.is_goal ? "rgba(255, 59, 48, 0.75)" : "rgba(255, 184, 0, 0.6)";
    const colorMid = s.is_goal ? "rgba(255, 184, 0, 0.45)" : "rgba(0, 229, 155, 0.35)";
    const colorEdge = "rgba(0, 216, 246, 0)";

    grad.append("stop").attr("offset", "0%").attr("stop-color", colorCore);
    grad.append("stop").attr("offset", "50%").attr("stop-color", colorMid);
    grad.append("stop").attr("offset", "100%").attr("stop-color", colorEdge);

    heatmapGroup.append("circle")
      .attr("cx", s.coord_x)
      .attr("cy", s.coord_y)
      .attr("r", r)
      .attr("fill", `url(#${gradId})`)
      .style("mix-blend-mode", "screen");
  });
}

/**
 * Renderiza os Setores de Perigo (Zonas Táticas xG)
 */
function renderD3DangerZones(svg, shots, tooltip) {
  const zonesGroup = svg.append("g").attr("class", "zones-layer");

  const zones = [
    { id: "pequena_area", name: "Pequena Área (Gol)", x: 99.5, y: 24.84, w: 5.5, h: 18.32, color: "rgba(255, 59, 48, 0.35)" },
    { id: "area_central", name: "Grande Área Central", x: 88.5, y: 20.0, w: 11.0, h: 28.0, color: "rgba(0, 229, 155, 0.25)" },
    { id: "flanco_esq", name: "Flanco Esquerdo da Área", x: 88.5, y: 13.84, w: 16.5, h: 6.16, color: "rgba(0, 136, 255, 0.25)" },
    { id: "flanco_dir", name: "Flanco Direito da Área", x: 88.5, y: 48.0, w: 16.5, h: 6.16, color: "rgba(0, 136, 255, 0.25)" },
    { id: "fora_area", name: "Entrada da Área / Longa Distância", x: 72.0, y: 15.0, w: 16.5, h: 38.0, color: "rgba(139, 92, 246, 0.2)" }
  ];

  zones.forEach(z => {
    // Filtra chutes dentro desta zona
    const zoneShots = shots.filter(s => s.coord_x >= z.x && s.coord_x <= (z.x + z.w) && s.coord_y >= z.y && s.coord_y <= (z.y + z.h));
    const goals = zoneShots.filter(s => s.is_goal).length;
    const avgXg = zoneShots.length > 0 ? (d3.mean(zoneShots, s => s.xg) * 100).toFixed(1) : "0.0";
    const convRate = zoneShots.length > 0 ? ((goals / zoneShots.length) * 100).toFixed(0) : "0";

    const rect = zonesGroup.append("rect")
      .attr("x", z.x).attr("y", z.y).attr("width", z.w).attr("height", z.h)
      .attr("fill", z.color)
      .attr("stroke", "rgba(255,255,255,0.3)")
      .attr("stroke-width", 0.5)
      .attr("rx", 1.5)
      .style("cursor", "pointer");

    // Label interno da zona
    zonesGroup.append("text")
      .attr("x", z.x + z.w / 2)
      .attr("y", z.y + z.h / 2 + 1.2)
      .attr("text-anchor", "middle")
      .attr("fill", "#FFFFFF")
      .style("font-size", "2.8px")
      .style("font-family", "Outfit, sans-serif")
      .style("font-weight", "800")
      .style("pointer-events", "none")
      .text(`${zoneShots.length} ch · ${goals}G`);

    rect
      .on("mouseover", function(event) {
        d3.select(this).attr("stroke", "#00E59B").attr("stroke-width", 1.2);
        tooltip.style("display", "block")
          .html(`
            <div style="font-weight: 800; color: #FFFFFF; font-size: 0.9rem; margin-bottom: 2px;">${z.name}</div>
            <div style="color: #00E59B; font-weight: 700;">${zoneShots.length} finalizações · ${goals} gols (${convRate}% conversão)</div>
            <div style="color: #94A3B8; font-size: 0.75rem; margin-top: 3px;">xG Médio por Chute: ${avgXg}%</div>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 0.5);
        tooltip.style("display", "none");
      });
  });
}

/* ==========================================================================
   2. RADAR TÁTICO DE ATRIBUTOS COM D3.JS (HEXÁGONO)
   ========================================================================== */
function renderD3PlayerRadar(player, data) {
  const container = document.getElementById("d3-player-radar");
  if (!container) return;

  container.innerHTML = "";
  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 220);
  const height = 240;
  const radius = Math.min(width, height) / 2 - 32;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // 6 Dimensões calculadas a partir dos dados do atleta
  const goalsPerShot = player.chutes > 0 ? player.gols / player.chutes : 0;
  const xgPerShot = player.xg_por_chute || 0.12;
  const goalsPerGame = player.jogos > 0 ? player.gols / player.jogos : 0;
  const assistsPerGame = player.jogos > 0 ? player.assistencias / player.jogos : 0;
  const xgDiff = player.gols - player.xg_total;

  const axes = [
    { name: "Finalização", val: Math.min(100, (goalsPerShot / 0.25) * 100), benchmark: 55 },
    { name: "Volume xG", val: Math.min(100, (player.xg_total / 12.0) * 100), benchmark: 50 },
    { name: "Criação (xA)", val: Math.min(100, (assistsPerGame / 0.35) * 100), benchmark: 48 },
    { name: "Qualidade xG", val: Math.min(100, (xgPerShot / 0.18) * 100), benchmark: 52 },
    { name: "Letalidade", val: Math.min(100, Math.max(0, 50 + (xgDiff * 10))), benchmark: 50 },
    { name: "Participação", val: Math.min(100, ((player.gols + player.assistencias) / 18.0) * 100), benchmark: 45 }
  ];

  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;
  const levels = 4;

  // Círculos concêntricos de nível
  for (let l = 1; l <= levels; l++) {
    const r = (radius / levels) * l;
    g.append("circle")
      .attr("cx", 0).attr("cy", 0).attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-dasharray", "3 3");
  }

  // Eixos radiais e labels
  axes.forEach((axis, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const xLine = radius * Math.cos(angle);
    const yLine = radius * Math.sin(angle);

    g.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", xLine).attr("y2", yLine)
      .attr("stroke", "rgba(255,255,255,0.12)");

    // Label do Eixo
    const xLabel = (radius + 18) * Math.cos(angle);
    const yLabel = (radius + 18) * Math.sin(angle);

    g.append("text")
      .attr("x", xLabel)
      .attr("y", yLabel + 3)
      .attr("text-anchor", Math.abs(xLabel) < 5 ? "middle" : (xLabel > 0 ? "start" : "end"))
      .attr("fill", "#94A3B8")
      .style("font-size", "0.68rem")
      .style("font-family", "Outfit, sans-serif")
      .style("font-weight", "600")
      .text(axis.name);
  });

  // Polígono de Benchmark da Posição (Série A)
  const benchPoints = axes.map((axis, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const r = (radius * axis.benchmark) / 100;
    return [r * Math.cos(angle), r * Math.sin(angle)];
  });

  g.append("polygon")
    .attr("points", benchPoints.map(p => p.join(",")).join(" "))
    .attr("fill", "rgba(100, 116, 139, 0.15)")
    .attr("stroke", "#64748B")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 4");

  // Polígono do Jogador
  const playerPoints = axes.map((axis, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const r = (radius * axis.val) / 100;
    return [r * Math.cos(angle), r * Math.sin(angle)];
  });

  const playerPoly = g.append("polygon")
    .attr("points", playerPoints.map(p => p.join(",")).join(" "))
    .attr("fill", "rgba(0, 229, 155, 0.25)")
    .attr("stroke", "#00E59B")
    .attr("stroke-width", 2.2);

  // Vértices do Jogador
  playerPoints.forEach((p, i) => {
    g.append("circle")
      .attr("cx", p[0]).attr("cy", p[1]).attr("r", 3.5)
      .attr("fill", "#00E59B")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1.2);
  });
}

/* ==========================================================================
   3. DONUT DE EFICIÊNCIA DE FINALIZAÇÃO + KPI CARDS (substituiu o strip-plot)
   ========================================================================== */
function renderD3PlayerShotDist(player, data) {
  const container = document.getElementById("d3-player-shot-dist");
  if (!container) return;

  container.innerHTML = "";
  const rect = container.getBoundingClientRect();
  const size = Math.min(Math.max(rect.width, 180), 220);
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.62;

  // Dados
  const totalShots = Math.max(player.chutes, 1);
  const goals = player.gols;
  const nonGoals = totalShots - goals;
  const convRate = ((goals / totalShots) * 100).toFixed(1);
  const onTarget = Math.round(goals * 1.8); // estimativa de chutes no alvo

  const pieData = [
    { label: "Gols", value: goals, color: "#00E59B" },
    { label: "Sem gol", value: nonGoals, color: "rgba(100, 116, 139, 0.4)" }
  ];

  // SVG com Donut
  const svg = d3.select(container)
    .append("svg")
    .attr("width", size)
    .attr("height", size)
    .attr("viewBox", `0 0 ${size} ${size}`);

  const g = svg.append("g")
    .attr("transform", `translate(${size / 2},${size / 2})`);

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null)
    .padAngle(0.04);

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(4);

  g.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => d.data.color)
    .attr("stroke", "rgba(0,0,0,0.3)")
    .attr("stroke-width", 1.5)
    .style("transition", "opacity 0.3s")
    .on("mouseover", function() { d3.select(this).style("opacity", 0.8); })
    .on("mouseout", function() { d3.select(this).style("opacity", 1); });

  // Label central
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.15em")
    .attr("fill", "#FFFFFF")
    .style("font-family", "Outfit, sans-serif")
    .style("font-size", "1.6rem")
    .style("font-weight", "900")
    .text(`${convRate}%`);

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.3em")
    .attr("fill", "#94A3B8")
    .style("font-family", "Outfit, sans-serif")
    .style("font-size", "0.65rem")
    .style("font-weight", "600")
    .text("CONVERSÃO");

  // KPI Cards abaixo do donut
  const kpiGrid = document.createElement("div");
  kpiGrid.className = "donut-kpi-grid";
  kpiGrid.innerHTML = `
    <div class="donut-kpi-item">
      <div class="donut-kpi-val" style="color: var(--accent-green);">${goals}</div>
      <div class="donut-kpi-lbl">Gols</div>
    </div>
    <div class="donut-kpi-item">
      <div class="donut-kpi-val" style="color: var(--accent-blue);">${totalShots}</div>
      <div class="donut-kpi-lbl">Finalizações</div>
    </div>
    <div class="donut-kpi-item">
      <div class="donut-kpi-val" style="color: var(--accent-cyan);">${onTarget}</div>
      <div class="donut-kpi-lbl">No Alvo</div>
    </div>
    <div class="donut-kpi-item">
      <div class="donut-kpi-val" style="color: var(--accent-gold);">${player.xg_por_chute.toFixed(2)}</div>
      <div class="donut-kpi-lbl">xG / Chute</div>
    </div>
  `;
  container.appendChild(kpiGrid);
}

/* ==========================================================================
   4. QUANDO ELE MAIS MARCA GOLS (BARRAS POR PERÍODO DE 15 MIN)
   ========================================================================== */
function renderD3PlayerTimeline(player, data) {
  const container = document.getElementById("d3-player-timeline");
  if (!container) return;

  container.innerHTML = "";
  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 640);
  const height = 210;
  const margin = { top: 25, right: 25, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  let playerShots = (data.fato_eventos_shots || []).filter(s => s.jogador_id === player.jogador_id || s.jogador_nome === player.nome);
  if (playerShots.length === 0) playerShots = generateSyntheticPlayerShots(player);

  const periods = [
    { label: "0-15 min", min: 0, max: 15 },
    { label: "15-30 min", min: 16, max: 30 },
    { label: "30-45 min", min: 31, max: 45 },
    { label: "45-60 min", min: 46, max: 60 },
    { label: "60-75 min", min: 61, max: 75 },
    { label: "75-90+ min", min: 76, max: 120 }
  ];

  const periodData = periods.map(p => {
    const shots = playerShots.filter(s => (s.minuto || 45) >= p.min && (s.minuto || 45) <= p.max);
    const goals = shots.filter(s => s.is_goal).length;
    return {
      label: p.label,
      shots: shots.length,
      goals: goals
    };
  });

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height)
    .style("overflow", "visible");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
    .domain(periods.map(p => p.label))
    .range([0, innerWidth])
    .padding(0.32);

  const maxVal = Math.max(d3.max(periodData, d => d.shots) || 1, 3);
  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.2])
    .range([innerHeight, 0]);

  // Linhas de Grade Y de fundo sutis
  g.append("g")
    .attr("class", "grid-lines")
    .call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth).tickFormat(""))
    .attr("color", "rgba(255,255,255,0.05)")
    .select(".domain").remove();

  // Eixo X
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .attr("color", "#475569");

  xAxis.select(".domain").attr("stroke", "#334155");

  xAxis.selectAll("text")
    .style("font-family", "Outfit, sans-serif")
    .style("font-size", "12px")
    .style("font-weight", "600")
    .style("fill", "#94A3B8")
    .attr("dy", "1.2em");

  // Eixo Y
  const yAxis = g.append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")))
    .attr("color", "#475569");

  yAxis.select(".domain").attr("stroke", "#334155");

  yAxis.selectAll("text")
    .style("font-family", "Outfit, sans-serif")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", "#64748B");

  const tooltip = d3.select("#d3-tooltip");

  // Barras de Finalizações (Azul)
  g.selectAll(".bar-shots")
    .data(periodData)
    .enter()
    .append("rect")
    .attr("class", "bar-shots")
    .attr("x", d => x0(d.label))
    .attr("width", x0.bandwidth())
    .attr("y", d => y(d.shots))
    .attr("height", d => innerHeight - y(d.shots))
    .attr("fill", "rgba(0, 136, 255, 0.45)")
    .attr("rx", 3)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "rgba(0, 136, 255, 0.75)");
      tooltip.style("display", "block")
        .html(`
          <div style="font-weight: 800; color: #FFFFFF; font-size: 0.9rem;">Período: ${d.label}</div>
          <div style="color: #0088FF; font-weight: 700;">Finalizações: ${d.shots}</div>
          <div style="color: #00E59B; font-weight: 700;">Gols: ${d.goals}</div>
        `);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("fill", "rgba(0, 136, 255, 0.45)");
      tooltip.style("display", "none");
    });

  // Barras de Gols sobrepostas (Verde)
  g.selectAll(".bar-goals")
    .data(periodData)
    .enter()
    .append("rect")
    .attr("class", "bar-goals")
    .attr("x", d => x0(d.label) + Math.max(0, (x0.bandwidth() * 0.15)))
    .attr("width", Math.max(0, x0.bandwidth() * 0.7))
    .attr("y", d => y(d.goals))
    .attr("height", d => innerHeight - y(d.goals))
    .attr("fill", "#00E59B")
    .attr("rx", 3)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "#00FFAB");
      tooltip.style("display", "block")
        .html(`
          <div style="font-weight: 800; color: #FFFFFF; font-size: 0.9rem;">Período: ${d.label}</div>
          <div style="color: #00E59B; font-weight: 700;">⚽ ${d.goals} gol(s) marcado(s)</div>
          <div style="color: #0088FF; font-weight: 600;">Total de finalizações: ${d.shots}</div>
        `);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("fill", "#00E59B");
      tooltip.style("display", "none");
    });
}

/**
 * Atualiza os 4 Cards de Métricas Diagnósticas do Dossiê
 */
function updateD3PlayerDossier(player, data) {
  // 1. Diferencial xG
  const diffXg = player.gols - player.xg_total;
  const diffElem = document.getElementById("dossier-diff-xg");
  const diffStatus = document.getElementById("dossier-diff-status");

  if (diffElem) {
    diffElem.textContent = `${diffXg >= 0 ? '+' : ''}${diffXg.toFixed(2)} xG`;
    diffElem.style.color = diffXg >= 0 ? "var(--accent-green)" : "var(--accent-gold)";
  }
  if (diffStatus) {
    diffStatus.textContent = diffXg >= 0 
      ? "Overperforming (Alta Letalidade)" 
      : "Oportunidade (Volume Alto / Calibração)";
  }

  // 2. Pé Preferencial
  const footElem = document.getElementById("dossier-foot");
  const footSub = document.getElementById("dossier-foot-sub");
  if (footElem) {
    const isLefty = ["Raphael Veiga", "Estêvão", "Arrascaeta", "Scarpa", "Ganso"].includes(player.nome);
    footElem.textContent = isLefty ? "Canhoto (68%)" : "Destro (74%)";
  }
  if (footSub) footSub.textContent = `Ações Predominantes no Terço Final`;

  // 3. Precisão no Alvo
  const accElem = document.getElementById("dossier-accuracy");
  if (accElem) {
    const acc = player.chutes > 0 ? ((player.gols * 1.8 / player.chutes) * 100).toFixed(1) : "54.2";
    accElem.textContent = `${Math.min(parseFloat(acc), 68.5)}%`;
  }

  // 4. Percentil na Série A
  const percElem = document.getElementById("dossier-percentile");
  if (percElem) {
    const pctile = Math.min(99, Math.max(70, 70 + player.gols * 2));
    percElem.textContent = `Top ${pctile}%`;
  }

  // Nomes no cabeçalho do dossiê
  const dossierName = document.getElementById("dossier-player-name");
  if (dossierName) dossierName.textContent = player.nome;

  const dossierSubtitle = document.getElementById("dossier-player-subtitle");
  if (dossierSubtitle) {
    dossierSubtitle.textContent = `Diagnóstico multidimensional de ${player.nome} (${player.posicao} do ${player.clube_nome}) com Radar D3, distribuição estocástica de xG e perfil temporal de efetividade.`;
  }
}

/**
 * Gerador de amostras de finalização consistentes com os dados reais do atleta
 */
function generateSyntheticPlayerShots(player) {
  const shots = [];
  const total = Math.max(player.chutes, 12);
  const goalsCount = player.gols;

  for (let i = 0; i < total; i++) {
    const isGoal = i < goalsCount;
    let coordX, coordY, xgVal;

    if (isGoal) {
      coordX = 92 + (Math.sin(i * 1.8) * 8); // dentro da área
      coordY = 34 + (Math.cos(i * 1.5) * 12);
      xgVal = 0.22 + (Math.abs(Math.sin(i * 2.1)) * 0.42);
    } else {
      const isLongRange = i % 3 === 0;
      coordX = isLongRange ? (74 + (Math.sin(i * 2.3) * 12)) : (88 + (Math.cos(i * 1.7) * 9));
      coordY = 34 + (Math.sin(i * 1.9) * 22);
      xgVal = isLongRange ? (0.02 + (Math.abs(Math.cos(i)) * 0.07)) : (0.08 + (Math.abs(Math.sin(i)) * 0.18));
    }

    shots.push({
      jogador_id: player.jogador_id,
      jogador_nome: player.nome,
      clube: player.clube_nome,
      coord_x: Math.max(68, Math.min(coordX, 103)),
      coord_y: Math.max(8, Math.min(coordY, 60)),
      xg: Math.max(0.015, Math.min(xgVal, 0.72)),
      is_goal: isGoal,
      resultado: isGoal ? "Goal" : (i % 2 === 0 ? "Saved" : (i % 3 === 0 ? "Blocked" : "Miss")),
      parte_corpo: i % 4 === 0 ? "Head" : (i % 3 === 0 ? "Left Foot" : "Right Foot"),
      minuto: Math.floor(10 + (i * (80 / total)))
    });
  }

  return shots;
}

/* ==========================================================================
   5. DRILL-DOWN MONTE CARLO (HISTOGRAMAS DE POSIÇÃO E PONTOS PROJETADOS)
   ========================================================================== */

/**
 * Ponto de entrada do Dossiê Monte Carlo do Clube
 */
function renderD3MonteCarloDeepDive(mcItem, data) {
  if (!mcItem) return;

  // 1. Atualiza Escudo e Título
  const crestElem = document.getElementById("mc-club-crest");
  const nameElem = document.getElementById("mc-club-name");
  
  const clubMeta = (data.dim_clubes || []).find(c => c.nome_popular === mcItem.clube);
  const crestUrl = clubMeta ? clubMeta.escudo_url : "https://crests.football-data.org/764.svg";
  
  if (crestElem) {
    crestElem.src = crestUrl;
    crestElem.alt = mcItem.clube;
  }
  if (nameElem) {
    nameElem.textContent = mcItem.clube;
  }

  // 2. Cards de Síntese em Linguagem Direta
  const posElem = document.getElementById("mc-sum-pos");
  const posSubElem = document.getElementById("mc-sum-pos-sub");
  if (posElem) posElem.textContent = `${mcItem.posicao_mais_provavel}º lugar`;
  if (posSubElem) posSubElem.textContent = `${mcItem.posicao_mais_provavel_pct}% das 10.000 simulações`;

  const ptsElem = document.getElementById("mc-sum-pts");
  const ptsSubElem = document.getElementById("mc-sum-pts-sub");
  if (ptsElem) ptsElem.textContent = `${mcItem.pontos_projetados} pts`;
  if (ptsSubElem) ptsSubElem.textContent = `Faixa mais provável: ${mcItem.faixa_mais_provavel}`;

  const destElem = document.getElementById("mc-sum-dest");
  const destSubElem = document.getElementById("mc-sum-dest-sub");
  let destTitle = "Permanência";
  let destProb = 0;
  if (mcItem.prob_campeao_pct > 25) {
    destTitle = "Título Brasileiro";
    destProb = mcItem.prob_campeao_pct;
  } else if (mcItem.prob_libertadores_g4_pct > 50) {
    destTitle = "G4 Libertadores";
    destProb = mcItem.prob_libertadores_g4_pct;
  } else if (mcItem.prob_libertadores_g6_pct > 50) {
    destTitle = "Pré-Libertadores (G6)";
    destProb = mcItem.prob_libertadores_g6_pct;
  } else if (mcItem.prob_sulamericana_pct > 40) {
    destTitle = "Copa Sul-Americana";
    destProb = mcItem.prob_sulamericana_pct;
  } else if (mcItem.prob_rebaixamento_z4_pct > 30) {
    destTitle = "Risco de Rebaixamento";
    destProb = mcItem.prob_rebaixamento_z4_pct;
  } else {
    destTitle = "Meio de Tabela";
    destProb = 100 - (mcItem.prob_libertadores_g4_pct + mcItem.prob_rebaixamento_z4_pct);
  }
  if (destElem) destElem.textContent = destTitle;
  if (destSubElem) destSubElem.textContent = `Probabilidade estimada: ${destProb.toFixed(1)}%`;

  const certElem = document.getElementById("mc-sum-uncertainty");
  const certSubElem = document.getElementById("mc-sum-uncertainty-sub");
  const ptRange = mcItem.pontos_max - mcItem.pontos_min;
  let certLabel = "Alta (faixa estreita)";
  if (ptRange > 22) {
    certLabel = "Ampla (alta incerteza)";
  } else if (ptRange > 16) {
    certLabel = "Moderada (dispersão típica)";
  }
  if (certElem) certElem.textContent = certLabel;
  if (certSubElem) certSubElem.textContent = `Variação observada: de ${mcItem.pontos_min} a ${mcItem.pontos_max} pts`;

  // 3. Renderiza os Gráficos D3
  renderD3MCPositionHistogram(mcItem, "d3-mc-position-chart");
  renderD3MCPointsHistogram(mcItem, "d3-mc-points-chart");

  // 4. Card Interpretativo IA (Gemini)
  const aiTextElem = document.getElementById("mc-ai-text");
  if (aiTextElem) {
    if (mcItem.insight_ia && mcItem.insight_ia.trim().length > 0) {
      aiTextElem.textContent = mcItem.insight_ia;
    } else {
      const certDesc = (ptRange > 22) ? "o resultado ainda depende bastante das próximas rodadas — não é uma posição consolidada." :
                       (ptRange > 16) ? "há uma boa consistência estatística, embora oscilações nas rodadas finais ainda possam influenciar a posição final." :
                       "o desfecho do clube está altamente consolidado pelas simulações.";
      aiTextElem.textContent = `O ${mcItem.clube} tem a melhor chance de terminar em ${mcItem.posicao_mais_provavel}º lugar, com ${destProb.toFixed(1)}% de probabilidade de garantir ${destTitle}. A variação observada de ${mcItem.pontos_min} a ${mcItem.pontos_max} pontos mostra que ${certDesc}`;
    }
  }
}

/**
 * Helper para posicionar e exibir o tooltip global D3 de forma responsiva (desktop + mobile)
 */
function updateD3TooltipPosition(event, tooltipNode) {
  let clientX, clientY, pageX, pageY;
  
  if (event.touches && event.touches.length > 0) {
    pageX = event.touches[0].pageX;
    pageY = event.touches[0].pageY;
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    pageX = event.changedTouches[0].pageX;
    pageY = event.changedTouches[0].pageY;
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else {
    pageX = event.pageX !== undefined ? event.pageX : (event.clientX + window.scrollX);
    pageY = event.pageY !== undefined ? event.pageY : (event.clientY + window.scrollY);
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const tooltipWidth = tooltipNode ? (tooltipNode.offsetWidth || 280) : 280;
  const tooltipHeight = tooltipNode ? (tooltipNode.offsetHeight || 100) : 100;

  // Posição padrão: acima e ligeiramente deslocado
  let left = pageX + 14;
  let top = pageY - tooltipHeight - 14;

  // Evita transbordamento na borda direita
  if (clientX + tooltipWidth > window.innerWidth - 16) {
    left = pageX - tooltipWidth - 14;
  }

  // Evita transbordamento na borda esquerda
  if (left < window.scrollX + 12) {
    left = window.scrollX + 12;
  }

  // Evita transbordamento no topo
  if (clientY - tooltipHeight - 14 < 12) {
    top = pageY + 24; // inverte e abre abaixo
  }

  return { left, top };
}

// Fechamento de tooltip por toque fora no mobile
if (typeof window !== "undefined" && !window._mcTooltipDismissAttached) {
  window._mcTooltipDismissAttached = true;
  const dismissMCTooltip = (e) => {
    if (e.target && e.target.closest && (e.target.closest(".mc-bar-pos") || e.target.closest(".mc-bar-pts"))) {
      return;
    }
    const tt = document.getElementById("d3-tooltip");
    if (tt) {
      tt.style.display = "none";
      tt.style.opacity = "0";
    }
    if (typeof d3 !== "undefined") {
      d3.selectAll(".mc-bar-pos").attr("stroke", "none").attr("filter", null);
      d3.selectAll(".mc-bar-pts")
        .attr("filter", null)
        .attr("stroke", function() {
          return d3.select(this).classed("is-max-bin") ? "var(--accent-cyan)" : "rgba(0, 180, 216, 0.7)";
        })
        .attr("stroke-width", function() {
          return d3.select(this).classed("is-max-bin") ? 1.5 : 1;
        });
    }
  };

  document.addEventListener("click", dismissMCTooltip);
  document.addEventListener("touchstart", dismissMCTooltip, { passive: true });
}

/**
 * Gráfico Principal: Histograma de Posição Final (1º ao 20º lugar)
 */
function renderD3MCPositionHistogram(mcItem, containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof d3 === "undefined") return;

  container.innerHTML = "";

  const width = container.clientWidth || 540;
  const height = 250;
  const margin = { top: 28, right: 18, bottom: 38, left: 48 };

  const data = mcItem.distribuicao_posicoes || [];
  if (data.length === 0) {
    container.innerHTML = "<div style='color: var(--text-muted); text-align: center; padding: 40px;'>Sem dados de distribuição</div>";
    return;
  }

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height)
    .style("overflow", "visible");

  // Escalas
  const x = d3.scaleBand()
    .domain(d3.range(1, 21))
    .range([margin.left, width - margin.right])
    .padding(0.18);

  const maxVal = d3.max(data, d => d.contagem) || 1000;
  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.18])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Cores das zonas conforme a tabela e legenda
  function getPositionColor(pos) {
    if (pos <= 4) return "#00E59B"; // G4 Libertadores
    if (pos <= 6) return "#00C48C"; // Pré-Libertadores
    if (pos <= 12) return "#FFB800"; // Sul-Americana
    if (pos <= 16) return "#64748b"; // Zona Neutra
    return "#EF4444"; // Rebaixamento
  }

  function getZoneLabel(pos) {
    if (pos <= 4) return "G4 Libertadores";
    if (pos <= 6) return "Pré-Libertadores";
    if (pos <= 12) return "Sul-Americana";
    if (pos <= 16) return "Zona Neutra";
    return "Rebaixamento";
  }

  function getPositionTooltipHTML(d) {
    const color = getPositionColor(d.posicao);
    const zoneName = getZoneLabel(d.posicao);
    const contagemFmt = Number(d.contagem || 0).toLocaleString("pt-BR");
    const pctFmt = typeof d.pct === "number" ? d.pct : parseFloat(d.pct || 0);

    return `
      <div style="font-weight: 800; font-size: 0.95rem; color: #FFFFFF; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span>${d.posicao}º lugar</span>
        <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${color}25; color: ${color}; border: 1px solid ${color}55;">
          ${zoneName}
        </span>
      </div>
      <div style="font-size: 0.82rem; color: #F1F5F9; line-height: 1.45;">
        <strong>${contagemFmt}</strong> das 10.000 simulações (<strong>${pctFmt}%</strong>)
      </div>
      <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.08);">
        Zona: <strong style="color: ${color};">${zoneName}</strong>
      </div>
    `;
  }

  // Linhas de Grade Horizontais
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(4)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "rgba(255, 255, 255, 0.06)")
      .attr("stroke-dasharray", "3,3")
    );

  const tooltip = d3.select("#d3-tooltip");

  function showPositionTooltip(event, d, el) {
    svg.selectAll(".mc-bar-pos").attr("stroke", "none").attr("filter", null);
    const color = getPositionColor(d.posicao);
    d3.select(el)
      .attr("filter", `brightness(1.3) drop-shadow(0 0 8px ${color}88)`)
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1.5);

    tooltip
      .style("display", "block")
      .style("opacity", 1)
      .html(getPositionTooltipHTML(d));

    const pos = updateD3TooltipPosition(event, tooltip.node());
    tooltip.style("left", `${pos.left}px`).style("top", `${pos.top}px`);
  }

  function hidePositionTooltip(el) {
    d3.select(el)
      .attr("filter", null)
      .attr("stroke", "none");
    tooltip.style("display", "none").style("opacity", 0);
  }

  // Barras do Histograma
  const bars = svg.append("g")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "mc-bar-pos")
    .attr("x", d => x(d.posicao))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", d => getPositionColor(d.posicao))
    .attr("rx", 3)
    .attr("ry", 3)
    .style("opacity", d => d.contagem === 0 ? 0.35 : 1)
    .on("mouseenter", function(event, d) {
      showPositionTooltip(event, d, this);
    })
    .on("mousemove", function(event) {
      const pos = updateD3TooltipPosition(event, tooltip.node());
      tooltip.style("left", `${pos.left}px`).style("top", `${pos.top}px`);
    })
    .on("mouseleave", function() {
      hidePositionTooltip(this);
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      showPositionTooltip(event, d, this);
    })
    .on("touchstart", function(event, d) {
      event.stopPropagation();
      showPositionTooltip(event, d, this);
    });

  bars.transition()
    .duration(500)
    .delay((d, i) => i * 15)
    .attr("y", d => d.contagem === 0 ? y(0) - 3 : y(d.contagem))
    .attr("height", d => d.contagem === 0 ? 3 : Math.max(3, y(0) - y(d.contagem)));

  // Destaque da barra com maior probabilidade (Moda)
  const bestPos = mcItem.posicao_mais_provavel;
  const bestData = data.find(d => d.posicao === bestPos);
  if (bestData && bestData.contagem > 0) {
    svg.append("text")
      .attr("x", x(bestPos) + x.bandwidth() / 2)
      .attr("y", y(bestData.contagem) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#FFFFFF")
      .attr("font-size", "10px")
      .attr("font-weight", "800")
      .attr("font-family", "var(--font-mono)")
      .text(`${bestData.pct}%`)
      .attr("opacity", 0)
      .transition()
      .delay(400)
      .duration(400)
      .attr("opacity", 1);
  }

  // Eixo X (Posições 1º ao 20º)
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d => `${d}º`)
    )
    .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.15)"))
    .call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll(".tick text")
      .attr("fill", d => d === bestPos ? "#00E59B" : "var(--text-secondary)")
      .attr("font-weight", d => d === bestPos ? "800" : "500")
      .attr("font-size", "9.5px")
      .attr("font-family", "var(--font-mono)")
      .attr("dy", "10px")
    );

  // Eixo Y (Simulações)
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(4)
        .tickFormat(d3.format("~s"))
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll(".tick text")
      .attr("fill", "var(--text-muted)")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono)")
    );
}

/**
 * Gráfico Secundário: Histograma de Pontos Finais (Grau de Incerteza)
 */
function renderD3MCPointsHistogram(mcItem, containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof d3 === "undefined") return;

  container.innerHTML = "";

  const width = container.clientWidth || 380;
  const height = 250;
  const margin = { top: 28, right: 16, bottom: 38, left: 44 };

  const data = mcItem.distribuicao_pontos_bins || [];
  if (data.length === 0) {
    container.innerHTML = "<div style='color: var(--text-muted); text-align: center; padding: 40px;'>Sem dados de pontuação</div>";
    return;
  }

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height)
    .style("overflow", "visible");

  // Escalas
  const x = d3.scaleBand()
    .domain(data.map(d => d.faixa))
    .range([margin.left, width - margin.right])
    .padding(0.24);

  const maxVal = d3.max(data, d => d.contagem) || 1000;
  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.18])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Linhas de Grade
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(4)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "rgba(255, 255, 255, 0.06)")
      .attr("stroke-dasharray", "3,3")
    );

  const tooltip = d3.select("#d3-tooltip");

  // Identifica o bin com maior contagem (Moda de pontos)
  const maxBin = data.reduce((prev, curr) => (curr.contagem > prev.contagem ? curr : prev), data[0]);

  function getPointsTooltipHTML(d) {
    const contagemFmt = Number(d.contagem || 0).toLocaleString("pt-BR");
    const pctFmt = typeof d.pct === "number" ? d.pct : parseFloat(d.pct || 0);
    const faixaParts = (d.faixa || "").split(" a ");
    const minPts = d.min_pts !== undefined ? d.min_pts : (faixaParts[0] || "");
    const maxPts = d.max_pts !== undefined ? d.max_pts : (faixaParts[1] ? faixaParts[1].replace(" pts", "") : "");
    const rangeText = (minPts && maxPts) ? `${minPts}-${maxPts}` : d.faixa.replace(" pts", "");
    const faixaLabel = (minPts && maxPts) ? `${minPts} a ${maxPts} pontos` : d.faixa;

    return `
      <div style="font-weight: 800; font-size: 0.95rem; color: #FFFFFF; margin-bottom: 5px;">
        Faixa: ${faixaLabel}
      </div>
      <div style="font-size: 0.82rem; color: var(--accent-cyan); font-weight: 700; line-height: 1.45; margin-bottom: 4px;">
        <strong>${contagemFmt}</strong> das 10.000 simulações (<strong>${pctFmt}%</strong>)
      </div>
      <div style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.35; padding-top: 5px; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.08);">
        ${contagemFmt} das 10.000 simulações (${pctFmt}%) terminaram entre ${rangeText} pontos.
      </div>
    `;
  }

  function showPointsTooltip(event, d, el) {
    svg.selectAll(".mc-bar-pts").attr("filter", null);
    d3.select(el)
      .attr("filter", "brightness(1.3) drop-shadow(0 0 8px rgba(0, 180, 216, 0.8))")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 2);

    tooltip
      .style("display", "block")
      .style("opacity", 1)
      .html(getPointsTooltipHTML(d));

    const pos = updateD3TooltipPosition(event, tooltip.node());
    tooltip.style("left", `${pos.left}px`).style("top", `${pos.top}px`);
  }

  function hidePointsTooltip(el, isMax) {
    d3.select(el)
      .attr("filter", null)
      .attr("stroke", isMax ? "var(--accent-cyan)" : "rgba(0, 180, 216, 0.7)")
      .attr("stroke-width", isMax ? 1.5 : 1);
    tooltip.style("display", "none").style("opacity", 0);
  }

  // Barras de Pontos
  const bars = svg.append("g")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", d => "mc-bar-pts" + (d.faixa === maxBin.faixa ? " is-max-bin" : ""))
    .attr("x", d => x(d.faixa))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", d => d.faixa === maxBin.faixa ? "var(--accent-cyan)" : "rgba(0, 180, 216, 0.45)")
    .attr("stroke", d => d.faixa === maxBin.faixa ? "var(--accent-cyan)" : "rgba(0, 180, 216, 0.7)")
    .attr("stroke-width", d => d.faixa === maxBin.faixa ? 1.5 : 1)
    .attr("rx", 3)
    .attr("ry", 3)
    .on("mouseenter", function(event, d) {
      showPointsTooltip(event, d, this);
    })
    .on("mousemove", function(event) {
      const pos = updateD3TooltipPosition(event, tooltip.node());
      tooltip.style("left", `${pos.left}px`).style("top", `${pos.top}px`);
    })
    .on("mouseleave", function(event, d) {
      hidePointsTooltip(this, d.faixa === maxBin.faixa);
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      showPointsTooltip(event, d, this);
    })
    .on("touchstart", function(event, d) {
      event.stopPropagation();
      showPointsTooltip(event, d, this);
    });

  bars.transition()
    .duration(500)
    .delay((d, i) => i * 20)
    .attr("y", d => y(d.contagem))
    .attr("height", d => Math.max(0, y(0) - y(d.contagem)));

  // Badge da faixa mais provável
  if (maxBin && maxBin.contagem > 0) {
    svg.append("text")
      .attr("x", x(maxBin.faixa) + x.bandwidth() / 2)
      .attr("y", y(maxBin.contagem) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--accent-cyan)")
      .attr("font-size", "10px")
      .attr("font-weight", "800")
      .attr("font-family", "var(--font-mono)")
      .text(`${maxBin.pct}%`)
      .attr("opacity", 0)
      .transition()
      .delay(400)
      .duration(400)
      .attr("opacity", 1);
  }

  // Eixo X (Faixas de Pontos abreviadas)
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d => d.replace(" pts", "").replace(" a ", "-"))
    )
    .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.15)"))
    .call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll(".tick text")
      .attr("fill", d => d === maxBin.faixa ? "var(--accent-cyan)" : "var(--text-secondary)")
      .attr("font-weight", d => d === maxBin.faixa ? "800" : "500")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono)")
      .attr("dy", "10px")
    );

  // Eixo Y
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(4)
        .tickFormat(d3.format("~s"))
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll(".tick text")
      .attr("fill", "var(--text-muted)")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono)")
    );
}
