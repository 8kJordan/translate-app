import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

String apiBaseUrl() => "https://group9-contacts.com"; 

class ApiConfig {
  static final ApiConfig instance = ApiConfig._internal();
  factory ApiConfig() => instance;

  late Dio dio;
  bool _initialized = false;

  ApiConfig._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: apiBaseUrl(),
        connectTimeout: const Duration(seconds: 25),   // <-- Extended for Render / slow hosting
        receiveTimeout: const Duration(seconds: 25),   // <-- Extended
        sendTimeout: const Duration(seconds: 25),      // <-- Extended
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      ),
    );
  }
  Future<void> ensureInitialized() async {
    if (_initialized) return;

    final dir = await getApplicationSupportDirectory();
    final jarDir = Directory("${dir.path}/cookies");

    if (!await jarDir.exists()) {
      await jarDir.create(recursive: true);
    }

    final cookieJar = PersistCookieJar(storage: FileStorage(jarDir.path));
    dio.interceptors.add(CookieManager(cookieJar));

    dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,

      ),
    );

    _initialized = true;
  }
}

final api = ApiConfig.instance;

