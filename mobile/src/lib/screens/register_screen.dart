import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api/client.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _successMessage;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
      _successMessage = null;
    });

    final payload = {
      'firstName': _first.text.trim(),
      'lastName': _last.text.trim(),
      'email': _email.text.trim(),
      'password': _password.text,
      'phone': _phone.text.trim(),
    };

    try {
      final res = await api.register(payload);
      if (res['status'] == 'error') {
        setState(() => _error = res['message']?.toString() ?? 'Error');
      } else {
        setState(() {
          _successMessage = 'Account created! Check your email to verify.';
        });
      }
    } catch (e) {
      setState(() => _error = 'Register error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF050816), Color(0xFF050816), Color(0xFF07162A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  decoration: AppTheme.neonCardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: AppTheme.primaryGradient,
                            ),
                            child: const Icon(Icons.language,
                                size: 18, color: Colors.black),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'TRANSLIFY',
                            style: theme.headlineSmall,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'CREATE ACCOUNT',
                        style: theme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "We'll send you a verification email.",
                        style: theme.bodySmall,
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _first,
                              decoration: const InputDecoration(
                                labelText: 'First name',
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextField(
                              controller: _last,
                              decoration: const InputDecoration(
                                labelText: 'Last name',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          hintText: 'you@example.com',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _password,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          hintText: 'At least 8 characters',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          hintText: '+1 555 123 4567',
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          style: const TextStyle(
                              color: Colors.redAccent, fontSize: 12),
                        ),
                      ],
                      if (_successMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _successMessage!,
                          style: const TextStyle(
                              color: AppTheme.cyan, fontSize: 12),
                        ),
                      ],
                      const SizedBox(height: 24),
                      _loading
                          ? const Center(
                              child: CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation(
                                    AppTheme.cyan),
                              ),
                            )
                          : AppTheme.neonButton(
                              label: 'Create account',
                              onTap: _submit,
                            ),
                      const SizedBox(height: 16),
                      Center(
                        child: GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: const Text(
                            'Return to login',
                            style: TextStyle(
                              color: AppTheme.cyan,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
