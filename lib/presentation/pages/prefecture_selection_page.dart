import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/data/japanese_prefectures.dart';

class PrefectureSelectionPage extends ConsumerStatefulWidget {
  const PrefectureSelectionPage({super.key});

  @override
  ConsumerState<PrefectureSelectionPage> createState() =>
      _PrefectureSelectionPageState();
}

class _PrefectureSelectionPageState
    extends ConsumerState<PrefectureSelectionPage> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final filteredRegions = _buildFilteredRegions();

    return Scaffold(
      appBar: AppBar(
        title: const Text('都道府県を選択'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: '都道府県を検索...',
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
              itemCount: filteredRegions.length,
              itemBuilder: (context, index) {
                final region = filteredRegions[index];
                return _RegionSection(region: region);
              },
            ),
          ),
        ],
      ),
    );
  }

  List<RegionGroup> _buildFilteredRegions() {
    if (_searchQuery.isEmpty) {
      return JapanesePrefectures.regions;
    }

    return JapanesePrefectures.regions
        .map((region) {
          final filtered = region.prefectures
              .where((pref) => pref.contains(_searchQuery))
              .toList();
          return RegionGroup(name: region.name, prefectures: filtered);
        })
        .where((region) => region.prefectures.isNotEmpty)
        .toList();
  }
}

class _RegionSection extends StatelessWidget {
  const _RegionSection({required this.region});

  final RegionGroup region;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            region.name,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ),
        ...region.prefectures.map(
          (pref) => ListTile(
            title: Text(pref),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              context.go('/library/add/$pref');
            },
          ),
        ),
      ],
    );
  }
}
