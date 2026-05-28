import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/models.dart';

class EventosScreen extends StatefulWidget {
  const EventosScreen({super.key});
  @override State<EventosScreen> createState() => _EventosScreenState();
}

class _EventosScreenState extends State<EventosScreen> {
  List<Evento> _eventos = [];
  bool _loading = true;
  String? _erro;
  String? _filtroStatus;

  final _statusOpcoes = [null, 'planejado', 'em_andamento', 'concluido', 'cancelado'];
  final _statusLabels = ['Todos', 'Planejado', 'Em andamento', 'Concluído', 'Cancelado'];

  @override
  void initState() { super.initState(); _carregar(); }

  Future<void> _carregar() async {
    setState(() { _loading = true; _erro = null; });
    try {
      final lista = await ApiClient.getEventos(status: _filtroStatus);
      setState(() { _eventos = lista; _loading = false; });
    } catch (e) {
      setState(() { _erro = e.toString(); _loading = false; });
    }
  }

  void _abrirForm([Evento? ev]) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _EventoForm(evento: ev, onSave: (dados) async {
        if (ev == null) await ApiClient.criarEvento(dados);
        else await ApiClient.atualizarEvento(ev.id, dados);
        _carregar();
      }),
    );
  }

  Future<void> _excluir(Evento ev) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: const Text('Excluir evento'),
      content: Text('Excluir "${ev.nome}"?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        TextButton(onPressed: () => Navigator.pop(context, true),
            child: const Text('Excluir', style: TextStyle(color: Color(0xFFEF4444)))),
      ],
    ));
    if (ok == true) { await ApiClient.excluirEvento(ev.id); _carregar(); }
  }

  Color _cor(String s) {
    switch (s) {
      case 'concluido': return const Color(0xFF22C55E);
      case 'em_andamento': return const Color(0xFF38BDF8);
      case 'cancelado': return const Color(0xFFEF4444);
      default: return const Color(0xFFFACC15);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      // Filtro de status
      SizedBox(height: 52,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: _statusOpcoes.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) {
            final ativo = _filtroStatus == _statusOpcoes[i];
            return FilterChip(
              label: Text(_statusLabels[i]),
              selected: ativo,
              onSelected: (_) {
                setState(() => _filtroStatus = _statusOpcoes[i]);
                _carregar();
              },
              selectedColor: const Color(0xFF38BDF8).withOpacity(0.2),
              checkmarkColor: const Color(0xFF38BDF8),
            );
          },
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Row(children: [
          const Spacer(),
          FilledButton.icon(
            onPressed: () => _abrirForm(),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Novo'),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF38BDF8),
                foregroundColor: Colors.black),
          ),
        ]),
      ),
      Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _erro != null
              ? Center(child: Text(_erro!, style: const TextStyle(color: Color(0xFF94A3B8))))
              : _eventos.isEmpty
                  ? const Center(child: Text('Nenhum evento encontrado',
                      style: TextStyle(color: Color(0xFF64748B))))
                  : RefreshIndicator(
                      onRefresh: _carregar,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _eventos.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final ev = _eventos[i];
                          final cor = _cor(ev.status);
                          return Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(10),
                              border: Border(left: BorderSide(color: cor, width: 3)),
                            ),
                            child: ListTile(
                              title: Text(ev.nome, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                if (ev.dataEvento != null)
                                  Text(ev.dataEvento!, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                                if (ev.clienteNome != null)
                                  Text(ev.clienteNome!, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                              ]),
                              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: cor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(ev.status, style: TextStyle(fontSize: 10, color: cor)),
                                ),
                                IconButton(icon: const Icon(Icons.edit_rounded, size: 18),
                                    onPressed: () => _abrirForm(ev)),
                                IconButton(icon: const Icon(Icons.delete_rounded, size: 18,
                                    color: Color(0xFFEF4444)), onPressed: () => _excluir(ev)),
                              ]),
                            ),
                          );
                        },
                      ),
                    )),
    ]);
  }
}

class _EventoForm extends StatefulWidget {
  final Evento? evento;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _EventoForm({this.evento, required this.onSave});
  @override State<_EventoForm> createState() => _EventoFormState();
}

class _EventoFormState extends State<_EventoForm> {
  final _form = GlobalKey<FormState>();
  final _nome  = TextEditingController();
  final _local = TextEditingController();
  String _status = 'planejado';
  DateTime? _data;
  bool _saving = false;

  final _statusOpts = ['planejado', 'em_andamento', 'concluido', 'cancelado'];

  @override
  void initState() {
    super.initState();
    if (widget.evento != null) {
      final ev = widget.evento!;
      _nome.text  = ev.nome;
      _local.text = ev.local ?? '';
      _status     = ev.status;
      if (ev.dataEvento != null) {
        try { _data = DateTime.parse(ev.dataEvento!); } catch (_) {}
      }
    }
  }

  Future<void> _salvar() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final dados = <String, dynamic>{
        'nome': _nome.text, 'status': _status,
        if (_local.text.isNotEmpty) 'local': _local.text,
        if (_data != null) 'data_evento': _data!.toIso8601String().substring(0, 10),
      };
      await widget.onSave(dados);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)));
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: Form(key: _form, child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(widget.evento == null ? 'Novo Evento' : 'Editar Evento',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        TextFormField(controller: _nome, decoration: const InputDecoration(labelText: 'Nome *'),
            validator: (v) => v!.isEmpty ? 'Obrigatório' : null),
        const SizedBox(height: 10),
        TextFormField(controller: _local, decoration: const InputDecoration(labelText: 'Local')),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          value: _status,
          dropdownColor: const Color(0xFF273549),
          decoration: const InputDecoration(labelText: 'Status'),
          items: _statusOpts.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
          onChanged: (v) => setState(() => _status = v!),
        ),
        const SizedBox(height: 10),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(_data == null ? 'Data do evento' : _data!.toIso8601String().substring(0,10),
              style: TextStyle(color: _data == null ? const Color(0xFF64748B) : null)),
          trailing: const Icon(Icons.calendar_today_rounded, size: 18),
          onTap: () async {
            final d = await showDatePicker(context: context,
                initialDate: _data ?? DateTime.now(),
                firstDate: DateTime(2020), lastDate: DateTime(2030));
            if (d != null) setState(() => _data = d);
          },
        ),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _saving ? null : _salvar,
          child: _saving ? const SizedBox(height: 18, width: 18,
              child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Salvar'),
        )),
      ])),
    );
  }
}
