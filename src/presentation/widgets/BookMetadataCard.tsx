import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { amazonCoverImageUrl, amazonProductUrl } from '@/domain/utils/amazonUrls';
import { AMAZON_ASSOCIATE_TAG } from '@/presentation/config/amazonAffiliate';

export interface BookMetadataCardProps {
  isbn: string;
  title?: string;
  /** OpenBD 提供の書影URL（Amazon 書影が読み込めない場合のフォールバック）。 */
  openBdCoverUrl?: string;
  /** タイトル取得中はスケルトンを表示する。 */
  isLoadingTitle?: boolean;
  /**
   * Amazon アソシエイトタグ。既定はビルド時設定値（ローカルは空＝通常リンク）。
   * 設定されている場合はリンクに `tag=` を付与し、規約に基づく開示文を表示する。
   */
  associateTag?: string;
}

const COVER_WIDTH = 96;
const COVER_HEIGHT = 136;

/**
 * 検索結果画面に表示する書籍情報カード。書影・タイトル・Amazon リンクを表示する。
 *
 * 書影URL・購入リンクは ISBN から純粋に導出するため、タイトル（OpenBD 由来）が
 * 未取得でも表示できる。書影は Amazon → OpenBD → プレースホルダの順でフォールバック。
 */
export function BookMetadataCard({
  isbn,
  title,
  openBdCoverUrl,
  isLoadingTitle = false,
  associateTag = AMAZON_ASSOCIATE_TAG,
}: BookMetadataCardProps): JSX.Element {
  const productUrl = amazonProductUrl(isbn, associateTag);
  const showAffiliateDisclosure = associateTag.trim().length > 0;

  // 試行する書影URL候補（Amazon 優先、無ければ OpenBD）。
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

  const coverArea =
    currentCover !== null ? (
      <Box
        component="img"
        data-testid="book-cover"
        src={currentCover}
        alt={title ?? '書影'}
        loading="lazy"
        onError={advanceCover}
        // Amazon は書影が無い場合に 1x1 のグレー画像を返すため、極小サイズも失敗扱い。
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth <= 1) advanceCover();
        }}
        sx={{
          width: COVER_WIDTH,
          height: 'auto',
          maxHeight: COVER_HEIGHT,
          objectFit: 'contain',
          borderRadius: 1,
          display: 'block',
        }}
      />
    ) : (
      <Box
        data-testid="book-cover-placeholder"
        sx={{
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
          borderRadius: 1,
          backgroundColor: '#EEEEEE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MenuBookIcon sx={{ fontSize: 40, color: 'grey.500' }} />
      </Box>
    );

  const titleArea = isLoadingTitle ? (
    <Skeleton data-testid="book-title-skeleton" variant="text" width="80%" height={28} />
  ) : title !== undefined && title.length > 0 ? (
    <Typography variant="subtitle1">{title}</Typography>
  ) : (
    <Typography variant="body2" color="text.secondary">
      タイトル情報を取得できませんでした
    </Typography>
  );

  return (
    <Card sx={{ my: 1 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flexShrink: 0 }}>{coverArea}</Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            minWidth: 0,
          }}
        >
          {titleArea}
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 1.5 }}
          >
            Amazonで見る
          </Button>
          {showAffiliateDisclosure && (
            <Typography
              data-testid="affiliate-disclosure"
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              ※Amazonのアソシエイトとして、LibCheckは適格販売により収入を得ています。
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
}
