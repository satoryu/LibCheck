import { beforeEach, describe, expect, it } from "vitest";
import { RegisteredLibraryRepositoryImpl } from "@/data/repositories/registeredLibraryRepositoryImpl";
import { type Library, libraryToJson } from "@/domain/models/library";
import { FakeLocalStorageRepository } from "@/test/testUtils";

const library1: Library = {
  systemId: "Tokyo_Minato",
  systemName: "港区図書館",
  libKey: "みなと",
  libId: "123",
  shortName: "みなと図書館",
  formalName: "港区立みなと図書館",
  address: "東京都港区芝公園3-2-25",
  pref: "東京都",
  city: "港区",
  category: "MEDIUM",
};

const library2: Library = {
  systemId: "Tokyo_Shibuya",
  systemName: "渋谷区図書館",
  libKey: "しぶや",
  libId: "456",
  shortName: "渋谷図書館",
  formalName: "渋谷区立中央図書館",
  address: "東京都渋谷区神宮前1-1-1",
  pref: "東京都",
  city: "渋谷区",
  category: "LARGE",
};

describe("RegisteredLibraryRepositoryImpl", () => {
  let fakeStorage: FakeLocalStorageRepository;
  let repository: RegisteredLibraryRepositoryImpl;

  beforeEach(() => {
    fakeStorage = new FakeLocalStorageRepository();
    repository = new RegisteredLibraryRepositoryImpl(fakeStorage);
  });

  it("getAll returns empty list when no data stored", async () => {
    const result = await repository.getAll();
    expect(result).toHaveLength(0);
  });

  it("getAll returns stored libraries", async () => {
    const jsonList = [libraryToJson(library1), libraryToJson(library2)];
    await fakeStorage.setString(
      "registered_libraries",
      JSON.stringify(jsonList),
    );

    const result = await repository.getAll();
    expect(result).toHaveLength(2);
    expect(result[0].systemId).toBe("Tokyo_Minato");
    expect(result[1].systemId).toBe("Tokyo_Shibuya");
  });

  it("add stores a library and returns updated list", async () => {
    const result = await repository.add(library1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(library1);
  });

  it("add does not duplicate existing library", async () => {
    await repository.add(library1);
    const result = await repository.add(library1);

    expect(result).toHaveLength(1);
  });

  it("remove deletes a library and returns updated list", async () => {
    await repository.addAll([library1, library2]);
    const result = await repository.remove(library1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(library2);
  });

  it("getAll returns empty list when JSON is corrupted", async () => {
    await fakeStorage.setString("registered_libraries", "not valid json");

    const result = await repository.getAll();
    expect(result).toHaveLength(0);
  });

  it("saveAll replaces all libraries", async () => {
    await repository.addAll([library1, library2]);
    await repository.saveAll([library2]);

    const result = await repository.getAll();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(library2);
  });
});
