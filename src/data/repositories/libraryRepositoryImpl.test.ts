import { describe, expect, it } from "vitest";
import { CalilApiClient } from "@/data/datasources/calilApiClient";
import { LibraryRepositoryImpl } from "@/data/repositories/libraryRepositoryImpl";
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

describe("LibraryRepositoryImpl", () => {
  describe("getLibraries", () => {
    it("converts LibraryResponse DTOs to Library domain models", async () => {
      const apiClient = makeClient([
        {
          systemid: "Tokyo_Minato",
          systemname: "港区図書館",
          libkey: "みなと",
          libid: "123",
          short: "みなと図書館",
          formal: "港区立みなと図書館",
          url_pc: "https://example.com",
          address: "東京都港区芝公園3-2-25",
          pref: "東京都",
          city: "港区",
          tel: "03-1234-5678",
          geocode: "139.7454,35.6586",
          category: "MEDIUM",
        },
      ]);
      const repo = new LibraryRepositoryImpl({ apiClient });

      const libraries = await repo.getLibraries({ pref: "東京都" });

      expect(libraries).toHaveLength(1);
      const lib = libraries[0];
      expect(lib.systemId).toBe("Tokyo_Minato");
      expect(lib.systemName).toBe("港区図書館");
      expect(lib.formalName).toBe("港区立みなと図書館");
      expect(lib.url).toBe("https://example.com");
      expect(lib.tel).toBe("03-1234-5678");
      expect(lib.geocode).toBe("139.7454,35.6586");
    });
  });

  describe("checkBookAvailability", () => {
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
      const repo = new LibraryRepositoryImpl({ apiClient });

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
      const repo = new LibraryRepositoryImpl({ apiClient });

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
