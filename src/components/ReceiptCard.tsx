import { useRef } from 'react';
import { Download, Share2 } from 'lucide-react';
import type { MealRecord } from '../types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI } from '../types';
import { formatCurrency, formatDateKo } from '../utils/calculations';

interface ReceiptCardProps {
  meal: MealRecord;
  onClose?: () => void;
  showActions?: boolean;
}

const RECEIPT_FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
const MONO_FONT = '"Courier New", Courier, monospace';

export default function ReceiptCard({ meal, showActions = true }: ReceiptCardProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const hasApprox = meal.ingredients.some((i) => i.isApprox);

  async function capturePng(): Promise<string | null> {
    if (!receiptRef.current) return null;
    const { toPng } = await import('html-to-image');
    return toPng(receiptRef.current, { pixelRatio: 2, cacheBust: true });
  }

  async function handleDownload() {
    try {
      const dataUrl = await capturePng();
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `한끼영수증_${meal.date}_${meal.menuName}.png`;
      a.click();
    } catch (e) {
      console.error('Download failed', e);
    }
  }

  async function handleShare() {
    try {
      const dataUrl = await capturePng();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `한끼영수증_${meal.menuName}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `한끼 영수증 - ${meal.menuName}` });
      } else {
        handleDownload();
      }
    } catch (e) {
      handleDownload();
    }
  }

  const mealTimeLabel = meal.time
    ?? (meal.mealType ? `${MEAL_TYPE_EMOJI[meal.mealType]} ${MEAL_TYPE_LABELS[meal.mealType]}` : '');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Receipt paper */}
      <div
        ref={receiptRef}
        className="w-full max-w-xs"
        style={{ backgroundColor: '#FEFDFB', fontFamily: RECEIPT_FONT }}
      >
        {/* Torn top edge */}
        <div
          className="w-full"
          style={{
            height: 20,
            background: [
              'linear-gradient(135deg, #F8F4EF 33.33%, transparent 33.33%) -14px 0',
              'linear-gradient(225deg, #F8F4EF 33.33%, transparent 33.33%) -14px 0',
              'linear-gradient(315deg, #F8F4EF 33.33%, transparent 33.33%)',
              'linear-gradient( 45deg, #F8F4EF 33.33%, transparent 33.33%)',
            ].join(', '),
            backgroundSize: '28px 20px',
            backgroundColor: '#FEFDFB',
          }}
        />

        <div style={{ padding: '0 24px' }}>

          {/* ── 헤더 ── */}
          <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.28em', color: '#9CA3AF', marginBottom: 8 }}>
              ✦ HANKKI RECEIPT ✦
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
              한끼 영수증
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>
              {formatDateKo(meal.date)}
            </div>
            {mealTimeLabel && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{mealTimeLabel}</div>
            )}
          </div>

          {/* ── 구분선 ── */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '4px 0 12px' }} />

          {/* ── 메뉴명 ── */}
          <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.15em', marginBottom: 6 }}>ORDER</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{meal.menuName}</div>
          </div>

          {/* ── 구분선 ── */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '4px 0 10px' }} />

          {/* ── 재료 헤더 ── */}
          <div style={{ display: 'flex', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ flex: 1 }}>재료</span>
            <span style={{ width: 52, textAlign: 'right' }}>수량</span>
            <span style={{ width: 68, textAlign: 'right' }}>금액</span>
          </div>

          {/* ── 재료 목록 ── */}
          <div style={{ minHeight: 32 }}>
            {meal.ingredients.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '12px 0' }}>
                재료 기록 없음
              </div>
            ) : (
              meal.ingredients.map((ing, i) => {
                const qtyLabel = ing.unit !== ing.displayAmount
                  ? `${ing.displayAmount} ${ing.unit}`
                  : ing.displayAmount;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', padding: '3px 0', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#374151', wordBreak: 'keep-all' }}>{ing.ingredientName}</span>
                    <span style={{ width: 52, textAlign: 'right', color: '#9CA3AF', fontSize: 11, fontFamily: MONO_FONT }}>
                      {qtyLabel}
                    </span>
                    <span style={{ width: 68, textAlign: 'right', color: '#1F2937', fontFamily: MONO_FONT, fontWeight: 600 }}>
                      {ing.isApprox ? '≈' : ''}{formatCurrency(ing.cost)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* ── 소계 구분선 ── */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '10px 0 8px' }} />

          {/* ── 합계 ── */}
          <div style={{ padding: '6px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>합계</span>
              <span style={{ fontFamily: MONO_FONT, fontWeight: 800, fontSize: 22, color: '#E8572A' }}>
                {hasApprox ? '≈ ' : ''}{formatCurrency(meal.totalCost)}
              </span>
            </div>
          </div>

          {hasApprox && (
            <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginBottom: 4 }}>
              ※ 일부 재료는 대략적인 금액입니다
            </div>
          )}

          {/* ── 이중선 ── */}
          <div style={{ borderTop: '3px double #374151', margin: '6px 0 16px' }} />

          {/* ── 푸터 ── */}
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14, fontFamily: MONO_FONT }}>
              {new Date(meal.createdAt).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
            {/* 바코드 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 1.5, marginBottom: 8 }} aria-hidden>
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#1F2937',
                    width: i % 5 === 0 ? 3.5 : i % 3 === 0 ? 2.5 : 1.5,
                    height: 36,
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>
              한끼 영수증
            </div>
          </div>

        </div>

        {/* Torn bottom edge */}
        <div
          className="w-full"
          style={{
            height: 20,
            background: [
              'linear-gradient(135deg, #FEFDFB 33.33%, transparent 33.33%) -14px 0',
              'linear-gradient(225deg, #FEFDFB 33.33%, transparent 33.33%) -14px 0',
              'linear-gradient(315deg, #FEFDFB 33.33%, transparent 33.33%)',
              'linear-gradient( 45deg, #FEFDFB 33.33%, transparent 33.33%)',
            ].join(', '),
            backgroundSize: '28px 20px',
            backgroundColor: '#F8F4EF',
          }}
        />
      </div>

      {/* 액션 버튼 */}
      {showActions && (
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
          >
            <Download size={16} />
            이미지 저장
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-receipt-border text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Share2 size={16} />
            공유
          </button>
        </div>
      )}
    </div>
  );
}
