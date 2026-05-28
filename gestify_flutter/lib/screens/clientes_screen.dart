import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/models.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({super.key});
  @override State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  List<Cliente> _clientes = [];
  bool _loading = true;
  String? _erro;
  final _busca = TextEditingController();

  @override
  void initState() { super.initState(); _carregar(); }

  Future<void> _carregar() async {
    setState(() { _loading = true; _erro = null; });
    try {
      final lista = await ApiClient.getClientes(busca: _busca.text);
      setState(() { _clientes = lista; _loading = false; });
    } catch (e) {
      setState(() { _erro = e.toString(); _loading = false; });
    }
  }

  void _abrirForm([Cliente? cliente]) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _ClienteForm(cliente: cliente, onSave: (dados) async {
        if (cliente == null) {
          await ApiClient.criarCliente(dados);
        } else {
          await ApiClient.atualizarCliente(cliente.id, dados);
        }
        _carregar();
      }),
    );
  }

  Future<void> _excluir(Cliente c) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: const Text('Excluir cliente'),
      content: Text('Excluir "${c.nome}"?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        TextButton(onPressed: () => Navigator.pop(context, true),
            child: const Text('Excluir', style: TextStyle(color: Color(0xFFEF4444)))),
      ],
    ));
    if (ok == true) { await ApiClient.excluirCliente(c.id); _carregar(); }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Expanded(child: TextField(
            controller: _busca,
            decoration: const InputDecoration(
              hintText: 'Buscar cliente...', prefixIcon: Icon(Icons.search_rounded),
              isDense: true, contentPadding: EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: (_) => _carregar(),
          )),
          const SizedBox(width: 10),
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
              : _clientes.isEmpty
                  ? const Center(child: Text('Nenhum cliente cadastrado',
                      style: TextStyle(color: Color(0xFF64748B))))
                  : RefreshIndicator(
                      onRefresh: _carregar,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _clientes.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final c = _clientes[i];
                          return Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: const Color(0xFF38BDF8).withOpacity(0.15),
                                child: Text(c.nome[0].toUpperCase(),
                                    style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w700)),
                              ),
                              title: Text(c.nome, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: c.telefone != null ? Text(c.telefone!,
                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)) : null,
                              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                IconButton(icon: const Icon(Icons.edit_rounded, size: 18),
                                    onPressed: () => _abrirForm(c)),
                                IconButton(icon: const Icon(Icons.delete_rounded, size: 18,
                                    color: Color(0xFFEF4444)), onPressed: () => _excluir(c)),
                              ]),
                            ),
                          );
                        },
                      ),
                    )),
    ]);
  }
}

class _ClienteForm extends StatefulWidget {
  final Cliente? cliente;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _ClienteForm({this.cliente, required this.onSave});
  @override State<_ClienteForm> createState() => _ClienteFormState();
}

class _ClienteFormState extends State<_ClienteForm> {
  final _form = GlobalKey<FormState>();
  final _nome = TextEditingController();
  final _tel  = TextEditingController();
  final _email = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.cliente != null) {
      _nome.text  = widget.cliente!.nome;
      _tel.text   = widget.cliente!.telefone ?? '';
      _email.text = widget.cliente!.email ?? '';
    }
  }

  Future<void> _salvar() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave({
        'nome': _nome.text,
        'telefone': _tel.text.isEmpty ? null : _tel.text,
        'email': _email.text.isEmpty ? null : _email.text,
      });
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
        Text(widget.cliente == null ? 'Novo Cliente' : 'Editar Cliente',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        TextFormField(controller: _nome, decoration: const InputDecoration(labelText: 'Nome *'),
            validator: (v) => v!.isEmpty ? 'Obrigatório' : null),
        const SizedBox(height: 10),
        TextFormField(controller: _tel, decoration: const InputDecoration(labelText: 'Telefone'),
            keyboardType: TextInputType.phone),
        const SizedBox(height: 10),
        TextFormField(controller: _email, decoration: const InputDecoration(labelText: 'E-mail'),
            keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _saving ? null : _salvar,
          child: _saving ? const SizedBox(height: 18, width: 18,
              child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Salvar'),
        )),
      ])),
    );
  }
}
