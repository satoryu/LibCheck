// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { selectTrialSystems } from './trialTargets.js';

function lib(systemId: string, category: string, name = `${systemId}-${category}`) {
  return { systemId, category, formalName: name, libKey: name, libId: name, city: '野洲市' };
}

describe('selectTrialSystems', () => {
  it('1システムの市区町村は全館を対象にする', () => {
    const libs = [lib('Shiga_Yasu', 'MEDIUM', 'A'), lib('Shiga_Yasu', 'MEDIUM', 'B')];

    expect(selectTrialSystems(libs, 5)).toEqual({
      systemIds: ['Shiga_Yasu'],
      libraries: libs,
      omittedLibraryCount: 0,
    });
  });

  it('公共図書館のシステムを大学・専門より優先する', () => {
    const libs = [
      lib('Special_X', 'SPECIAL'),
      lib('Univ_Y', 'UNIV'),
      lib('Public_A', 'MEDIUM'),
      lib('Public_B', 'BM'),
    ];

    expect(selectTrialSystems(libs, 3).systemIds).toEqual(['Public_A', 'Public_B', 'Univ_Y']);
  });

  it('上限を超えたシステムの館は対象外にし、館数を返す', () => {
    const libs = [
      lib('Public_A', 'LARGE'),
      lib('Public_A', 'SMALL', 'A2'),
      lib('Univ_1', 'UNIV'),
      lib('Univ_2', 'UNIV'),
      lib('Univ_2', 'UNIV', 'U2b'),
    ];

    const result = selectTrialSystems(libs, 2);

    expect(result.systemIds).toEqual(['Public_A', 'Univ_1']);
    expect(result.libraries.map((l) => l.systemId)).toEqual(['Public_A', 'Public_A', 'Univ_1']);
    expect(result.omittedLibraryCount).toBe(2);
  });

  it('同じ優先度の中ではデータの並び順を保つ', () => {
    const libs = [lib('Univ_2', 'UNIV'), lib('Univ_1', 'UNIV')];

    expect(selectTrialSystems(libs, 5).systemIds).toEqual(['Univ_2', 'Univ_1']);
  });
});
