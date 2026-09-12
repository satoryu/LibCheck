import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { trackAmazonAffiliateLinkClick } from '@/analytics/events';
import { amazonProductUrl } from '@/domain/utils/amazonUrls';
import { calilBookUrl } from '@/domain/utils/calilUrls';
import { AMAZON_ASSOCIATE_TAG } from '@/presentation/config/amazonAffiliate';
import { BookCoverThumbnail } from '@/presentation/widgets/BookCoverThumbnail';

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
  // カーリルAPI規約上必須のリンクバック（#156）。ISBN-10 を導出できない
  // （979 始まり）場合は仕様書に無い URL を推測せず、リンクを出さない。
  const calilUrl = calilBookUrl(isbn);

  // 書影は共通コンポーネント（Amazon → OpenBD → プレースホルダ。#141 で共通化）。
  const coverArea = (
    <BookCoverThumbnail
      isbn={isbn}
      openBdCoverUrl={openBdCoverUrl}
      width={COVER_WIDTH}
      height={COVER_HEIGHT}
      alt={title ?? '書影'}
    />
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
          {/* 幅の狭い端末では折り返して縦積みになるようにする。 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              // 収益化側の指標（#169）。ユーザー価値（図書館の予約）とは
              // 別イベントとして扱う。
              onClick={() => trackAmazonAffiliateLinkClick()}
            >
              Amazonで見る
            </Button>
            {calilUrl !== null && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={calilUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                カーリルで見る
              </Button>
            )}
          </Box>
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
