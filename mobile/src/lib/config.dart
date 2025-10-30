import 'dart:io' show Platform;

/// change this if your backend uses a different port
const int _port = 3000;

/// android emulator can't reach localhost directly; it uses 10.0.2.2
String apiBaseUrl() {
  if (Platform.isAndroid) return 'http://10.0.2.2:$_port';
  return 'http://localhost:$_port';
}
