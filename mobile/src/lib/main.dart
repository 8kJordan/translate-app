import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'api/client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await api.ensureInitialized();
  runApp(const TranslifyApp());
}

class TranslifyApp extends StatelessWidget {
  const TranslifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Translify',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const LoginScreen(),
    );
  }
}
