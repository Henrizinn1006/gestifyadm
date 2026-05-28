import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override String toString() => message;
}

class ApiClient {
  static String get _base => Config.baseUrl;
  static final _headers = {'Content-Type': 'application/json'};

  static Future<dynamic> _get(String path) async {
    try {
      final r = await http.get(Uri.parse('$_base$path'))
          .timeout(const Duration(seconds: 10));
      if (r.statusCode >= 400) throw ApiException('Erro ${r.statusCode}');
      return jsonDecode(utf8.decode(r.bodyBytes));
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Sem conexão com o servidor');
    }
  }

  static Future<dynamic> _post(String path, Map<String, dynamic> body) async {
    try {
      final r = await http.post(Uri.parse('$_base$path'),
          headers: _headers, body: jsonEncode(body))
          .timeout(const Duration(seconds: 30));
      if (r.statusCode >= 400) throw ApiException('Erro ${r.statusCode}');
      return jsonDecode(utf8.decode(r.bodyBytes));
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Sem conexão com o servidor');
    }
  }

  static Future<dynamic> _put(String path, Map<String, dynamic> body) async {
    try {
      final r = await http.put(Uri.parse('$_base$path'),
          headers: _headers, body: jsonEncode(body))
          .timeout(const Duration(seconds: 10));
      if (r.statusCode >= 400) throw ApiException('Erro ${r.statusCode}');
      return jsonDecode(utf8.decode(r.bodyBytes));
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Sem conexão com o servidor');
    }
  }

  static Future<void> _delete(String path) async {
    try {
      final r = await http.delete(Uri.parse('$_base$path'))
          .timeout(const Duration(seconds: 10));
      if (r.statusCode >= 400) throw ApiException('Erro ${r.statusCode}');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Sem conexão com o servidor');
    }
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  static Future<DashboardResumo> getDashboard() async {
    final data = await _get('/dashboard/resumo');
    return DashboardResumo.fromJson(data);
  }

  // ── Clientes ───────────────────────────────────────────────────────────────
  static Future<List<Cliente>> getClientes({String busca = ''}) async {
    final data = await _get('/clientes/?busca=$busca&limit=200') as List;
    return data.map((e) => Cliente.fromJson(e)).toList();
  }

  static Future<Cliente> criarCliente(Map<String, dynamic> body) async {
    final data = await _post('/clientes/', body);
    return Cliente.fromJson(data);
  }

  static Future<Cliente> atualizarCliente(int id, Map<String, dynamic> body) async {
    final data = await _put('/clientes/$id', body);
    return Cliente.fromJson(data);
  }

  static Future<void> excluirCliente(int id) => _delete('/clientes/$id');

  // ── Eventos ────────────────────────────────────────────────────────────────
  static Future<List<Evento>> getEventos({String? status}) async {
    final q = status != null ? '?status=$status' : '';
    final data = await _get('/eventos/$q') as List;
    return data.map((e) => Evento.fromJson(e)).toList();
  }

  static Future<Evento> criarEvento(Map<String, dynamic> body) async {
    final data = await _post('/eventos/', body);
    return Evento.fromJson(data);
  }

  static Future<Evento> atualizarEvento(int id, Map<String, dynamic> body) async {
    final data = await _put('/eventos/$id', body);
    return Evento.fromJson(data);
  }

  static Future<void> excluirEvento(int id) => _delete('/eventos/$id');

  // ── Financeiro ─────────────────────────────────────────────────────────────
  static Future<List<Movimentacao>> getMovimentacoes({
    String? tipo, String? status, int? mes, int? ano}) async {
    final params = <String>[];
    if (tipo != null) params.add('tipo=$tipo');
    if (status != null) params.add('status=$status');
    if (mes != null) params.add('mes=$mes');
    if (ano != null) params.add('ano=$ano');
    params.add('limit=200');
    final data = await _get('/financeiro/?${params.join('&')}') as List;
    return data.map((e) => Movimentacao.fromJson(e)).toList();
  }

  static Future<Movimentacao> criarMovimentacao(Map<String, dynamic> body) async {
    final data = await _post('/financeiro/', body);
    return Movimentacao.fromJson(data);
  }

  static Future<void> excluirMovimentacao(int id) => _delete('/financeiro/$id');

  // ── Lion AI ────────────────────────────────────────────────────────────────
  static Future<List<LionSessao>> getLionSessoes() async {
    final data = await _get('/lion/sessoes') as List;
    return data.map((e) => LionSessao.fromJson(e)).toList();
  }

  static Future<LionSessao> criarLionSessao() async {
    final data = await _post('/lion/sessoes', {});
    return LionSessao.fromJson(data);
  }

  static Future<void> excluirLionSessao(int id) => _delete('/lion/sessoes/$id');

  static Future<List<LionMensagem>> getLionHistorico(int sessaoId) async {
    final data = await _get('/lion/sessoes/$sessaoId/historico') as List;
    return data.map((e) => LionMensagem.fromJson(e)).toList();
  }

  static Future<String> lionChat(int sessaoId, String mensagem) async {
    final data = await _post('/lion/chat',
        {'sessao_id': sessaoId, 'mensagem': mensagem});
    return data['resposta'] ?? '';
  }
}
