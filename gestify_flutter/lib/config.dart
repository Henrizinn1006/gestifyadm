import 'package:shared_preferences/shared_preferences.dart';

class Config {
  static const _keyBaseUrl = 'gestify_base_url';
  // No Android: 10.0.2.2 acessa o localhost do PC (emulador)
  // Na rede local: use o IP do seu PC (ex: 192.168.1.x)
  static const defaultBaseUrl = 'http://10.0.2.2:8000';

  static String _baseUrl = defaultBaseUrl;
  static String get baseUrl => _baseUrl;

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(_keyBaseUrl) ?? defaultBaseUrl;
  }

  static Future<void> save(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBaseUrl, url.trimRight().replaceAll(RegExp(r'/$'), ''));
    _baseUrl = url;
  }
}
