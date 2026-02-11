import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/providers/city_providers.dart';

class CitySelectionPage extends ConsumerStatefulWidget {
  const CitySelectionPage({super.key, required this.prefecture});

  final String prefecture;

  @override
  ConsumerState<CitySelectionPage> createState() => _CitySelectionPageState();
}

class _CitySelectionPageState extends ConsumerState<CitySelectionPage> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final citiesAsync = ref.watch(cityListProvider(widget.prefecture));

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.prefecture}の市区町村'),
      ),
      body: citiesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              const Text('エラーが発生しました'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () =>
                    ref.invalidate(cityListProvider(widget.prefecture)),
                child: const Text('再試行する'),
              ),
            ],
          ),
        ),
        data: (cities) {
          final filteredCities = _searchQuery.isEmpty
              ? cities
              : cities
                  .where((city) => city.contains(_searchQuery))
                  .toList();

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextField(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: '市区町村を検索...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: filteredCities.length,
                  itemBuilder: (context, index) {
                    final city = filteredCities[index];
                    return ListTile(
                      title: Text(city),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        context.go(
                            '/library/add/${widget.prefecture}/$city');
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
