import 'package:flutter/material.dart';
import '../api/client.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});
  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  bool loading = true;
  String? error;
  List<dynamic> items = [];

  @override
  void initState() {
    super.initState();
    () async {
      try {
        final data = await api.getUsers();
        setState(() => items = data);
      } catch (e) {
        setState(() => error = e.toString());
      } finally {
        setState(() => loading = false);
      }
    }();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users (/users)')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(error!, style: const TextStyle(color: Colors.red)),
                )
              : ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) => ListTile(title: Text(items[i].toString())),
                ),
    );
  }
}
