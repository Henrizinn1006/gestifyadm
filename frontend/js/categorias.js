/**
 * categorias.js — CRUD de Categorias Financeiras.
 */

const Categorias = (() => {
  let _lista = [];
  let _editandoId = null;

  function _form(dados = {}) {
    return `
      <form id="form-categoria" onsubmit="Categorias.salvar(event)">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>Nome da Categoria *</label>
            <input type="text" class="input-field" name="nome" value="${dados.nome || ''}" required placeholder="Ex: Flores, Transporte, Pagamento de Cliente" />
          </div>
          <div class="form-group" style="flex:1">
            <label>Tipo *</label>
            <select class="input-field" name="tipo" required>
              <option value="receita" ${dados.tipo === 'receita' ? 'selected' : ''}>Receita</option>
              <option value="despesa" ${dados.tipo === 'despesa' ? 'selected' : ''}>Despesa</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="Modal.fechar()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${_editandoId ? 'Salvar Alterações' : 'Criar Categoria'}</button>
        </div>
      </form>
    `;
  }

  function _renderTabela() {
    const tbody = document.getElementById('tbody-categorias');
    if (!tbody) return;

    if (!_lista.length) {
      tbody.innerHTML = `
        <tr><td colspan="4">
          <div class="empty-state">
            <div class="empty-state-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M6 6h16l20 20-16 16L6 22V6z"/><circle cx="14" cy="14" r="3"/></svg></div>
            <p>Nenhuma categoria cadastrada.</p>
            <p class="text-muted" style="font-size:0.8rem;margin-top:0.5rem">Crie categorias para organizar suas receitas e despesas.</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = _lista.map(c => `
      <tr>
        <td><span class="text-muted">#${c.id}</span></td>
        <td><strong>${c.nome}</strong></td>
        <td>${Fmt.tipoBadge(c.tipo)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Editar" onclick="Categorias.editar(${c.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg></button>
            <button class="btn-icon" title="Excluir" onclick="Categorias.confirmarExclusao(${c.id}, '${c.nome.replace(/'/g,"\\'")}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function listar() {
    const tipo = document.getElementById('filtro-tipo-cat')?.value || '';
    try {
      const params = tipo ? `?tipo=${tipo}` : '';
      _lista = await api.get(`categorias${params}`);
      _renderTabela();
    } catch (err) {
      Toast.show('Erro ao carregar categorias.', 'error');
    }
  }

  function abrirModal(dados = {}) {
    _editandoId = null;
    Modal.abrir('Nova Categoria', _form(dados));
  }

  async function editar(id) {
    try {
      const dados = await api.get(`categorias/${id}`);
      _editandoId = id;
      Modal.abrir('Editar Categoria', _form(dados));
    } catch (err) {
      Toast.show('Erro ao carregar categoria.', 'error');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      nome: form.nome.value.trim(),
      tipo: form.tipo.value,
    };

    try {
      if (_editandoId) {
        await api.put(`categorias/${_editandoId}`, payload);
        Toast.show('Categoria atualizada!', 'success');
      } else {
        await api.post('categorias', payload);
        Toast.show('Categoria criada!', 'success');
      }
      Modal.fechar();
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar categoria.', 'error');
    }
  }

  function confirmarExclusao(id, nome) {
    Modal.abrirConfirm(
      `Deseja excluir a categoria "${nome}"? Movimentações vinculadas perderão a categoria.`,
      () => excluir(id)
    );
  }

  async function excluir(id) {
    try {
      await api.delete(`categorias/${id}`);
      Toast.show('Categoria excluída!', 'success');
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir categoria.', 'error');
    }
  }

  // Popula categorias padrão (chamado na primeira inicialização)
  async function popularPadrao() {
    const cats = await api.get('categorias');
    if (cats.length > 0) return; // Já tem categorias

    const padroes = [
      { nome: 'Pagamento de Cliente', tipo: 'receita' },
      { nome: 'Sinal / Entrada',      tipo: 'receita' },
      { nome: 'Parcela',              tipo: 'receita' },
      { nome: 'Adicional / Extra',    tipo: 'receita' },
      { nome: 'Flores e Decoração',   tipo: 'despesa' },
      { nome: 'Transporte',           tipo: 'despesa' },
      { nome: 'Equipe / Pessoal',     tipo: 'despesa' },
      { nome: 'Aluguel de Espaço',    tipo: 'despesa' },
      { nome: 'Alimentação',          tipo: 'despesa' },
      { nome: 'Manutenção',           tipo: 'despesa' },
      { nome: 'Taxas e Impostos',     tipo: 'despesa' },
      { nome: 'Materiais',            tipo: 'despesa' },
      { nome: 'Outros',               tipo: 'despesa' },
    ];

    try {
      for (const c of padroes) {
        await api.post('categorias', c);
      }
      Toast.show('Categorias padrão criadas!', 'success');
    } catch (_) {}
  }

  return { listar, abrirModal, editar, salvar, confirmarExclusao, excluir, popularPadrao };
})();
