import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/models.dart';

class LionScreen extends StatefulWidget {
  const LionScreen({super.key});
  @override State<LionScreen> createState() => _LionScreenState();
}

class _LionScreenState extends State<LionScreen> {
  List<LionSessao> _sessoes = [];
  LionSessao? _sessaoAtual;
  List<LionMensagem> _mensagens = [];
  bool _loadingSessoes = true;
  bool _enviando = false;
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() { super.initState(); _carregarSessoes(); }

  Future<void> _carregarSessoes() async {
    setState(() => _loadingSessoes = true);
    try {
      final lista = await ApiClient.getLionSessoes();
      setState(() { _sessoes = lista; _loadingSessoes = false; });
      if (lista.isNotEmpty && _sessaoAtual == null) {
        await _selecionarSessao(lista.first);
      }
    } catch (e) {
      setState(() => _loadingSessoes = false);
    }
  }

  Future<void> _selecionarSessao(LionSessao s) async {
    setState(() { _sessaoAtual = s; _mensagens = []; });
    try {
      final hist = await ApiClient.getLionHistorico(s.id);
      setState(() => _mensagens = hist
          .where((m) => !m.content.startsWith('[ferramentas:'))
          .toList());
      _scrollBottom();
    } catch (_) {}
  }

  Future<void> _novaSessao() async {
    try {
      final s = await ApiClient.criarLionSessao();
      await _carregarSessoes();
      await _selecionarSessao(s);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _excluirSessao(LionSessao s) async {
    await ApiClient.excluirLionSessao(s.id);
    if (_sessaoAtual?.id == s.id) setState(() { _sessaoAtual = null; _mensagens = []; });
    _carregarSessoes();
  }

  Future<void> _enviar() async {
    final texto = _input.text.trim();
    if (texto.isEmpty || _enviando) return;
    if (_sessaoAtual == null) await _novaSessao();
    if (_sessaoAtual == null) return;

    _input.clear();
    setState(() {
      _mensagens.add(LionMensagem(role: 'user', content: texto));
      _enviando = true;
    });
    _scrollBottom();

    try {
      final resp = await ApiClient.lionChat(_sessaoAtual!.id, texto);
      setState(() {
        _mensagens.add(LionMensagem(role: 'assistant', content: resp));
        _enviando = false;
      });
      _scrollBottom();
      _carregarSessoes(); // atualiza título
    } catch (e) {
      setState(() {
        _mensagens.add(LionMensagem(role: 'assistant', content: 'Erro: $e'));
        _enviando = false;
      });
    }
  }

  void _scrollBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      // Sidebar de sessões (visível apenas em telas largas)
      if (MediaQuery.of(context).size.width > 600)
        SizedBox(width: 200, child: _SessoesSidebar(
          sessoes: _sessoes, loading: _loadingSessoes,
          selecionada: _sessaoAtual,
          onSelecionar: _selecionarSessao,
          onNova: _novaSessao,
          onExcluir: _excluirSessao,
        )),
      // Área de chat
      Expanded(child: Column(children: [
        // Header com seletor de sessão em mobile
        if (MediaQuery.of(context).size.width <= 600)
          Container(
            color: const Color(0xFF1E293B),
            child: Row(children: [
              Expanded(child: DropdownButton<LionSessao>(
                value: _sessaoAtual,
                hint: const Padding(padding: EdgeInsets.only(left: 12),
                    child: Text('Selecionar conversa')),
                isExpanded: true,
                underline: const SizedBox(),
                dropdownColor: const Color(0xFF1E293B),
                items: _sessoes.map((s) => DropdownMenuItem(
                    value: s, child: Padding(
                        padding: const EdgeInsets.only(left: 12),
                        child: Text(s.titulo, overflow: TextOverflow.ellipsis)))).toList(),
                onChanged: (s) { if (s != null) _selecionarSessao(s); },
              )),
              IconButton(icon: const Icon(Icons.add_rounded), onPressed: _novaSessao),
            ]),
          ),
        // Mensagens
        Expanded(child: _sessaoAtual == null
            ? _BemVindo(onNova: _novaSessao)
            : ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.all(12),
                itemCount: _mensagens.length + (_enviando ? 1 : 0),
                itemBuilder: (_, i) {
                  if (i == _mensagens.length) return const _TypingIndicator();
                  return _BubbleMensagem(_mensagens[i]);
                },
              )),
        // Input
        Container(
          padding: EdgeInsets.only(
              left: 12, right: 12, top: 8,
              bottom: 8 + MediaQuery.of(context).viewInsets.bottom),
          color: const Color(0xFF1E293B),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _input,
              minLines: 1, maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Pergunte ao Lion AI...',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
              onSubmitted: (_) => _enviar(),
              textInputAction: TextInputAction.send,
            )),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _enviando ? null : _enviar,
              icon: _enviando
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Icon(Icons.send_rounded),
              style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFF38BDF8),
                  foregroundColor: Colors.black),
            ),
          ]),
        ),
      ])),
    ]);
  }
}

class _SessoesSidebar extends StatelessWidget {
  final List<LionSessao> sessoes;
  final bool loading;
  final LionSessao? selecionada;
  final void Function(LionSessao) onSelecionar;
  final VoidCallback onNova;
  final void Function(LionSessao) onExcluir;
  const _SessoesSidebar({required this.sessoes, required this.loading,
      required this.selecionada, required this.onSelecionar,
      required this.onNova, required this.onExcluir});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        border: Border(right: BorderSide(color: Color(0xFF334155))),
      ),
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.all(10),
          child: SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: onNova,
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Nova conversa', style: TextStyle(fontSize: 12)),
          )),
        ),
        Expanded(child: loading
            ? const Center(child: CircularProgressIndicator())
            : ListView.builder(
                itemCount: sessoes.length,
                itemBuilder: (_, i) {
                  final s = sessoes[i];
                  final ativa = selecionada?.id == s.id;
                  return Container(
                    color: ativa ? const Color(0xFF38BDF8).withOpacity(0.1) : null,
                    child: ListTile(
                      dense: true,
                      title: Text(s.titulo, style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w500,
                          color: ativa ? const Color(0xFF38BDF8) : null),
                          overflow: TextOverflow.ellipsis),
                      onTap: () => onSelecionar(s),
                      trailing: IconButton(
                        icon: const Icon(Icons.close_rounded, size: 14),
                        onPressed: () => onExcluir(s),
                        padding: EdgeInsets.zero, constraints: const BoxConstraints(),
                      ),
                    ),
                  );
                },
              )),
      ]),
    );
  }
}

class _BubbleMensagem extends StatelessWidget {
  final LionMensagem msg;
  const _BubbleMensagem(this.msg);

  @override
  Widget build(BuildContext context) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(radius: 14, backgroundColor: const Color(0xFF273549),
                child: const Icon(Icons.smart_toy_rounded, size: 16, color: Color(0xFF38BDF8))),
            const SizedBox(width: 8),
          ],
          Flexible(child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isUser ? const Color(0xFF38BDF8) : const Color(0xFF1E293B),
              borderRadius: BorderRadius.only(
                topLeft:     const Radius.circular(14),
                topRight:    const Radius.circular(14),
                bottomLeft:  Radius.circular(isUser ? 14 : 4),
                bottomRight: Radius.circular(isUser ? 4 : 14),
              ),
              border: isUser ? null : Border.all(color: const Color(0xFF334155)),
            ),
            child: Text(msg.content, style: TextStyle(
                fontSize: 13, color: isUser ? Colors.black : null, height: 1.5)),
          )),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(radius: 14, backgroundColor: const Color(0xFF38BDF8).withOpacity(0.2),
                child: const Icon(Icons.person_rounded, size: 16, color: Color(0xFF38BDF8))),
          ],
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.only(bottom: 10),
    child: Row(children: [
      CircleAvatar(radius: 14, backgroundColor: Color(0xFF273549),
          child: const Icon(Icons.smart_toy_rounded, size: 16, color: Color(0xFF38BDF8))),
      SizedBox(width: 8),
      _Dots(),
    ]),
  );
}

class _Dots extends StatefulWidget {
  const _Dots();
  @override State<_Dots> createState() => _DotsState();
}

class _DotsState extends State<_Dots> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
  }
  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, __) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF334155))),
      child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        width: 6, height: 6,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Color.lerp(const Color(0xFF334155), const Color(0xFF38BDF8),
              ((_ctrl.value + i * 0.3) % 1.0)),
        ),
      ))),
    ),
  );
}

class _BemVindo extends StatelessWidget {
  final VoidCallback onNova;
  const _BemVindo({required this.onNova});
  @override
  Widget build(BuildContext context) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      const Icon(Icons.smart_toy_rounded, size: 52, color: Color(0xFF38BDF8)),
      const SizedBox(height: 12),
      const Text('Lion AI', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
      const SizedBox(height: 6),
      const Text('Seu assistente de gestão de eventos',
          style: TextStyle(color: Color(0xFF94A3B8))),
      const SizedBox(height: 24),
      ElevatedButton.icon(
        onPressed: onNova,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Iniciar conversa'),
      ),
    ],
  ));
}
