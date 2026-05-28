/**
 * dashboard.js — Carrega e renderiza o dashboard principal.
 * Usa Chart.js (carregado via CDN no index.html).
 */

const Dashboard = (() => {
  let chartMensal = null;
  let chartCategorias = null;
  let chartEventos = null;

  // Cores Chart.js consistentes com o design
  const CORES = {
    green:   'rgba(34,197,94,0.8)',
    greenBg: 'rgba(34,197,94,0.15)',
    red:     'rgba(239,68,68,0.8)',
    redBg:   'rgba(239,68,68,0.15)',
    accent:  'rgba(56,189,248,0.8)',
    accentBg:'rgba(56,189,248,0.15)',
    yellow:  'rgba(250,204,21,0.8)',
    palette: [
      'rgba(56,189,248,0.8)','rgba(34,197,94,0.8)','rgba(250,204,21,0.8)',
      'rgba(239,68,68,0.8)','rgba(168,85,247,0.8)','rgba(249,115,22,0.8)',
      'rgba(20,184,166,0.8)','rgba(236,72,153,0.8)',
    ],
  };

  // Configuração global Chart.js (dark theme)
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#334155';
  Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

  function _destroyChart(instance) {
    if (instance) { instance.destroy(); }
    return null;
  }

  function _buildMensalChart(dados) {
    chartMensal = _destroyChart(chartMensal);
    const ctx = document.getElementById('chart-mensal');
    if (!ctx) return;
    chartMensal = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dados.map(d => d.mes),
        datasets: [
          {
            label: 'Receitas',
            data: dados.map(d => d.receitas),
            backgroundColor: CORES.greenBg,
            borderColor: CORES.green,
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Despesas',
            data: dados.map(d => d.despesas),
            backgroundColor: CORES.redBg,
            borderColor: CORES.red,
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: ctx => ` ${Fmt.moeda(ctx.raw)}` },
          },
        },
        scales: {
          y: {
            ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR') },
            grid: { color: '#1e293b' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function _buildCategoriasChart(dados) {
    chartCategorias = _destroyChart(chartCategorias);
    const ctx = document.getElementById('chart-categorias');
    if (!ctx) return;
    if (!dados.length) {
      ctx.parentElement.innerHTML += '<p class="text-muted text-center" style="margin-top:1rem">Sem dados</p>';
      return;
    }
    chartCategorias = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dados.map(d => d.label),
        datasets: [{
          data: dados.map(d => d.valor),
          backgroundColor: CORES.palette,
          borderColor: '#1e293b',
          borderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.label}: ${Fmt.moeda(ctx.raw)}` },
          },
        },
      },
    });
  }

  function _buildEventosChart(dados) {
    chartEventos = _destroyChart(chartEventos);
    const ctx = document.getElementById('chart-eventos');
    if (!ctx) return;
    if (!dados.length) {
      ctx.parentElement.innerHTML += '<p class="text-muted text-center" style="margin-top:1rem">Sem movimentações vinculadas a eventos ainda</p>';
      return;
    }
    chartEventos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dados.map(d => d.label),
        datasets: [{
          label: 'Lucro',
          data: dados.map(d => d.valor),
          backgroundColor: dados.map(d => d.valor >= 0 ? CORES.greenBg : CORES.redBg),
          borderColor:     dados.map(d => d.valor >= 0 ? CORES.green   : CORES.red),
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` Lucro: ${Fmt.moeda(ctx.raw)}` },
          },
        },
        scales: {
          x: {
            ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR') },
            grid: { color: '#1e293b' },
          },
          y: { grid: { display: false } },
        },
      },
    });
  }

  function _renderProximos(proximos) {
    const el = document.getElementById('proximos-eventos-list');
    if (!el) return;
    if (!proximos.length) {
      el.innerHTML = '<p class="text-muted">Nenhum evento futuro cadastrado.</p>';
      return;
    }
    el.innerHTML = proximos.map(e => `
      <div class="proximo-item">
        <div class="proximo-data">${Fmt.data(e.data_evento)}</div>
        <div class="proximo-info">
          <div class="proximo-nome">${e.nome}</div>
          <div class="proximo-det">${Fmt.str(e.cliente_nome)} ${e.local ? '· ' + e.local : ''}</div>
        </div>
        ${Fmt.statusEvento(e.status)}
      </div>
    `).join('');
  }

  async function carregar() {
    try {
      const d = await api.get('dashboard/resumo');

      // KPIs principais
      document.getElementById('d-receitas').textContent   = Fmt.moeda(d.total_receitas);
      document.getElementById('d-despesas').textContent   = Fmt.moeda(d.total_despesas);
      document.getElementById('d-lucro').textContent      = Fmt.moeda(d.lucro_total);
      document.getElementById('d-pendente').textContent   = Fmt.moeda(d.total_pendente);
      document.getElementById('d-eventos').textContent    = d.qtd_eventos;
      document.getElementById('d-clientes').textContent   = d.qtd_clientes;
      document.getElementById('d-fornecedores').textContent = d.qtd_fornecedores;
      document.getElementById('d-rec-mes').textContent    = Fmt.moeda(d.receitas_mes);
      document.getElementById('d-desp-mes').textContent   = Fmt.moeda(d.despesas_mes);
      document.getElementById('d-lucro-mes').textContent  = Fmt.moeda(d.lucro_mes);

      // Cor dinâmica do lucro
      const lucroEl = document.getElementById('d-lucro');
      const lucroMesEl = document.getElementById('d-lucro-mes');
      lucroEl.className = `card-value ${d.lucro_total >= 0 ? 'text-green' : 'text-red'}`;
      lucroMesEl.className = `card-value ${d.lucro_mes >= 0 ? 'text-green' : 'text-red'}`;

      // Gráficos
      _buildMensalChart(d.grafico_mensal);
      _buildCategoriasChart(d.grafico_categorias);
      _buildEventosChart(d.grafico_eventos);

      // Próximos eventos
      _renderProximos(d.proximos_eventos);

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  }

  return { carregar };
})();
