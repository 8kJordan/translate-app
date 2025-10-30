import 'package:flutter/material.dart';
import '../api/client.dart';

class TranslateScreen extends StatefulWidget {
  const TranslateScreen({super.key});
  @override
  State<TranslateScreen> createState() => _TranslateScreenState();
}

class _TranslateScreenState extends State<TranslateScreen> {
  final _textCtrl = TextEditingController();
  String source = 'en';
  String target = 'es';
  bool loading = false;
  String? error;
  String? result;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() { loading = true; error = null; result = null; });
    try {
      final translated = await api.translate(
        text: _textCtrl.text.trim(),
        source: source,
        target: target,
      );
      setState(() => result = translated);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Translator'),
        actions: [
          IconButton(
            icon: const Icon(Icons.group),
            tooltip: 'Go to /users',
            onPressed: () => Navigator.pushNamed(context, '/users'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Text to translate', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TextField(
            controller: _textCtrl,
            minLines: 3,
            maxLines: 6,
            decoration: const InputDecoration(
              hintText: 'Enter text…',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _LangPicker(label: 'From', value: source, onChanged: (v) => setState(() => source = v))),
              const SizedBox(width: 12),
              Expanded(child: _LangPicker(label: 'To', value: target, onChanged: (v) => setState(() => target = v))),
            ],
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            icon: const Icon(Icons.translate),
            label: const Text('Translate'),
            onPressed: loading ? null : _submit,
          ),
          if (loading) const Padding(
            padding: EdgeInsets.only(top: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(error!, style: const TextStyle(color: Colors.red)),
            ),
          if (result != null)
            Container(
              margin: const EdgeInsets.only(top: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.black12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Result', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(result!, style: const TextStyle(fontSize: 16)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _LangPicker extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  const _LangPicker({required this.label, required this.value, required this.onChanged, super.key});

  @override
  Widget build(BuildContext context) {
    const langs = ['en','es','fr','de','it','pt','zh','ja','ko'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          items: [for (final l in langs) DropdownMenuItem(value: l, child: Text(l.toUpperCase()))],
          onChanged: (v) { if (v != null) onChanged(v); },
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
      ],
    );
  }
}
