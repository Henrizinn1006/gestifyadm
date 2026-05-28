import 'package:flutter/material.dart';
import '../config.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _url;
  bool _salvo = false;

  @override
  void initState() {
    super.initState();
    _url = TextEditingController(text: Config.baseUrl);
  }

  Future<void> _salvar() async {
    if (_url.text.trim().isEmpty) return;
    await Config.save(_url.text.trim());
    setState(() => _salvo = true);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('URL salva! Reinicie o app para aplicar.'),
            backgroundColor: Color(0xFF22C55E)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configurações')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Servidor Backend', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
          const SizedBox(height: 10),
          TextField(
            controller: _url,
            decoration: const InputDecoration(
              labelText: 'URL do servidor Flask',
              hintText: 'http://192.168.x.x:8000',
              prefixIcon: Icon(Icons.dns_rounded),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '• Emulador Android: http://10.0.2.2:8000\n'
            '• Rede local (celular físico): http://SEU_IP:8000\n'
            '  (veja o IP do PC com ipconfig)',
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.8),
          ),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _salvar,
            icon: const Icon(Icons.save_rounded),
            label: const Text('Salvar'),
          )),
          const SizedBox(height: 30),
          const Divider(color: Color(0xFF334155)),
          const SizedBox(height: 16),
          const Text('Sobre', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
          const SizedBox(height: 10),
          _InfoTile(Icons.info_rounded, 'Versão', '1.0.0'),
          _InfoTile(Icons.code_rounded, 'Backend', 'Flask + SQLAlchemy'),
          _InfoTile(Icons.smart_toy_rounded, 'Lion AI', 'GPT-4o mini'),
        ]),
      ),
    );
  }

  Widget _InfoTile(IconData icon, String label, String valor) => ListTile(
    dense: true, contentPadding: EdgeInsets.zero,
    leading: Icon(icon, size: 18, color: const Color(0xFF64748B)),
    title: Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
    trailing: Text(valor, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
  );
}
