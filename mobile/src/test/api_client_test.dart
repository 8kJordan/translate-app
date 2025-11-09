import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';
import 'package:translate_mobile/api/client.dart';
import 'package:translate_mobile/config.dart';

const _loginEmail = String.fromEnvironment(
  'TEST_LOGIN_EMAIL',
  defaultValue: 'your-email@gmail.com',
);
const _loginPassword = String.fromEnvironment('TEST_LOGIN_PASSWORD', defaultValue: '');
const _profileEmail = String.fromEnvironment(
  'TEST_PROFILE_EMAIL',
  defaultValue: _loginEmail,
);

String? _latestTranslationId;

void main() {
  LiveTestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;

  final tempRoot = Directory.systemTemp.createTempSync('api_client_storage');
  PathProviderPlatform.instance = _TestPathProvider(tempRoot.path);

  setUpAll(() async {
    await api.ensureInitialized();
  });

  tearDownAll(() async {
    if (tempRoot.existsSync()) {
      await tempRoot.delete(recursive: true);
    }
  });

  test('01 - register new account with required fields', () async {
    final email = _integrationEmail();
    final payload = {
      'email': email,
      'password': 'TestPass!123',
      'phone': '+15551234567',
      'firstName': 'Integration',
      'lastName': 'Tester',
    };
    _logRequest('register', 'POST', '/api/auth/register', payload: payload);
    final response = await _exec(
      'register',
      () => api.register(payload),
    );
    _logResponse('register', response);
    expect(response['status'], isNot(equals('error')));
  });

  test('02 - reset session before login', () async {
    _logMessage('reset', 'Clearing persisted cookies before login');
    await api.clearSession();
  });

  test('03 - login existing account', () async {
    final password = _requireLoginPassword();
    _logRequest(
      'login',
      'POST',
      '/api/auth/login',
      payload: {'email': _loginEmail, 'password': '***redacted***'},
    );
    final response = await _exec(
      'login',
      () => api.login(email: _loginEmail, password: password),
    );
    _logResponse('login', response);
    expect(response['status'], isNot(equals('error')));
  });

  test('04 - verify current session', () async {
    _logRequest('verifySession', 'POST', '/api/auth');
    final response = await _exec('verifySession', api.verifySession);
    _logResponse('verifySession', response);
    expect(response['isAuthenticated'], isTrue);
  });

  test('05 - translate text', () async {
    final text = 'Integration ping at ${DateTime.now().toIso8601String()}';
    _logRequest(
      'translate',
      'POST',
      '/api/translate',
      payload: {'text': text, 'from': 'en', 'to': 'es'},
    );
    final translated = await _exec(
      'translate',
      () => api.translate(text: text, from: 'en', to: 'es'),
    );
    _logResponse('translate', {'translatedText': translated});
    expect(translated.isNotEmpty, isTrue);
  });

  test('06 - refresh access token', () async {
    _logRequest('refresh', 'POST', '/api/auth/refresh');
    final response = await _exec('refresh', api.refresh);
    _logResponse('refresh', response);
    expect(response['status'], anyOf(null, 'success'));
  });

  test('07 - list languages', () async {
    _logRequest('languages', 'GET', '/api/languages');
    final response = await _exec('languages', api.listLanguages);
    _logResponse('languages', response);
    expect(response['status'], anyOf(null, 'success'));
  });

  test('08 - fetch language code', () async {
    _logRequest('languageCode', 'GET', '/api/languages/English');
    final response = await _exec('languageCode', () => api.getLanguageCode('English'));
    _logResponse('languageCode', response);
    expect(response['code'], isNotEmpty);
  });

  test('09 - fetch user profile', () async {
    _logRequest('userProfile', 'GET', '/api/users/${Uri.encodeComponent(_profileEmail)}');
    final response = await _exec('userProfile', () => api.getUserProfile(_profileEmail));
    _logResponse('userProfile', response);
    expect(response['status'], anyOf(null, 'success'));
  });

  test('10 - list user translations', () async {
    _logRequest(
      'userTranslations',
      'GET',
      '/api/users/${Uri.encodeComponent(_profileEmail)}/translations',
      query: const {'page': 1, 'limit': 10},
    );
    final response = await _exec(
      'userTranslations',
      () => api.getUserTranslations(_profileEmail, page: 1, limit: 10),
    );
    _logResponse('userTranslations', response);
    expect(response['status'], anyOf(null, 'success'));
    final data = response['data'];
    if (data is List && data.isNotEmpty) {
      final first = data.first;
      if (first is Map && first['_id'] != null) {
        _latestTranslationId = first['_id'].toString();
      }
    }
  });

  test('11 - fetch specific translation when available', () async {
    final translationId = _latestTranslationId;
    if (translationId == null) {
      _logMessage('userTranslation', 'No translation id discovered; skipping.');
      return;
    }
    _logRequest(
      'userTranslation',
      'GET',
      '/api/users/${Uri.encodeComponent(_profileEmail)}/translations/$translationId',
    );
    final response = await _exec(
      'userTranslation',
      () => api.getUserTranslation(_profileEmail, translationId),
    );
    _logResponse('userTranslation', response);
    expect(response['status'], anyOf(null, 'success'));
  });

  test('12 - logout', () async {
    _logRequest('logout', 'GET', '/api/auth/logout');
    final response = await _exec('logout', api.logout);
    _logResponse('logout', response);
    expect(response['status'], anyOf(null, 'success'));
  });
}

String _integrationEmail() =>
    'integration_${DateTime.now().millisecondsSinceEpoch}@example.com';

String _requireLoginPassword() {
  if (_loginPassword.isEmpty) {
    throw TestFailure(
      'TEST_LOGIN_PASSWORD is not set. Run with --dart-define=TEST_LOGIN_PASSWORD=yourPassword',
    );
  }
  return _loginPassword;
}

void _logRequest(
  String label,
  String method,
  String path, {
  Map<String, dynamic>? query,
  Map<String, dynamic>? payload,
}) {
  final url = path.startsWith('http') ? path : '${apiBaseUrl()}$path';
  // ignore: avoid_print
  print('[$label] $method $url');
  if (query != null && query.isNotEmpty) {
    // ignore: avoid_print
    print('[$label] query: $query');
  }
  if (payload != null && payload.isNotEmpty) {
    // ignore: avoid_print
    print('[$label] payload: $payload');
  }
}

void _logResponse(String label, dynamic response) {
  // ignore: avoid_print
  print('[$label] response: $response\n');
}

void _logMessage(String label, String message) {
  // ignore: avoid_print
  print('[$label] $message');
}

Future<T> _exec<T>(String label, Future<T> Function() action) async {
  try {
    return await action();
  } on DioException catch (e) {
    _logError(label, e);
    rethrow;
  } catch (e) {
    // ignore: avoid_print
    print('[$label] unexpected error: $e');
    rethrow;
  }
}

void _logError(String label, DioException e) {
  final status = e.response?.statusCode;
  final uri = e.response?.requestOptions.uri;
  // ignore: avoid_print
  print('[$label] DioException status=$status uri=$uri');
  if (e.response?.data != null) {
    // ignore: avoid_print
    print('[$label] error body: ${e.response?.data}');
  } else {
    // ignore: avoid_print
    print('[$label] error: ${e.message}');
  }
}

class _TestPathProvider extends PathProviderPlatform {
  _TestPathProvider(this.basePath);
  final String basePath;

  @override
  Future<String?> getApplicationSupportPath() async => basePath;
}
