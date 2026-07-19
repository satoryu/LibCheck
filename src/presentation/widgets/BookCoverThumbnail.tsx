import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { amazonCoverImageUrl } from '@/domain/utils/amazonUrls';

export interface BookCoverThumbnailProps {
  isbn: string;
  /** OpenBD 提供の書影URL（Amazon 書影が読み込めない場合のフォールバック）。 */
  openBdCoverUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * 書影サムネイル（#141 で BookMetadataCard から共通化）。
 *
 * 書影は Amazon → OpenBD → プレースホルダの順でフォールバックする。
 * Amazon は書影が無い場合に 1x1 のグレー画像を返すため、極小サイズも失敗扱い。
 */
export function BookCoverThumbnail({
  isbn,
  openBdCoverUrl,
  width = 44,
  height = 62,
  alt,
}: BookCoverThumbnailProps): JSX.Element {
  const coverCandidates = useMemo(() => {
    const candidates: string[] = [];
    const amazon = amazonCoverImageUrl(isbn);
    if (amazon !== null) candidates.push(amazon);
    if (openBdCoverUrl !== undefined && openBdCoverUrl.length > 0) {
      candidates.push(openBdCoverUrl);
    }
    return candidates;
  }, [isbn, openBdCoverUrl]);

  const [coverIndex, setCoverIndex] = useState(0);
  // 候補が変わったら先頭から試行し直す。
  useEffect(() => {
    setCoverIndex(0);
  }, [coverCandidates]);

  const currentCover =
    coverIndex < coverCandidates.length ? coverCandidates[coverIndex] : null;

  const advanceCover = (): void => {
    setCoverIndex((i) => i + 1);
  };

  if (currentCover === null) {
    return (
      <Box
        data-testid="book-cover-placeholder"
        sx={{
          width,
          height,
          borderRadius: 1,
          backgroundColor: '#EEEEEE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MenuBookIcon sx={{ fontSize: width * 0.42, color: 'grey.500' }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      data-testid="book-cover"
      src={currentCover}
      alt={alt ?? '書影'}
      loading="lazy"
      onError={advanceCover}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 1) advanceCover();
      }}
      sx={{
        width,
        height: 'auto',
        maxHeight: height,
        objectFit: 'contain',
        borderRadius: 1,
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}
