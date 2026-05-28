/**
 * fornecedores.js — CRUD de Fornecedores.
 */

const Fornecedores = (() => {
  let _lista = [];
  let _editandoId = null;
  let _buscaTimer = null;

  function _form(dados = {}) {
    return `
      <form id="form-fornecedor" onsubmit="Fornecedores.salvar(event)">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>Nome *</label>
            <input type="text" class="input-field" name="nome" value="${dados.nome || ''}" required placeholder="Nome do fornecedor ou empresa" />
          </div>
          <div class="form-group" style="flex:1">
            <label>Telefone</label>
            <input type="text" class="input-field" name="telefone" value="${dados.telefone || ''}" placeholder="(99) 99999-9999" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" class="input-field" name="email" value="${dados.email || ''}" placeholder="contato@fornecedor.com" />
          </div>
          <div class="form-group">
            <label>Categoria / Serviço</label>
            <input type="text" class="input-field" name="categoria_servico" value="${dados.categoria_servico || ''}" placeholder="Ex: Floricultura, Buffet, Som e Luz" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Observações</label>
            <textarea class="input-field" name="observacoes" placeholder="Notas sobre o fornecedor...">${dados.observacoes || ''}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="Modal.fechar()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${_editandoId ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</button>
        </div>
      </form>
    `;
  }

  function _renderTabela() {
    const tbody = document.getElementById('tbody-fornecedores');
    if (!tbody) return;

    if (!_lista.length) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M8 36V16l16-10 16 10v20l-16 6-16-6z"/><path d="M24 6v36M8 16l16 10 16-10"/></svg></div>
            <p>Nenhum fornecedor cadastrado ainda.</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = _lista.map(f => `
      <tr>
        <td><span class="text-muted">#${f.id}</span></td>
        <td><strong>${f.nome}</strong></td>
        <td>${Fmt.str(f.telefone)}</td>
        <td>${Fmt.str(f.email)}</td>
        <td>${Fmt.str(f.categoria_servico)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Editar" onclick="Fornecedores.editar(${f.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg></button>
            <button class="btn-icon" title="Excluir" onclick="Fornecedores.confirmarExclusao(${f.id}, '${f.nome.replace(/'/g,"\\'")}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function listar() {
    const busca = document.getElementById('busca-fornecedores')?.value || '';
    try {
      _lista = await api.get(`fornecedores?busca=${encodeURIComponent(busca)}`);
      _renderTabela();
    } catch (err) {
      Toast.show('Erro ao carregar fornecedores.', 'error');
    }
  }

  function buscar() {
    clearTimeout(_buscaTimer);
    _buscaTimer = setTimeout(listar, 350);
  }

  function abrirModal(dados = {}) {
    _editandoId = null;
    Modal.abrir('Novo Fornecedor', _form(dados));
  }

  async function editar(id) {
    try {
      const dados = await api.get(`fornecedores/${id}`);
      _editandoId = id;
      Modal.abrir('Editar Fornecedor', _form(dados));
    } catch (err) {
      Toast.show('Erro ao carregar fornecedor.', 'error');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      nome:              form.nome.value.trim(),
      telefone:          form.telefone.value.trim()          || null,
      email:             form.email.value.trim()             || null,
      categoria_servico: form.categoria_servico.value.trim() || null,
      observacoes:       form.observacoes.value.trim()       || null,
    };

    try {
      if (_editandoId) {
        await api.put(`fornecedores/${_editandoId}`, payload);
        Toast.show('Fornecedor atualizado!', 'success');
      } else {
        await api.post('fornecedores', payload);
        Toast.show('Fornecedor cadastrado!', 'success');
      }
      Modal.fechar();
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar fornecedor.', 'error');
    }
  }

  function confirmarExclusao(id, nome) {
    Modal.abrirConfirm(
      `Deseja excluir o fornecedor "${nome}"?`,
      () => excluir(id)
    );
  }

  async function excluir(id) {
    try {
      await api.delete(`fornecedores/${id}`);
      Toast.show('Fornecedor excluído!', 'success');
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir fornecedor.', 'error');
    }
  }

  return { listar, buscar, abrirModal, editar, salvar, confirmarExclusao, excluir };
})();
