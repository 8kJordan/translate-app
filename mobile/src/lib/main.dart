import 'package:flutter/material.dart';
import 'screens/translate_screen.dart';
import 'screens/users_screen.dart';

void main() {
  runApp(const TranslateApp());
}

class TranslateApp extends StatelessWidget {
  const TranslateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Translate',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      initialRoute: '/',
      routes: {
        '/': (_) => const TranslateScreen(),
        '/users': (_) => const UsersScreen(),
      },
    );
  }
}
