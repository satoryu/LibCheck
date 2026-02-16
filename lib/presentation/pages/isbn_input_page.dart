import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/utils/isbn_validator.dart';

class IsbnInputPage extends StatefulWidget {
  const IsbnInputPage({super.key});

  @override
  State<IsbnInputPage> createState() => _IsbnInputPageState();
}

class _IsbnInputPageState extends State<IsbnInputPage> {
  final _controller = TextEditingController();
  String? _errorText;
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged() {
    final value = _controller.text;
    final message = IsbnValidator.getValidationMessage(value);
    final normalized = IsbnValidator.normalizeIsbn(value);
    final isValid = normalized.isNotEmpty && IsbnValidator.isValidIsbn(value);

    setState(() {
      _errorText = message;
      _isValid = isValid;
    });
  }

  void _onSubmit() {
    final isbn = IsbnValidator.normalizeIsbn(_controller.text);
    context.push('/result/$isbn?source=isbn');
  }

  void _navigateToScan() {
    context.push('/scan');
  }

  @override
  Widget build(BuildContext context) {
    final normalized = IsbnValidator.normalizeIsbn(_controller.text);
    final showValid = _isValid && _errorText == null && normalized.length >= 10;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ISBN入力'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ISBNを入力してください',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _controller,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'ISBN (13桁 または 10桁)',
                border: const OutlineInputBorder(),
                errorText: _errorText,
              ),
            ),
            const SizedBox(height: 8),
            if (showValid)
              Text(
                '有効なISBNです',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            const SizedBox(height: 8),
            Text(
              '書籍の裏表紙に記載されている13桁の数字を入力してください。',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isValid ? _onSubmit : null,
                child: const Text('検索する'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _navigateToScan,
                child: const Text('バーコードスキャンへ'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
