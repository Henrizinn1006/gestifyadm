import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api_client.dart';
import '../models/models.dart';

final _brl = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardResumo? _resumo;
  bool _loading = true;
  String? _erro;

  @override
  void initState() { super.initState(); _carregar(); }

  Future<void> _carregar() async {
    setState(() { _loading = true; _erro = null; });
    try {
      final r = await ApiClient.getDashboard();
      setState(() { _resumo = r; _loading = false; });
    } catch (e) {
      setState(() { _erro = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_erro != null) return _ErroView(erro: _erro!, onRetry: _carregar);
    final r = _resumo!;

    return RefreshIndicator(
      onRefresh: _carregar,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // KPIs principais
          _grid([
            _KpiCard('Total Receitas', r.totalReceitas, const Color(0xFF22C55E), Icons.trending_up_rounded),
            _KpiCard('Total Despesas', r.totalDespesas, const Color(0xFFEF4444), Icons.trending_down_rounded),
            _KpiCard('Lucro Total',    r.lucroTotal,    const Color(0xFF38BDF8), Icons.account_balance_rounded),
            _KpiCard('Pendentes',      r.totalPendente, const Color(0xFFFACC15), Icons.schedule_rounded),
          ]),
          const SizedBox(height: 12),
          // KPIs do mês
          _secao('Este Mês'),
          _grid([
            _KpiCard('Receitas', r.receitasMes,  const Color(0xFF22C55E), Icons.arrow_upward_rounded),
            _KpiCard('Despesas', r.despesasMes,  const Color(0xFFEF4444), Icons.arrow_downward_rounded),
            _KpiCard('Lucro',    r.lucroMes,     const Color(0xFF38BDF8), Icons.show_chart_rounded),
          ]),
          const SizedBox(height: 12),
          // Contadores
          _secao('Cadastros'),
          _grid([
            _CountCard('Eventos',      r.qtdEventos,      Icons.celebration_rounded,    const Color(0xFF38BDF8)),
            _CountCard('Clientes',     r.qtdClientes,     Icons.people_rounded,          const Color(0xFF22C55E)),
            _CountCard('Fornecedores', r.qtdFornecedores, Icons.handshake_rounded,       const Color(0xFFFACC15)),
          ]),
          const SizedBox(height: 12),
          // Próximos eventos
          if (r.proximosEventos.isNotEmpty) ...[
            _secao('Próximos Eventos'),
            ...r.proximosEventos.map((e) => _ProximoEventoTile(e)),
          ],
        ],
      ),
    );
  }

  Widget _secao(String titulo) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(titulo, style: const TextStyle(
        fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8),
        letterSpacing: 0.5)),
  );

  Widget _grid(List<Widget> children) => GridView.count(
    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
    mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1.6,
    children: children,
  );
}

class _KpiCard extends StatelessWidget {
  final String label;
  final double valor;
  final Color cor;
  final IconData icone;
  const _KpiCard(this.label, this.valor, this.cor, this.icone);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: cor, width: 3)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icone, size: 16, color: cor),
          const SizedBox(width: 6),
          Expanded(child: Text(label, style: const TextStyle(
              fontSize: 11, color: Color(0xFF94A3B8)), overflow: TextOverflow.ellipsis)),
        ]),
        const Spacer(),
        Text(_brl.format(valor), style: TextStyle(
            fontSize: 15, fontWeight: FontWeight.w700, color: cor)),
      ]),
    );
  }
}

class _CountCard extends StatelessWidget {
  final String label;
  final int valor;
  final IconData icone;
  final Color cor;
  const _CountCard(this.label, this.valor, this.icone, this.cor);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icone, size: 20, color: cor),
        const Spacer(),
        Text('$valor', style: const TextStyle(
            fontSize: 22, fontWeight: FontWeight.w700)),
        Text(label, style: const TextStyle(
            fontSize: 11, color: Color(0xFF94A3B8))),
      ]),
    );
  }
}

class _ProximoEventoTile extends StatelessWidget {
  final ProximoEvento evento;
  const _ProximoEventoTile(this.evento);

  @override
  Widget build(BuildContext context) {
    final cor = _statusCor(evento.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [
        Container(width: 3, height: 36, decoration: BoxDecoration(
            color: cor, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(evento.nome, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          if (evento.dataEvento != null)
            Text(evento.dataEvento!, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: cor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(evento.status, style: TextStyle(fontSize: 10, color: cor, fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }

  Color _statusCor(String s) {
    switch (s) {
      case 'concluido': return const Color(0xFF22C55E);
      case 'em_andamento': return const Color(0xFF38BDF8);
      case 'cancelado': return const Color(0xFFEF4444);
      default: return const Color(0xFFFACC15);
    }
  }
}

class _ErroView extends StatelessWidget {
  final String erro;
  final VoidCallback onRetry;
  const _ErroView({required this.erro, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFF64748B)),
      const SizedBox(height: 12),
      Text(erro, style: const TextStyle(color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton.icon(onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded), label: const Text('Tentar novamente')),
    ],
  ));
}
