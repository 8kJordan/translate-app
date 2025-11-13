// lib/config.dart
import 'package:flutter/foundation.dart';

String apiBaseUrl() {
  // When running on Chrome/web, localhost is correct.
  if (kIsWeb) {
    return 'http://localhost:3000';
  }

  // When running on Android emulator, use the special host:
  // 10.0.2.2 -> maps to your computer's localhost.
  return 'http://10.0.2.2:3000';
}
