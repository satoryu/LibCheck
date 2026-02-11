import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  List<Library> _libraries = [];

  @override
  Future<List<Library>> getAll() async => List.from(_libraries);

  @override
  Future<void> saveAll(List<Library> libraries) async {
    _libraries = List.from(libraries);
  }

  @override
  Future<List<Library>> add(Library library) async {
    if (!_libraries.contains(library)) {
      _libraries.add(library);
    }
    return List.from(_libraries);
  }

  @override
  Future<List<Library>> addAll(List<Library> libraries) async {
    for (final lib in libraries) {
      if (!_libraries.contains(lib)) {
        _libraries.add(lib);
      }
    }
    return List.from(_libraries);
  }

  @override
  Future<List<Library>> remove(Library library) async {
    _libraries.removeWhere((e) => e == library);
    return List.from(_libraries);
  }
}

const _library1 = Library(
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
);

const _library2 = Library(
  systemId: 'Tokyo_Shibuya',
  systemName: '渋谷区図書館',
  libKey: 'しぶや',
  libId: '456',
  shortName: '渋谷図書館',
  formalName: '渋谷区立中央図書館',
  address: '東京都渋谷区神宮前1-1-1',
  pref: '東京都',
  city: '渋谷区',
  category: 'LARGE',
);

void main() {
  late FakeRegisteredLibraryRepository fakeRepo;
  late ProviderContainer container;

  setUp(() {
    fakeRepo = FakeRegisteredLibraryRepository();
    container = ProviderContainer(
      overrides: [
        registeredLibraryRepositoryProvider.overrideWithValue(fakeRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('registeredLibrariesProvider', () {
    test('initial state loads from repository', () async {
      await fakeRepo.addAll([_library1, _library2]);

      final subscription =
          container.listen(registeredLibrariesProvider, (_, __) {});
      // Wait for async initialization
      await container.read(registeredLibrariesProvider.future);

      final state = subscription.read();
      expect(state.value, hasLength(2));
    });

    test('initial state is empty when repository is empty', () async {
      final subscription =
          container.listen(registeredLibrariesProvider, (_, __) {});
      await container.read(registeredLibrariesProvider.future);

      final state = subscription.read();
      expect(state.value, isEmpty);
    });

    test('add adds a library and updates state', () async {
      container.listen(registeredLibrariesProvider, (_, __) {});
      await container.read(registeredLibrariesProvider.future);

      await container
          .read(registeredLibrariesProvider.notifier)
          .add(_library1);

      final result = await container.read(registeredLibrariesProvider.future);
      expect(result, contains(_library1));
    });

    test('addAll adds multiple libraries', () async {
      container.listen(registeredLibrariesProvider, (_, __) {});
      await container.read(registeredLibrariesProvider.future);

      await container
          .read(registeredLibrariesProvider.notifier)
          .addAll([_library1, _library2]);

      final result = await container.read(registeredLibrariesProvider.future);
      expect(result, hasLength(2));
    });

    test('remove removes a library and updates state', () async {
      await fakeRepo.addAll([_library1, _library2]);

      container.listen(registeredLibrariesProvider, (_, __) {});
      await container.read(registeredLibrariesProvider.future);

      await container
          .read(registeredLibrariesProvider.notifier)
          .remove(_library1);

      final result = await container.read(registeredLibrariesProvider.future);
      expect(result, hasLength(1));
      expect(result, isNot(contains(_library1)));
    });
  });
}
