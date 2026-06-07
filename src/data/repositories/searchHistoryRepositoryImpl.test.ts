import { beforeEach, describe, expect, it } from "vitest";
import { SearchHistoryRepositoryImpl } from "@/data/repositories/searchHistoryRepositoryImpl";
import type { SearchHistoryEntry } from "@/domain/models/searchHistoryEntry";
import { FakeLocalStorageRepository } from "@/test/testUtils";

function createEntry(args: {
  isbn: string;
  searchedAt?: Date;
  libraryStatuses?: Record<string, string>;
}): SearchHistoryEntry {
  return {
    isbn: args.isbn,
    searchedAt: args.searchedAt ?? new Date(2026, 1, 15, 10, 0),
    libraryStatuses: args.libraryStatuses ?? { Tokyo_Chiyoda: "available" },
  };
}

describe("SearchHistoryRepositoryImpl", () => {
  let fakeStorage: FakeLocalStorageRepository;
  let repository: SearchHistoryRepositoryImpl;

  beforeEach(() => {
    fakeStorage = new FakeLocalStorageRepository();
    repository = new SearchHistoryRepositoryImpl(fakeStorage);
  });

  describe("getAll", () => {
    it("returns empty list when no data stored", async () => {
      const result = await repository.getAll();
      expect(result).toHaveLength(0);
    });

    it("returns entries sorted by searchedAt descending", async () => {
      const older = createEntry({
        isbn: "9784003101018",
        searchedAt: new Date(2026, 1, 14),
      });
      const newer = createEntry({
        isbn: "9784167158057",
        searchedAt: new Date(2026, 1, 15),
      });

      await repository.save(older);
      await repository.save(newer);

      const result = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].isbn).toBe("9784167158057");
      expect(result[1].isbn).toBe("9784003101018");
    });

    it("returns empty list when stored JSON is corrupted", async () => {
      await fakeStorage.setString("search_history", "not valid json");
      const result = await repository.getAll();
      expect(result).toHaveLength(0);
    });
  });

  describe("save", () => {
    it("saves a new entry", async () => {
      const entry = createEntry({ isbn: "9784003101018" });
      await repository.save(entry);

      const result = await repository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].isbn).toBe("9784003101018");
    });

    it("updates existing entry with same ISBN", async () => {
      const original = createEntry({
        isbn: "9784003101018",
        searchedAt: new Date(2026, 1, 14),
        libraryStatuses: { Tokyo_Chiyoda: "checkedOut" },
      });
      const updated = createEntry({
        isbn: "9784003101018",
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: { Tokyo_Chiyoda: "available" },
      });

      await repository.save(original);
      await repository.save(updated);

      const result = await repository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].searchedAt).toEqual(new Date(2026, 1, 15));
      expect(result[0].libraryStatuses["Tokyo_Chiyoda"]).toBe("available");
    });

    it("removes oldest entries when exceeding maxEntries", async () => {
      for (let i = 0; i < 105; i++) {
        const isbn = `978400310${i.toString().padStart(4, "0")}`;
        await repository.save(
          createEntry({
            isbn,
            searchedAt: new Date(
              new Date(2026, 0, 1).getTime() + i * 60 * 60 * 1000,
            ),
          }),
        );
      }

      const result = await repository.getAll();
      // The first 5 entries (oldest) should have been removed
      expect(result[result.length - 1].isbn).toBe(
        `978400310${(5).toString().padStart(4, "0")}`,
      );
    });
  });

  describe("remove", () => {
    it("removes entry by ISBN", async () => {
      await repository.save(createEntry({ isbn: "9784003101018" }));
      await repository.save(createEntry({ isbn: "9784167158057" }));

      await repository.remove("9784003101018");

      const result = await repository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].isbn).toBe("9784167158057");
    });
  });

  describe("removeAll", () => {
    it("removes all entries", async () => {
      await repository.save(createEntry({ isbn: "9784003101018" }));
      await repository.save(createEntry({ isbn: "9784167158057" }));

      await repository.removeAll();

      const result = await repository.getAll();
      expect(result).toHaveLength(0);
    });
  });
});
