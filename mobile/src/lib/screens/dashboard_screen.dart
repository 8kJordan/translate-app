import 'dart:io';

import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api/client.dart';

class DashboardScreen extends StatefulWidget {
  final String userEmail;

  const DashboardScreen({super.key, required this.userEmail});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _input = TextEditingController();
  String _result = 'Translation will appear here…';
  int _charCount = 0;

  String _from = 'Auto-detect';
  String _to = 'English';

  bool _loadingTranslate = false;
  bool _loadingInit = true;
  String? _status;
  List<dynamic> _history = [];

  /// default language list (fallback when API is unavailable)
  List<String> _languageNames = const [
    'Auto-detect',
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
  ];

  /// map of language name -> code used by backend
  Map<String, String> _nameToCode = {
    'Auto-detect': 'auto', // only used for "from"
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
  };

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await api.ensureInitialized();

      // sstart with the current defaults
      var names = List<String>.from(_languageNames);
      var map = Map<String, String>.from(_nameToCode);

      // \try to load languages from the backend.
      // of anything goes wrong,  keep the defaults above.
      try {
        final langRes = await api.listLanguages();
        final langs = langRes['data'];
        final List<String> apiNames = ['Auto-detect'];
        final Map<String, String> apiMap = {
          'Auto-detect': 'auto',
        };

        if (langs is List && langs.isNotEmpty) {
          for (final item in langs) {
            if (item is Map) {
              final name = item['name']?.toString();
              final code = item['code']?.toString();
              if (name != null && code != null) {
                apiNames.add(name);
                apiMap[name] = code;
              }
            }
          }

          // only override if we actually got at least one real language
          if (apiNames.length > 1) {
            names = apiNames;
            map = apiMap;
          }
        }
      } catch (_) {
   
      }

      // load translations history 
      final histRes =
          await api.getUserTranslations(widget.userEmail, page: 1, limit: 10);
      final histData = histRes['data'];
      List<dynamic> hist = [];
      if (histData is List) hist = histData;

      setState(() {
        _languageNames = names;
        _nameToCode = map;
        _history = hist;
        _status = 'Ready';
        _loadingInit = false;
      });
    } catch (e) {
      setState(() {
        _status = 'Init error: $e';
        _loadingInit = false;
      });
    }
  }

  Future<void> _translate() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _loadingTranslate = true;
      _status = 'Translating…';
      _charCount = text.length;
    });

    try {

      final fromCode =
          _from == 'Auto-detect' ? 'auto' : (_nameToCode[_from] ?? 'en');
      final toCode = _nameToCode[_to] ?? 'en';

      final translated = await api.translate(
        text: text,
        from: fromCode,
        to: toCode,
      );

      setState(() {
        _result = translated.isEmpty ? '<no response>' : translated;
        _status = 'Last op: success';
      });
    } catch (e) {
      setState(() {
        _result = 'Error: $e';
        _status = 'Last op: failed';
      });
    } finally {
      setState(() {
        _loadingTranslate = false;
      });
    }
  }

  Future<void> _signOut() async {
    try {
      await api.logout();
      await api.clearSession();
    } catch (_) {}
    if (!mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _swapLanguages() {
    if (_from == 'Auto-detect') return;
    setState(() {
      final tmp = _from;
      _from = _to;
      _to = tmp;
    });
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                // Top bar: logo + sign out
                Row(
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
                        const SizedBox(width: 8),
                        Text('TRANSLIFY', style: theme.headlineSmall),
                      ],
                    ),
                    const Spacer(),
                    AppTheme.neonButton(
                      label: 'Sign out',
                      onTap: _signOut,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                if (_loadingInit)
                  const Expanded(
                    child: Center(
                      child: CircularProgressIndicator(
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppTheme.cyan),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 700;

                        if (isWide) {
                          // Wide layout (tablet / landscape)
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                width: constraints.maxWidth * 0.3,
                                child: _buildAccountCard(theme),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  children: [
                                    _buildTranslatorCard(theme),
                                    const SizedBox(height: 12),
                                    _buildResultCard(theme),
                                  ],
                                ),
                              ),
                            ],
                          );
                        } else {
                          // Phone layout: stacked
                          return SingleChildScrollView(
                            child: Column(
                              children: [
                                _buildAccountCard(theme),
                                const SizedBox(height: 12),
                                _buildTranslatorCard(theme),
                                const SizedBox(height: 12),
                                _buildResultCard(theme),
                              ],
                            ),
                          );
                        }
                      },
                    ),
                  ),

                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _status ?? '',
                    style: theme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAccountCard(TextTheme theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.neonCardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your Account', style: theme.headlineSmall),
          const SizedBox(height: 12),
          Text(widget.userEmail, style: theme.bodyMedium),
          const SizedBox(height: 16),
          Text('Search history', style: theme.bodySmall),
          const SizedBox(height: 8),
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search text…',
            ),
          ),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              'Clear',
              style: theme.bodySmall!
                  .copyWith(color: AppTheme.cyan, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 16),
          Text('History', style: theme.headlineSmall),
          const SizedBox(height: 8),
          if (_history.isEmpty)
            const Text('No translations yet.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13))
          else
            SizedBox(
              height: 120,
              child: ListView.builder(
                itemCount: _history.length,
                itemBuilder: (context, index) {
                  final item = _history[index];
                  final src = item['text']?.toString() ?? '';
                  final dst = item['translatedText']?.toString() ?? '';
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      '• $src → $dst',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTranslatorCard(TextTheme theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.neonCardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // From / To row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('From', style: theme.bodySmall),
                    const SizedBox(height: 4),
                    _dropdown(
                      value: _from,
                      isFrom: true,
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() => _from = v);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _swapLanguages,
                icon: const Icon(Icons.swap_horiz, color: AppTheme.cyan),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('To', style: theme.bodySmall),
                    const SizedBox(height: 4),
                    _dropdown(
                      value: _to,
                      isFrom: false,
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() => _to = v);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _input,
            maxLines: 5,
            onChanged: (v) => setState(() => _charCount = v.length),
            decoration: const InputDecoration(
              hintText: 'Type text to translate…',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('$_charCount chars',
                  style: const TextStyle(
                      color: AppTheme.textMuted, fontSize: 12)),
              const Spacer(),
              GestureDetector(
                onTap: () {
                  _input.clear();
                  setState(() {
                    _charCount = 0;
                    _result = 'Translation will appear here…';
                  });
                },
                child: const Text(
                  'Clear',
                  style: TextStyle(
                    color: AppTheme.cyan,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              _loadingTranslate
                  ? const SizedBox(
                      width: 30,
                      height: 30,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppTheme.cyan),
                      ),
                    )
                  : AppTheme.neonButton(
                      label: 'Translate',
                      onTap: _translate,
                    ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultCard(TextTheme theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.neonCardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Result', style: theme.bodySmall),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF050B18),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1C2840)),
            ),
            child: Text(
              _result,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dropdown({
    required String value,
    required bool isFrom,
    required ValueChanged<String?> onChanged,
  }) {
    // FROM: includes "Auto-detect"
    // TO:   excludes "Auto-detect"
    final List<String> items = isFrom
        ? _languageNames
        : _languageNames.where((name) => name != 'Auto-detect').toList();

    final safeValue = items.contains(value) ? value : items.first;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF050B18),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1C2840)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: safeValue,
          isExpanded: true,
          dropdownColor: const Color(0xFF050B18),
          iconEnabledColor: AppTheme.cyan,
          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
          items: items
              .map(
                (name) => DropdownMenuItem(
                  value: name,
                  child: Text(name),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

