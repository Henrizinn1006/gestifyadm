import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'clientes_screen.dart';
import 'eventos_screen.dart';
import 'financeiro_screen.dart';
import 'lion_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _idx = 0;

  final _screens = const [
    DashboardScreen(),
    ClientesScreen(),
    EventosScreen(),
    FinanceiroScreen(),
    LionScreen(),
  ];

  final _labels = ['Dashboard', 'Clientes', 'Eventos', 'Financeiro', 'Lion AI'];
  final _icons  = [
    Icons.dashboard_rounded,
    Icons.people_rounded,
    Icons.celebration_rounded,
    Icons.account_balance_wallet_rounded,
    Icons.smart_toy_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Image.asset(
          'assets/images/logo.png',
          height: 32,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Text(
            'Gestify',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        destinations: List.generate(_screens.length, (i) => NavigationDestination(
          icon: Icon(_icons[i]),
          label: _labels[i],
        )),
      ),
    );
  }
}
