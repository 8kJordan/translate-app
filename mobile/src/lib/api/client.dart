import 'dart:async';
import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../../config.dart';

/// Thin wrapper around the production API with cookie-based auth + auto refresh.
/// The singleton exported at the bottom should be reused across the app so that
/// cookies and queued refresh logic are shared by every call site.
class ApiClient {
  factory ApiClient() => _instance;

  ApiClient._internal({Dio? dio, Directory? cookieDirOverride})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: apiBaseUrl(),
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 10),
                responseType: ResponseType.json,
              ),
            ),
        _cookieDirOverride = cookieDirOverride {
    _initialization = _initialize();
  }

  static final ApiClient _instance = ApiClient._internal();

  final Dio _dio;
  final Directory? _cookieDirOverride;
  late final Future<void> _initialization;
  PersistCookieJar? _cookieJar;
  Future<void>? _refreshing;

  static const _cookieDirName = 'auth_cookies';
  static const _skipAuthKey = 'skipAuthRefresh';

  factory ApiClient.newInstance({Dio? dio, Directory? cookieDir}) {
    return ApiClient._internal(dio: dio, cookieDirOverride: cookieDir);
  }

  Future<void> _initialize() async {
    final cookieDir = await _resolveCookieDir();
    _cookieJar = PersistCookieJar(storage: FileStorage(cookieDir.path));
    _dio.interceptors.add(CookieManager(_cookieJar!));
    // Queue requests while a refresh call is in flight and retry once new cookies arrive.
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          if (options.extra[_skipAuthKey] == true) {
            handler.next(options);
            return;
          }
          if (_refreshing != null) {
            try {
              await _refreshing;
            } catch (_) {
              handler.reject(
                DioException(
                  requestOptions: options,
                  type: DioExceptionType.badResponse,
                  response: Response(
                    requestOptions: options,
                    statusCode: 401,
                    statusMessage: 'Authentication required',
                  ),
                ),
              );
              return;
            }
          }
          handler.next(options);
        },
        onError: (err, handler) async {
          final response = err.response;
          if (response?.statusCode == 401 && _shouldAttemptRefresh(err.requestOptions)) {
            try {
              await _performRefresh();
              final retried = await _retry(err.requestOptions);
              handler.resolve(retried);
              return;
            } catch (_) {
              await _clearCookies();
            }
          }
          handler.next(err);
        },
      ),
    );
    await _refreshSessionOnStartup();
  }

  bool _shouldAttemptRefresh(RequestOptions options) {
    if (options.extra[_skipAuthKey] == true) return false;
    final path = options.uri.path;
    // Avoid recursive refresh attempts for auth endpoints themselves.
    return !path.endsWith('/api/auth') &&
        !path.endsWith('/api/auth/login') &&
        !path.endsWith('/api/auth/register') &&
        !path.endsWith('/api/auth/refresh') &&
        !path.endsWith('/api/auth/logout');
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) {
    final retryOptions = Options(
      method: requestOptions.method,
      headers: Map<String, dynamic>.from(requestOptions.headers),
      responseType: requestOptions.responseType,
      contentType: requestOptions.contentType,
      followRedirects: requestOptions.followRedirects,
      validateStatus: requestOptions.validateStatus,
      receiveDataWhenStatusError: requestOptions.receiveDataWhenStatusError,
      extra: Map<String, dynamic>.from(requestOptions.extra),
    );
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: retryOptions,
      cancelToken: requestOptions.cancelToken,
      onReceiveProgress: requestOptions.onReceiveProgress,
      onSendProgress: requestOptions.onSendProgress,
    );
  }

  Future<void> _performRefresh() async {
    _refreshing ??= _triggerRefresh();
    try {
      await _refreshing;
    } finally {
      _refreshing = null;
    }
  }

  Future<void> _triggerRefresh() async {
    await _dio.post<dynamic>(
      '/api/auth/refresh',
      options: Options(extra: {_skipAuthKey: true}),
    );
  }

  Future<void> _refreshSessionOnStartup() async {
    final jar = _cookieJar;
    if (jar == null) return;
    final baseUri = Uri.parse(apiBaseUrl());
    final cookies = await jar.loadForRequest(baseUri);
    if (cookies.isEmpty) return;
    final hasValidCookie = cookies.any(
      (cookie) => cookie.expires == null || cookie.expires!.isAfter(DateTime.now()),
    );
    if (!hasValidCookie) return;
    try {
      // If we already had cookies on disk, eagerly refresh so the first API call is authenticated.
      await _triggerRefresh();
    } catch (_) {
      // leave existing cookies; a failed refresh will be handled on first request
    }
  }

  Future<Directory> _resolveCookieDir() async {
    if (_cookieDirOverride != null) {
      if (!await _cookieDirOverride!.exists()) {
        await _cookieDirOverride!.create(recursive: true);
      }
      return _cookieDirOverride!;
    }
    final supportDir = await getApplicationSupportDirectory();
    final cookieDir = Directory('${supportDir.path}/$_cookieDirName');
    if (!await cookieDir.exists()) {
      await cookieDir.create(recursive: true);
    }
    return cookieDir;
  }

  Future<void> _clearCookies() async {
    final jar = _cookieJar;
    if (jar != null) {
      await jar.deleteAll();
    }
  }

  Future<Response<T>> _request<T>(
    String path, {
    String method = 'GET',
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    await _initialization;
    final effectiveOptions = (options ?? Options()).copyWith(method: method);
    // All requests funnel through Dio to ensure interceptors (cookies/refresh) run consistently.
    return _dio.request<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: effectiveOptions,
    );
  }

  Future<void> ensureInitialized() async {
    await _initialization;
  }

  List<dynamic> _ensureList(dynamic data) {
    if (data is List) return data;
    return [data];
  }

  Map<String, dynamic> _ensureMap(dynamic data) {
    if (data == null) return <String, dynamic>{};
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'value': data};
  }

  Future<Map<String, dynamic>> verifySession() async {
    final res = await _request<dynamic>(
      '/api/auth',
      method: 'POST',
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('POST /api/auth failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<String> translate({
    required String text,
    required String to,
    String? from,
  }) async {
    final payload = <String, dynamic>{'text': text, 'to': to};
    if (from != null && from.isNotEmpty) payload['from'] = from;
    final res = await _request<Map<String, dynamic>>(
      '/api/translate',
      method: 'POST',
      data: payload,
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      final data = res.data ?? {};
      return (data['translatedText'] ?? data['translated'] ?? data.toString()).toString();
    }
    throw Exception('POST /api/translate failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await _request<dynamic>(
      '/api/auth/login',
      method: 'POST',
      data: {'email': email, 'password': password},
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('POST /api/auth/login failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final res = await _request<dynamic>(
      '/api/auth/register',
      method: 'POST',
      data: payload,
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('POST /api/auth/register failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> verifyToken(String token) async {
    final res = await _request<dynamic>('/api/auth/verify/${_encodePathSegment(token)}');
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('GET /api/auth/verify/$token failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> refresh() async {
    final res = await _request<dynamic>(
      '/api/auth/refresh',
      method: 'POST',
      options: Options(extra: {_skipAuthKey: true}),
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('POST /api/auth/refresh failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> logout() async {
    final res = await _request<dynamic>(
      '/api/auth/logout',
      method: 'GET',
      options: Options(extra: {_skipAuthKey: true}),
    );
    await _clearCookies();
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('POST /api/auth/logout failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<void> clearSession() async {
    // Allows callers (tests, logout flows) to wipe cookies explicitly.
    await _clearCookies();
  }

  Future<Map<String, dynamic>> listLanguages() async {
    final res = await _request<dynamic>('/api/languages');
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('GET /api/languages failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> getLanguageCode(String language) async {
    final res = await _request<dynamic>('/api/languages/${_encodePathSegment(language)}');
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('GET /api/languages/$language failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> getUserProfile(String email) async {
    final res = await _request<dynamic>('/api/users/${_encodePathSegment(email)}');
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('GET /api/users/$email failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> getUserTranslations(
    String email, {
    int page = 1,
    int limit = 10,
  }) async {
    final res = await _request<dynamic>(
      '/api/users/${_encodePathSegment(email)}/translations',
      queryParameters: {'page': page, 'limit': limit},
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception('GET /api/users/$email/translations failed: ${res.statusCode} ${res.statusMessage}');
  }

  Future<Map<String, dynamic>> getUserTranslation(String email, String translationId) async {
    final res = await _request<dynamic>(
      '/api/users/${_encodePathSegment(email)}/translations/${_encodePathSegment(translationId)}',
    );
    if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
      return _ensureMap(res.data);
    }
    throw Exception(
      'GET /api/users/$email/translations/$translationId failed: ${res.statusCode} ${res.statusMessage}',
    );
  }

  // Back end occasionally expects parentheses encoded, so we normalize here once.
  String _encodePathSegment(String value) {
    final encoded = Uri.encodeComponent(value);
    return encoded.replaceAll('(', '%28').replaceAll(')', '%29');
  }
}

final api = ApiClient();
