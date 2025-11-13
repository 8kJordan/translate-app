// lib/api/client.dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import '../config.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient _instance = ApiClient._();
  static ApiClient get I => _instance;

  late Dio _dio;
  PersistCookieJar? _cookieJar;
  bool _initialized = false;

  /// Call this once (your tests already do it in setUpAll).
  Future<void> ensureInitialized() async {
    if (_initialized) return;

    // Prepare cookie storage folder
    final Directory supportDir = await _getSupportDir();
    final cookieDir = Directory('${supportDir.path}${Platform.pathSeparator}cookies');
    if (!await cookieDir.exists()) {
      await cookieDir.create(recursive: true);
    }

    _cookieJar = PersistCookieJar(storage: FileStorage(cookieDir.path));

    _dio = Dio(BaseOptions(
      baseUrl: apiBaseUrl(),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        HttpHeaders.acceptHeader: 'application/json',
        HttpHeaders.contentTypeHeader: 'application/json',
      },
      // IMPORTANT: Let Dio manage cookies via interceptor below (not manual headers)
      validateStatus: (code) => code != null && code >= 200 && code < 600,
    ));

    _dio.interceptors.add(CookieManager(_cookieJar!));

    // Optional: simple logging (comment out if noisy)
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (o, h) => h.next(o),
      onResponse: (r, h) => h.next(r),
      onError: (e, h) => h.next(e),
    ));

    _initialized = true;
  }

  Future<Directory> _getSupportDir() async {
    // Normal app runtime uses real path_provider
    // Your integration test overrides PathProviderPlatform to point here.
    final dir = await getApplicationSupportDirectory();
    return dir;
  }

  // ============== AUTH ==============

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final res = await _dio.post('/api/auth/register', data: payload);
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post('/api/auth/login', data: {
      'email': email,
      'password': password,
    });
    return _asMap(res.data);
  }

  /// POST /api/auth — verify session
  Future<Map<String, dynamic>> verifySession() async {
    final res = await _dio.post('/api/auth');
    return _asMap(res.data);
  }

  /// POST /api/auth/refresh
  Future<Map<String, dynamic>> refresh() async {
    final res = await _dio.post('/api/auth/refresh');
    return _asMap(res.data);
  }

  /// GET /api/auth/logout
  Future<Map<String, dynamic>> logout() async {
    final res = await _dio.get('/api/auth/logout');
    return _asMap(res.data);
  }

  /// Clear persisted cookies (used by your test before login)
  Future<void> clearSession() async {
    await _cookieJar?.deleteAll();
  }

  // ============== TRANSLATE ==============

  /// POST /api/translate
  /// Returns translated text as a string for convenience (the test expects non-empty).
  Future<String> translate({
    required String text,
    required String from,
    required String to,
  }) async {
    final res = await _dio.post('/api/translate', data: {
      'text': text,
      'from': from,
      'to': to,
    });

    final data = _asMapOrNull(res.data);
    if (data != null) {
      // try common field names
      final v = (data['translated'] ?? data['translatedText'] ?? data['text'] ?? data['result']);
      if (v is String) return v;
      if (v != null) return v.toString();
    }
    // if API returns raw string
    if (res.data is String) return res.data as String;

    return res.data?.toString() ?? '';
  }

  // ============== LANGUAGES ==============

  /// GET /api/languages
  Future<Map<String, dynamic>> listLanguages() async {
    final res = await _dio.get('/api/languages');
    return _asMap(res.data);
  }

  /// GET /api/languages/:name
  Future<Map<String, dynamic>> getLanguageCode(String languageName) async {
    final encoded = Uri.encodeComponent(languageName);
    final res = await _dio.get('/api/languages/$encoded');
    return _asMap(res.data);
  }

  // ============== USERS ==============

  /// GET /api/users/:email
  Future<Map<String, dynamic>> getUserProfile(String email) async {
    final encoded = Uri.encodeComponent(email);
    final res = await _dio.get('/api/users/$encoded');
    return _asMap(res.data);
  }

  /// GET /api/users/:email/translations?page=&limit=
  Future<Map<String, dynamic>> getUserTranslations(
    String email, {
    int page = 1,
    int limit = 10,
  }) async {
    final encoded = Uri.encodeComponent(email);
    final res = await _dio.get(
      '/api/users/$encoded/translations',
      queryParameters: {'page': page, 'limit': limit},
    );
    return _asMap(res.data);
  }

  /// GET /api/users/:email/translations/:id
  Future<Map<String, dynamic>> getUserTranslation(
    String email,
    String translationId,
  ) async {
    final encoded = Uri.encodeComponent(email);
    final res = await _dio.get('/api/users/$encoded/translations/$translationId');
    return _asMap(res.data);
  }

  // ============== helpers ==============

  Map<String, dynamic> _asMap(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return {'data': v};
    }

  Map<String, dynamic>? _asMapOrNull(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return null;
  }
}

// A tiny global like you’re importing in tests:  `import 'package:translate_mobile/api/client.dart';`
final api = ApiClient.I;
