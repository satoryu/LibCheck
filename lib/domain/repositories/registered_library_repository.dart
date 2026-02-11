import 'package:libcheck/domain/models/library.dart';

abstract class RegisteredLibraryRepository {
  Future<List<Library>> getAll();
  Future<void> saveAll(List<Library> libraries);
  Future<List<Library>> add(Library library);
  Future<List<Library>> addAll(List<Library> libraries);
  Future<List<Library>> remove(Library library);
}
