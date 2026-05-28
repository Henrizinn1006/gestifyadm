import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api_client.dart';
import '../models/models.dart';

final _brl = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
final _dateFmt = DateFormat('dd/MM/yyyy');

class FinanceiroScreen extends StatefulWidget {
  const FinanceiroScreen({super.key});
  @override State<FinanceiroScreen> createState() => _FinanceiroScreenState();
}

class _FinanceiroScreenState extends State<FinanceiroScreen> {
  List<Movimentacao> _lista = [];
  bool _loading = true;
  String? _erro;
  String? _filtroTipo;

  @override
  void initState() { super.initState(); _carregar(); }

  Future<void> _carregar() async {
    setState(() { _loading = true; _erro = null; });
    try {
      final lista = await ApiClient.getMovimentacoes(tipo: _filtroTipo);
      setState(() { _lista = lista; _loading = false; });
    } catch (e) {
      setState(() { _erro = e.toString(); _loading = false; });
    }
  }

  double get _totalReceitas => _lista
      .where((m) => m.tipo == 'receita').fold(0, (s, m) => s + m.valor);
  double get _totalDespesas => _lista
      .where((m) => m.tipo == 'despesa').fold(0, (s, m) => s + m.valor);

  void _abrirForm() {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _MovForm(onSave: (dados) async {
        await ApiClient.criarMovimentacao(dados);
        _carregar();
      }),
    );
  }

  Future<void> _excluir(Movimentacao m) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      title: const Text('Excluir movimentação'),
      content: Text('Excluir "${m.descricao}"?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        TextButton(onPressed: () => Navigator.pop(context, true),
            child: const Text('Excluir', style: TextStyle(color: Color(0xFFEF4444)))),
      ],
    ));
    if (ok == true) { await ApiClient.excluirMovimentacao(m.id); _carregar(); }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      // Resumo
      Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Expanded(child: _ResumoCard('Receitas', _totalReceitas, const Color(0xFF22C55E))),
          const SizedBox(width: 10),
          Expanded(child: _ResumoCard('Despesas', _totalDespesas, const Color(0xFFEF4444))),
          const SizedBox(width: 10),
          Expanded(child: _ResumoCard('Saldo', _totalReceitas - _totalDespesas,
              _totalReceitas >= _totalDespesas ? const Color(0xFF22C55E) : const Color(0xFFEF4444))),
        ]),
      ),
      // Filtros + botão
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(children: [
          Expanded(child: Row(children: [
            _FiltroBtn('Todos', null, _filtroTipo),
            const SizedBox(width: 8),
            _FiltroBtn('Receitas', 'receita', _filtroTipo),
            const SizedBox(width: 8),
            _FiltroBtn('Despesas', 'despesa', _filtroTipo),
          ])),
          FilledButton.icon(
            onPressed: _abrirForm,
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Nova'),
            style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF38BDF8),
                foregroundColor: Colors.black),
          ),
        ]),
      ),
      const SizedBox(height: 8),
      // Lista
      Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _erro != null
              ? Center(child: Text(_erro!, style: const TextStyle(color: Color(0xFF94A3B8))))
              : _lista.isEmpty
                  ? const Center(child: Text('Nenhuma movimentação',
                      style: TextStyle(color: Color(0xFF64748B))))
                  : RefreshIndicator(
                      onRefresh: _carregar,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _lista.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final m = _lista[i];
                          final isReceita = m.tipo == 'receita';
                          final cor = isReceita
                              ? const Color(0xFF22C55E)
                              : const Color(0xFFEF4444);
                          return Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: cor.withOpacity(0.15),
                                child: Icon(
                                  isReceita
                                      ? Icons.arrow_upward_rounded
                                      : Icons.arrow_downward_rounded,
                                  color: cor, size: 18),
                              ),
                              title: Text(m.descricao,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600, fontSize: 13)),
                              subtitle: Text(m.data ?? '',
                                  style: const TextStyle(
                                      fontSize: 11, color: Color(0xFF94A3B8))),
                              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                Text(
                                  '${isReceita ? '+' : '-'} ${_brl.format(m.valor)}',
                                  style: TextStyle(
                                      color: cor,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13)),
                                IconButton(
                                  icon: const Icon(Icons.delete_rounded,
                                      size: 18, color: Color(0xFFEF4444)),
                                  onPressed: () => _excluir(m)),
                              ]),
                            ),
                          );
                        },
                      ),
                    )),
    ]);
  }

  Widget _FiltroBtn(String label, String? val, String? atual) {
    final ativo = atual == val;
    return GestureDetector(
      onTap: () { setState(() => _filtroTipo = val); _carregar(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: ativo
              ? const Color(0xFF38BDF8).withOpacity(0.15)
              : const Color(0xFF273549),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: ativo ? const Color(0xFF38BDF8) : Colors.transparent),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12,
                color: ativo
                    ? const Color(0xFF38BDF8)
                    : const Color(0xFF94A3B8))),
      ),
    );
  }
}

// ── Resumo card ────────────────────────────────────────────────────────────────
class _ResumoCard extends StatelessWidget {
  final String label;
  final double valor;
  final Color cor;
  const _ResumoCard(this.label, this.valor, this.cor);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(10),
      border: Border(bottom: BorderSide(color: cor, width: 2)),
    ),
    child: Column(children: [
      Text(label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
      const SizedBox(height: 4),
      FittedBox(child: Text(_brl.format(valor),
          style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w700, color: cor))),
    ]),
  );
}

// ── Formulário nova movimentação ───────────────────────────────────────────────
class _MovForm extends StatefulWidget {
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _MovForm({required this.onSave});
  @override State<_MovForm> createState() => _MovFormState();
}

class _MovFormState extends State<_MovForm> {
  final _form  = GlobalKey<FormState>();
  final _desc  = TextEditingController();
  final _valor = TextEditingController();
  String _tipo   = 'receita';
  String _status = 'pago';
  DateTime _data = DateTime.now();
  bool _saving   = false;

  Future<void> _escolherData() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _data,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) setState(() => _data = picked);
  }

  Future<void> _salvar() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      // Formato ISO YYYY-MM-DD que o backend espera
      final dataIso = DateFormat('yyyy-MM-dd').format(_data);
      await widget.onSave({
        'tipo':      _tipo,
        'descricao': _desc.text.trim(),
        'valor':     double.parse(_valor.text.replaceAll(',', '.')),
        'data':      dataIso,
        'status':    _status,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString()),
              backgroundColor: const Color(0xFFEF4444)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: Form(
        key: _form,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Nova Movimentação',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          // Tipo receita / despesa
          Row(children: [
            Expanded(child: _TipoBtn('Receita', 'receita', _tipo,
                (v) => setState(() => _tipo = v))),
            const SizedBox(width: 10),
            Expanded(child: _TipoBtn('Despesa', 'despesa', _tipo,
                (v) => setState(() => _tipo = v))),
          ]),
          const SizedBox(height: 10),
          // Descrição
          TextFormField(
            controller: _desc,
            decoration: const InputDecoration(labelText: 'Descrição *'),
            validator: (v) => v!.isEmpty ? 'Obrigatório' : null,
          ),
          const SizedBox(height: 10),
          // Valor
          TextFormField(
            controller: _valor,
            decoration: const InputDecoration(
                labelText: 'Valor *', prefixText: 'R\$ '),
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            validator: (v) {
              if (v!.isEmpty) return 'Obrigatório';
              if (double.tryParse(v.replaceAll(',', '.')) == null) {
                return 'Valor inválido';
              }
              return null;
            },
          ),
          const SizedBox(height: 10),
          // Data
          InkWell(
            onTap: _escolherData,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF475569)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                const Icon(Icons.calendar_today_rounded,
                    size: 16, color: Color(0xFF94A3B8)),
                const SizedBox(width: 10),
                Text('Data: ${_dateFmt.format(_data)}',
                    style: const TextStyle(
                        fontSize: 14, color: Color(0xFFCBD5E1))),
                const Spacer(),
                const Icon(Icons.edit_rounded,
                    size: 14, color: Color(0xFF94A3B8)),
              ]),
            ),
          ),
          const SizedBox(height: 10),
          // Status
          DropdownButtonFormField<String>(
            value: _status,
            dropdownColor: const Color(0xFF273549),
            decoration: const InputDecoration(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: 'pago',     child: Text('Pago')),
              DropdownMenuItem(value: 'pendente', child: Text('Pendente')),
            ],
            onChanged: (v) => setState(() => _status = v!),
          ),
          const SizedBox(height: 16),
          // Salvar
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _salvar,
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF38BDF8),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _saving
                  ? const SizedBox(height: 18, width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2,
                          color: Colors.black))
                  : const Text('Salvar',
                      style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _TipoBtn(String label, String val, String atual,
      void Function(String) onTap) {
    final ativo = atual == val;
    final cor =
        val == 'receita' ? const Color(0xFF22C55E) : const Color(0xFFEF4444);
    return GestureDetector(
      onTap: () => onTap(val),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: ativo ? cor.withOpacity(0.15) : const Color(0xFF273549),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: ativo ? cor : Colors.transparent),
        ),
        child: Center(
            child: Text(label,
                style: TextStyle(
                    color: ativo ? cor : const Color(0xFF94A3B8),
                    fontWeight: FontWeight.w600))),
      ),
    );
  }
}
