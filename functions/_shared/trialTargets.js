/**
 * 体験版（#183）で問い合わせる図書館システムを選ぶ。
 *
 * 1回の体験で消費する書籍リクエストは「ISBN 1件 × システム数」。市区町村に
 * よっては大学・専門図書館を含め数十システムある（千代田区は46）ため上限を設け、
 * 利用者が借りに行く可能性の高い公共図書館のシステムを優先する。
 */

/** 公共図書館（移動図書館を含む）のカテゴリ。最優先。 */
const PUBLIC_CATEGORIES = new Set(['LARGE', 'MEDIUM', 'SMALL', 'BM']);
/** 大学図書館。公共の次。専門図書館（SPECIAL）等はその後。 */
const UNIVERSITY_CATEGORY = 'UNIV';

/**
 * @param cityLibraries 市区町村の図書館（静的データの並び順）
 * @param maxSystems 問い合わせるシステム数の上限
 * @returns {{systemIds: string[], libraries: object[], omittedLibraryCount: number}}
 */
export function selectTrialSystems(cityLibraries, maxSystems) {
  const rank = (library) => {
    if (PUBLIC_CATEGORIES.has(library.category)) return 0;
    return library.category === UNIVERSITY_CATEGORY ? 1 : 2;
  };

  const ordered = [];
  for (const priority of [0, 1, 2]) {
    for (const library of cityLibraries) {
      if (rank(library) === priority && !ordered.includes(library.systemId)) {
        ordered.push(library.systemId);
      }
    }
  }

  const systemIds = ordered.slice(0, maxSystems);
  const selected = new Set(systemIds);
  const libraries = cityLibraries.filter((library) => selected.has(library.systemId));
  return {
    systemIds,
    libraries,
    omittedLibraryCount: cityLibraries.length - libraries.length,
  };
}
