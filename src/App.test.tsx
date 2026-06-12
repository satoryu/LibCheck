import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import type { Library } from '@/domain/models/library';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';

/**
 * Port of `test/app_test.dart`.
 *
 * Flutter test: 「図書館未登録時は登録図書館画面を表示する」
 * Renders the app at '/' with no registered libraries and expects the
 * library-management screen (登録図書館) to be shown via the empty-library
 * redirect.
 */

/** RegisteredLibraryRepository that always reports an empty registration list. */
class EmptyRegisteredLibraryRepository implements RegisteredLibraryRepository {
  async getAll(): Promise<Library[]> {
    return [];
  }
  async saveAll(): Promise<void> {}
  async add(): Promise<Library[]> {
    return [];
  }
  async addAll(): Promise<Library[]> {
    return [];
  }
  async remove(): Promise<Library[]> {
    return [];
  }
}

describe('LibCheckApp', () => {
  it('図書館未登録時は登録図書館画面を表示する', async () => {
    const deps = makeFakeDeps({
      registeredLibraryRepository: new EmptyRegisteredLibraryRepository(),
    });

    renderRouteWithProviders('/', { deps });

    await waitFor(() => {
      expect(screen.getByText('登録図書館')).toBeInTheDocument();
    });
  });
});
