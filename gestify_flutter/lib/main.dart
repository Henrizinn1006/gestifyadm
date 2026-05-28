import 'package:flutter/material.dart';
import 'config.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Config.load();
  runApp(const GestifyApp());
}

class GestifyApp extends StatelessWidget {
  const GestifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestify',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          primary:   const Color(0xFF38BDF8),
          secondary: const Color(0xFF22C55E),
          surface:   const Color(0xFF1E293B),
          onSurface: const Color(0xFFF8FAFC),
          error:     const Color(0xFFEF4444),
          surfaceContainerHighest: const Color(0xFF273549),
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        cardColor: const Color(0xFF1E293B),
        dividerColor: const Color(0xFF334155),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E293B),
          foregroundColor: Color(0xFFF8FAFC),
          elevation: 0,
          titleTextStyle: TextStyle(
            fontSize: 18, fontWeight: FontWeight.w600,
            color: Color(0xFFF8FAFC),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: const Color(0xFF1E293B),
          indicatorColor: const Color(0xFF38BDF8).withOpacity(0.15),
          labelTextStyle: WidgetStateProperty.all(
            const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF273549),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFF334155)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
          ),
          labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
          hintStyle: const TextStyle(color: Color(0xFF64748B)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF38BDF8),
            foregroundColor: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(foregroundColor: const Color(0xFF38BDF8)),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: const Color(0xFF273549),
          labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          side: const BorderSide(color: Color(0xFF334155)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        fontFamily: 'Roboto',
      ),
      home: const HomeScreen(),
    );
  }
}
