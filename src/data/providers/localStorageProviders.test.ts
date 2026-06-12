import { describe, expect, it } from "vitest";
import { createDefaultDependencies } from "@/app/dependencies";
import { WebLocalStorageRepository } from "@/data/repositories/localStorageRepositoryImpl";

// Web analog of `local_storage_providers_test.dart`.
// In the Riverpod app, `localStorageRepositoryProvider` resolved to a
// `SharedPreferencesLocalStorageRepository`. The React DI container
// (`createDefaultDependencies`) provides the web-backed equivalent.
describe("local storage dependency", () => {
  it("createDefaultDependencies provides a WebLocalStorageRepository", () => {
    const deps = createDefaultDependencies();

    expect(deps.localStorageRepository).toBeInstanceOf(
      WebLocalStorageRepository,
    );
  });

  it("the provided repository behaves as a LocalStorageRepository", async () => {
    window.localStorage.clear();
    const deps = createDefaultDependencies();

    await deps.localStorageRepository.setString("k", "v");
    expect(await deps.localStorageRepository.getString("k")).toBe("v");
  });
});
