/**
 * relatorios.js — Relatório financeiro por evento.
 */

const Relatorios = (() => {

  async function inicializar() {
    // Popula o select de eventos
    try {
      const eventos = await api.get('eventos');
      const sel = document.getElementById('rel-evento-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Selecione um evento --</option>' +
        eventos.map(e =>
          `<option value="${e.id}">${e.nome}${e.data_evento ? ' — ' + Fmt.data(e.data_evento) : ''}</option>`
        ).join('');
    } catch (_) {}
  }

  async function carregar() {
    const sel = document.getElementById('rel-evento-select');
    const id  = sel?.value;
    if (!id) {
      Toast.show('Selecione um evento primeiro.', 'warning');
      return;
    }

    try {
      const d = await api.get(`relatorios/evento/${id}`);
      _renderRelatorio(d);
    } catch (err) {
      Toast.show(err.message || 'Erro ao gerar relatório.', 'error');
    }
  }

  function _renderRelatorio(d) {
    const resultado = document.getElementById('relatorio-resultado');
    if (!resultado) return;
    resultado.style.display = 'block';

    // Header
    document.getElementById('rel-nome-evento').textContent = d.evento.nome;
    document.getElementById('rel-info-evento').textContent = [
      d.cliente_nome ? `Cliente: ${d.cliente_nome}` : null,
      d.evento.local ? `Local: ${d.evento.local}` : null,
      d.evento.data_evento ? `Data: ${Fmt.data(d.evento.data_evento)}` : null,
    ].filter(Boolean).join(' · ');

    const badge = document.getElementById('rel-status-badge');
    badge.className = `badge badge-${d.evento.status}`;
    badge.textContent = {
      planejado: 'Planejado', em_andamento: 'Em Andamento',
      concluido: 'Concluído', cancelado: 'Cancelado',
    }[d.evento.status] || d.evento.status;

    // KPIs
    document.getElementById('rel-receitas').textContent = Fmt.moeda(d.total_receitas);
    document.getElementById('rel-despesas').textContent = Fmt.moeda(d.total_despesas);
    document.getElementById('rel-fechado').textContent  = Fmt.moeda(d.evento.valor_fechado);

    const lucroEl = document.getElementById('rel-lucro');
    lucroEl.textContent = Fmt.moeda(d.lucro_evento);
    lucroEl.className   = `card-value ${d.lucro_evento >= 0 ? 'text-green' : 'text-red'}`;

    // Tabela de movimentações
    const tbody = document.getElementById('rel-tbody');
    if (!tbody) return;

    if (!d.movimentacoes.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Nenhuma movimentação vinculada a este evento.</td></tr>`;
      return;
    }

    tbody.innerHTML = d.movimentacoes.map(m => {
      const sinal = m.tipo === 'receita' ? '+' : '-';
      const cls   = m.tipo === 'receita' ? 'valor-receita' : 'valor-despesa';
      return `
        <tr>
          <td>${Fmt.data(m.data)}</td>
          <td>${Fmt.tipoBadge(m.tipo)}</td>
          <td>${m.descricao}</td>
          <td>${Fmt.str(m.categoria_nome)}</td>
          <td class="${cls}">${sinal} ${Fmt.moeda(m.valor)}</td>
          <td>${Fmt.formaPag(m.forma_pagamento)}</td>
          <td>${Fmt.statusMov(m.status)}</td>
        </tr>
      `;
    }).join('');
  }

  return { inicializar, carregar };
})();
