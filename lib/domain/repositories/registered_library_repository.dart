import 'package:libcheck/domain/models/library.dart';

abstract class RegisteredLibraryRepository {
  Future<List<Library>> getAll();
  Future<void> saveAll(List<Library> libraries);
  Future<void> add(Library library);
  Future<void> addAll(List<Library> libraries);
  Future<void> remove(Library library);
}
