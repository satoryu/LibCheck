import { beforeEach, describe, expect, it } from "vitest";
import { WebLocalStorageRepository } from "@/data/repositories/localStorageRepositoryImpl";

describe("WebLocalStorageRepository", () => {
  let repository: WebLocalStorageRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repository = new WebLocalStorageRepository(window.localStorage);
  });

  it("stores and retrieves a string value", async () => {
    await repository.setString("key", "hello");
    expect(await repository.getString("key")).toBe("hello");
  });

  it("stores and retrieves a string list", async () => {
    await repository.setStringList("libs", ["lib1", "lib2", "lib3"]);
    expect(await repository.getStringList("libs")).toEqual([
      "lib1",
      "lib2",
      "lib3",
    ]);
  });

  it("removes an existing string value", async () => {
    await repository.setString("key", "value");
    await repository.remove("key");
    expect(await repository.getString("key")).toBeNull();
  });
});
