import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../config.dart';

class ApiClient {
  final String base = apiBaseUrl();

  Future<List<dynamic>> getUsers() async {
    final uri = Uri.parse('$base/users');
    final res = await http.get(uri, headers: {'Accept': 'application/json'});
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return data is List ? data : [data];
    }
    throw Exception('GET /users failed: ${res.statusCode} ${res.body}');
  }

  Future<String> translate({
    required String text,
    String source = 'en',
    String target = 'es',
  }) async {
    final uri = Uri.parse('$base/translate');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'text': text, 'source': source, 'target': target}),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      return (data['translated'] ?? data.toString()).toString();
    }
    throw Exception('POST /translate failed: ${res.statusCode} ${res.body}');
  }
}

final api = ApiClient();
