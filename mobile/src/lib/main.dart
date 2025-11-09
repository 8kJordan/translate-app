import 'package:flutter/material.dart';
import 'api/client.dart';
import 'screens/translate_screen.dart';
import 'screens/users_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await api.ensureInitialized();
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
