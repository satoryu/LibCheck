import { describe, expect, it } from 'vitest';
import { availabilityToHistoryStatuses } from '@/presentation/utils/availabilityToHistoryStatuses';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';

function createLibrary(args: { systemId: string; libKey: string }): Library {
  return {
    systemId: args.systemId,
    systemName: 'テストシステム',
    libKey: args.libKey,
    libId: `${args.systemId}-${args.libKey}`,
    shortName: args.libKey,
    formalName: `${args.libKey}図書館`,
    address: '東京都千代田区',
    pref: '東京都',
    city: '千代田区',
    category: 'MEDIUM',
  };
}

describe('availabilityToHistoryStatuses', () => {
  it('maps each registered library to its status enum name keyed by libraryKey', () => {
    const chiyoda = createLibrary({ systemId: 'Tokyo_Chiyoda', libKey: '千代田' });
    const yonbancho = createLibrary({ systemId: 'Tokyo_Chiyoda', libKey: '四番町' });
    const result: BookAvailability = {
      isbn: '9784003101018',
      libraryStatuses: {
        Tokyo_Chiyoda: {
          systemId: 'Tokyo_Chiyoda',
          status: AvailabilityStatus.available,
          libKeyStatuses: { 千代田: '貸出可', 四番町: '貸出中' },
        },
      },
    };

    const statuses = availabilityToHistoryStatuses(result, [chiyoda, yonbancho]);

    expect(statuses).toEqual({
      [libraryKey(chiyoda)]: 'available',
      [libraryKey(yonbancho)]: 'checkedOut',
    });
  });

  it('skips libraries whose systemId is absent from the result', () => {
    const chiyoda = createLibrary({ systemId: 'Tokyo_Chiyoda', libKey: '千代田' });
    const mita = createLibrary({ systemId: 'Tokyo_Minato', libKey: '三田' });
    const result: BookAvailability = {
      isbn: '9784003101018',
      libraryStatuses: {
        Tokyo_Chiyoda: {
          systemId: 'Tokyo_Chiyoda',
          status: AvailabilityStatus.available,
          libKeyStatuses: { 千代田: '貸出可' },
        },
      },
    };

    const statuses = availabilityToHistoryStatuses(result, [chiyoda, mita]);
    expect(statuses).toEqual({ [libraryKey(chiyoda)]: 'available' });
  });
});
