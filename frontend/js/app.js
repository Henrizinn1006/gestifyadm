/**
 * app.js — Roteador SPA e inicialização do Gestify.
 * Deve ser carregado ÚLTIMO no index.html.
 */

const App = (() => {

  // Mapa de seções: chave = data-section, valor = { titulo, onEnter }
  const SECOES = {
    dashboard:    { titulo: 'Dashboard',    onEnter: () => Dashboard.carregar() },
    clientes:     { titulo: 'Clientes',     onEnter: () => Clientes.listar() },
    eventos:      { titulo: 'Eventos',      onEnter: () => Eventos.listar() },
    financeiro:   { titulo: 'Financeiro',   onEnter: () => Financeiro.listar() },
    categorias:   { titulo: 'Categorias',   onEnter: () => Categorias.listar() },
    fornecedores: { titulo: 'Fornecedores', onEnter: () => Fornecedores.listar() },
    relatorios:   { titulo: 'Relatórios',   onEnter: () => Relatorios.inicializar() },
    lion:         { titulo: 'Lion AI',   onEnter: () => Lion.init() },
  };

  let _secaoAtual = 'dashboard';

  function navegarPara(secao) {
    if (!SECOES[secao]) return;

    // Esconder seção atual
    document.getElementById(`section-${_secaoAtual}`)?.classList.remove('active');
    document.querySelector(`.nav-item[data-section="${_secaoAtual}"]`)?.classList.remove('active');

    // Mostrar nova seção
    _secaoAtual = secao;
    document.getElementById(`section-${secao}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-section="${secao}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = SECOES[secao].titulo;

    // Fechar sidebar em mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar')?.classList.remove('open');
    }

    // Callback de entrada (carrega dados da seção)
    try {
      SECOES[secao].onEnter();
    } catch (err) {
      console.error('Erro ao entrar na seção:', err);
    }
  }

  // Atalho para ir direto ao relatório de um evento
  function irParaRelatorio(eventoId) {
    navegarPara('relatorios');
    // Aguarda o DOM atualizar, então seleciona o evento e carrega
    setTimeout(() => {
      const sel = document.getElementById('rel-evento-select');
      if (sel) {
        sel.value = eventoId;
        Relatorios.carregar();
      }
    }, 300);
  }

  function _bindNavegacao() {
    document.querySelectorAll('.nav-item[data-section]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navegarPara(link.dataset.section);
      });
    });
  }

  function _bindMenuMobile() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Fechar ao clicar fora da sidebar (mobile)
    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const toggle  = document.getElementById('menuToggle');
      if (
        window.innerWidth <= 768 &&
        sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== toggle
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  function _bindKeyboard() {
    document.addEventListener('keydown', e => {
      // ESC fecha modal
      if (e.key === 'Escape') {
        Modal.fechar();
        Modal.fecharConfirm();
      }
    });
  }

  // ── Tema claro / escuro ──────────────────────────────────────────────────
  function _aplicarTema(tema) {
    if (tema === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('gestify-tema', tema);
  }

  function _bindTema() {
    // Restaura tema salvo (padrão: escuro)
    const temaSalvo = localStorage.getItem('gestify-tema') || 'dark';
    _aplicarTema(temaSalvo);

    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const temaAtual = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      _aplicarTema(temaAtual === 'light' ? 'dark' : 'light');
    });
  }

  async function _primeiraExecucao() {
    // Na primeira execução, popula categorias padrão se não existir nenhuma
    try {
      await Categorias.popularPadrao();
    } catch (_) {}
  }

  async function init() {
    _bindTema();
    _bindNavegacao();
    _bindMenuMobile();
    _bindKeyboard();

    // Popula categorias padrão na primeira vez
    await _primeiraExecucao();

    // Inicia na seção dashboard
    navegarPara('dashboard');

    console.log('%cGestify v1.0 carregado!', 'color:#38bdf8;font-weight:bold;font-size:14px');
  }

  return { init, navegarPara, irParaRelatorio };
})();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(err => {
    console.error('Erro na inicialização do Gestify:', err);
    Toast.show('Erro ao inicializar. Verifique se o backend está rodando.', 'error');
  });
});
