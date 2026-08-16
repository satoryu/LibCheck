import { describe, expect, it } from "vitest";
import { CalilApiClient } from "@/data/datasources/calilApiClient";
import { StaticLibraryDataSource } from "@/data/datasources/staticLibraryDataSource";
import { LibraryRepositoryImpl } from "@/data/repositories/libraryRepositoryImpl";
import type { Library } from "@/domain/models/library";
import { AvailabilityStatus } from "@/domain/models/availabilityStatus";

function makeClient(body: unknown): CalilApiClient {
  return new CalilApiClient({
    appKey: "test_api_key",
    pollingIntervalMs: 0,
    fetchFn: async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }),
  });
}

/**
 * getLibraries は #158 で静的データソース経由に変わったが、
 * checkBookAvailability のテストではこの依存自体は使わないため、
 * ダミー（呼ばれない）実装で十分。
 */
function unusedStaticSource(): StaticLibraryDataSource {
  return new StaticLibraryDataSource({
    fetchFn: async () => {
      throw new Error("この依存は呼ばれない想定のテストです");
    },
  });
}

function makeStaticSource(libraries: Library[]): StaticLibraryDataSource {
  return new StaticLibraryDataSource({
    fetchFn: async () =>
      new Response(JSON.stringify(libraries), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });
}

describe("LibraryRepositoryImpl", () => {
  describe("getLibraries", () => {
    // #158: カーリル /library をランタイムで呼ぶのではなく、ビルド時に
    // 生成した静的JSON（StaticLibraryDataSource 経由）から返す。
    // カーリルの利用制限を消費しないことがこの変更の目的。
    const library: Library = {
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
      url: "https://example.com",
      tel: "03-1234-5678",
      geocode: "139.7454,35.6586",
    };

    it("静的データソースから Library をそのまま返す（pref のみ指定）", async () => {
      const repo = new LibraryRepositoryImpl({
        apiClient: makeClient([]),
        staticLibraryDataSource: makeStaticSource([library]),
      });

      const libraries = await repo.getLibraries({ pref: "東京都" });

      expect(libraries).toHaveLength(1);
      expect(libraries[0]).toEqual(library);
    });

    it("city を指定するとクライアント側でフィルタする", async () => {
      const other: Library = { ...library, city: "渋谷区", libKey: "しぶや" };
      const repo = new LibraryRepositoryImpl({
        apiClient: makeClient([]),
        staticLibraryDataSource: makeStaticSource([library, other]),
      });

      const libraries = await repo.getLibraries({ pref: "東京都", city: "港区" });

      expect(libraries).toHaveLength(1);
      expect(libraries[0].city).toBe("港区");
    });

    it("city 未指定なら都道府県内の全件を返す", async () => {
      const other: Library = { ...library, city: "渋谷区", libKey: "しぶや" };
      const repo = new LibraryRepositoryImpl({
        apiClient: makeClient([]),
        staticLibraryDataSource: makeStaticSource([library, other]),
      });

      const libraries = await repo.getLibraries({ pref: "東京都" });

      expect(libraries).toHaveLength(2);
    });
  });

  describe("checkBookAvailability", () => {
    // #158 の変更後も無変更であることの回帰確認（getLibraries とは独立した
    // 依存＝CalilApiClient のみを使う。認証必須の蔵書検索フローに影響が
    // 無いことを保証する）。
    it("converts CheckResponse to BookAvailability domain models", async () => {
      const apiClient = makeClient({
        session: "abc123",
        continue: 0,
        books: {
          "9784774142230": {
            Tokyo_Minato: {
              status: "OK",
              reserveurl: "https://example.com/reserve",
              libkey: {
                みなと: "貸出可",
                三田: "貸出中",
              },
            },
          },
        },
      });
      const repo = new LibraryRepositoryImpl({
        apiClient,
        staticLibraryDataSource: unusedStaticSource(),
      });

      const results = await repo.checkBookAvailability({
        isbn: ["9784774142230"],
        systemIds: ["Tokyo_Minato"],
      });

      expect(results).toHaveLength(1);
      const availability = results[0];
      expect(availability.isbn).toBe("9784774142230");

      const libraryStatus = availability.libraryStatuses["Tokyo_Minato"];
      expect(libraryStatus.systemId).toBe("Tokyo_Minato");
      expect(libraryStatus.reserveUrl).toBe("https://example.com/reserve");
      expect(libraryStatus.libKeyStatuses).toEqual({
        みなと: "貸出可",
        三田: "貸出中",
      });
      // Aggregated: available (貸出可) has higher priority than checkedOut (貸出中)
      expect(libraryStatus.status).toBe(AvailabilityStatus.available);
    });

    it("maps a system-level Error status to AvailabilityStatus.error", async () => {
      // カーリルはシステム側の検索失敗時に status: "Error"（libkey 空）を返す。
      // 蔵書なし(notFound)ではなく error として扱う。
      const apiClient = makeClient({
        session: "abc123",
        continue: 0,
        books: {
          "9784774142230": {
            Tokyo_Minato: {
              status: "Error",
              reserveurl: "",
            },
          },
        },
      });
      const repo = new LibraryRepositoryImpl({
        apiClient,
        staticLibraryDataSource: unusedStaticSource(),
      });

      const results = await repo.checkBookAvailability({
        isbn: ["9784774142230"],
        systemIds: ["Tokyo_Minato"],
      });

      const libraryStatus = results[0].libraryStatuses["Tokyo_Minato"];
      expect(libraryStatus.status).toBe(AvailabilityStatus.error);
      expect(libraryStatus.libKeyStatuses).toEqual({});
    });

    it("aggregates statuses correctly with multiple libKeys", async () => {
      const apiClient = makeClient({
        session: "abc123",
        continue: 0,
        books: {
          "9784774142230": {
            Tokyo_Minato: {
              status: "OK",
              libkey: {
                みなと: "貸出中",
                三田: "蔵書なし",
              },
            },
          },
        },
      });
      const repo = new LibraryRepositoryImpl({
        apiClient,
        staticLibraryDataSource: unusedStaticSource(),
      });

      const results = await repo.checkBookAvailability({
        isbn: ["9784774142230"],
        systemIds: ["Tokyo_Minato"],
      });

      const libraryStatus = results[0].libraryStatuses["Tokyo_Minato"];
      // checkedOut (priority 6) > notFound (priority 2)
      expect(libraryStatus.status).toBe(AvailabilityStatus.checkedOut);
    });
  });
});
