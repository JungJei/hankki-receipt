import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  formatCurrency, getDailyTotal, getWeeklyTotal, getMonthlyTotal,
  getPrevWeekTotal, getPrevMonthTotal, getLast7Days, getLast30Days,
  getBudgetStatus, getBudgetRatio, getTodayString, getMealsByDateRange,
  formatDateKo, groupMealsByDate,
} from '../utils/calculations';
import { MEAL_TYPE_EMOJI } from '../types';

// ── 커스텀 툴팁 ──────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-receipt-border rounded-xl px-3 py-2 shadow-receipt text-sm">
        <div className="text-gray-500 text-xs mb-0.5">{label}</div>
        <div className="font-bold font-receipt text-brand-500">{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
}

// ── 주간/월간 통합 비교 카드 ──────────────────────────────────
function PeriodCompareCard({
  weekCurrent, weekPrev, weekBudget,
  monthCurrent, monthPrev, monthBudget,
}: {
  weekCurrent: number; weekPrev: number; weekBudget: number;
  monthCurrent: number; monthPrev: number; monthBudget: number;
}) {
  const [tab, setTab] = useState<'week' | 'month'>('week');
  const current = tab === 'week' ? weekCurrent : monthCurrent;
  const prev    = tab === 'week' ? weekPrev    : monthPrev;
  const budget  = tab === 'week' ? weekBudget  : monthBudget;
  const period  = tab === 'week' ? '주' : '달';

  const diff = current - prev;
  const pct  = prev > 0 ? Math.abs(Math.round((diff / prev) * 100)) : 0;
  const status = getBudgetStatus(current, budget);
  const ratio  = getBudgetRatio(current, budget);

  return (
    <div className="bg-white rounded-2xl shadow-receipt overflow-hidden">
      {/* 탭 */}
      <div className="flex border-b border-receipt-border">
        {(['week', 'month'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'text-brand-500 border-b-2 border-brand-500 -mb-px' : 'text-gray-400'
            }`}
          >
            {t === 'week' ? '이번 주' : '이번 달'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* 현재 vs 이전 나란히 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-brand-50 rounded-xl p-3">
            <div className="text-xs text-brand-600 mb-1">이번 {period}</div>
            <div className="text-xl font-bold font-receipt text-brand-600">{formatCurrency(current)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">지난 {period}</div>
            <div className="text-xl font-bold font-receipt text-gray-500">
              {prev > 0 ? formatCurrency(prev) : '기록 없음'}
            </div>
          </div>
        </div>

        {/* 증감 */}
        {prev > 0 && (
          <div className={`flex items-center gap-2 mb-4 text-sm px-3 py-2 rounded-xl ${
            diff > 0 ? 'bg-red-50 text-red-600' : diff < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
          }`}>
            {diff > 0 ? <TrendingUp size={15} /> : diff < 0 ? <TrendingDown size={15} /> : <Minus size={15} />}
            <span>
              지난 {period} 대비{' '}
              <strong>{diff > 0 ? '+' : ''}{formatCurrency(diff)}</strong>
              {pct > 0 && <span className="ml-1 opacity-70">({diff > 0 ? '+' : '-'}{pct}%)</span>}
            </span>
          </div>
        )}

        {/* 예산 진행 */}
        {budget > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>예산 {formatCurrency(budget)}</span>
              <span className={
                status === 'over' ? 'text-red-500 font-medium' :
                status === 'warning' ? 'text-amber-500 font-medium' : 'text-green-600'
              }>
                {Math.round(ratio * 100)}%
                {status === 'over' ? ' 초과!' : status === 'warning' ? ' 주의' : ' 양호'}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  status === 'over' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                }`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 기간 영수증 ───────────────────────────────────────────────
const PR_FONT  = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
const PR_MONO  = '"Courier New", Courier, monospace';
const PR_W     = 288; // px — max-w-xs 고정폭 (html2canvas 일관성)

function PeriodReceipt({
  meals, from, to, label, budget,
}: {
  meals: import('../types').MealRecord[];
  from: string; to: string; label: string;
  budget?: number;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const rangeMeals = getMealsByDateRange(meals, from, to);
  const groups     = groupMealsByDate(rangeMeals);
  const total      = rangeMeals.reduce((s, m) => s + m.totalCost, 0);
  const hasApprox  = rangeMeals.some((m) => m.ingredients.some((i) => i.isApprox));
  const hasBudget  = (budget ?? 0) > 0;

  async function handleDownload() {
    if (!receiptRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = receiptRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: '#FEFDFB',
        scale: 2,
        useCORS: true,
        logging: false,
        width: PR_W,
        height: el.scrollHeight,
        windowWidth: PR_W,
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `한끼영수증_${label}_${from}~${to}.png`;
      a.click();
    } catch (e) { console.error(e); }
  }

  if (rangeMeals.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        해당 기간에 기록된 식사가 없어요
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* ── 영수증 본체 ── */}
      <div
        ref={receiptRef}
        style={{ width: PR_W, backgroundColor: '#FEFDFB', fontFamily: PR_FONT }}
      >
        {/* 찢긴 윗면 */}
        <div style={{
          width: '100%', height: 20,
          background: [
            'linear-gradient(135deg,#F8F4EF 33.33%,transparent 33.33%) -14px 0',
            'linear-gradient(225deg,#F8F4EF 33.33%,transparent 33.33%) -14px 0',
            'linear-gradient(315deg,#F8F4EF 33.33%,transparent 33.33%)',
            'linear-gradient( 45deg,#F8F4EF 33.33%,transparent 33.33%)',
          ].join(', '),
          backgroundSize: '28px 20px',
          backgroundColor: '#FEFDFB',
        }} />

        <div style={{ padding: '0 24px' }}>

          {/* 헤더 */}
          <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.28em', color: '#9CA3AF', marginBottom: 6 }}>
              ✦ HANKKI RECEIPT ✦
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              한끼 영수증
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '4px 0 10px' }} />

          {/* 기간 */}
          <div style={{ textAlign: 'center', padding: '2px 0 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, fontFamily: PR_MONO }}>
              {from} ~ {to}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '0 0 10px' }} />

          {/* 날짜별 내역 */}
          {groups.map(({ date, meals: dayMeals }) => {
            const dayTotal = dayMeals.reduce((s, m) => s + m.totalCost, 0);
            return (
              <div key={date} style={{ marginBottom: 10 }}>
                {/* 날짜 행 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{formatDateKo(date)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: PR_MONO }}>
                    {formatCurrency(dayTotal)}
                  </span>
                </div>
                {/* 식사 목록 */}
                {dayMeals.map((meal, i) => {
                  const emoji = meal.mealKind === 'delivery' ? '🛵' : meal.time ? '🍳' : (MEAL_TYPE_EMOJI[meal.mealType ?? 'lunch'] ?? '🍽️');
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '2px 0 2px 10px' }}>
                      <span style={{ fontSize: 12, color: '#6B7280', flex: 1, marginRight: 8, wordBreak: 'keep-all' }}>
                        {emoji} {meal.menuName}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontFamily: PR_MONO, flexShrink: 0 }}>
                        {meal.ingredients.some(ig => ig.isApprox) ? '≈' : ''}{formatCurrency(meal.totalCost)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 소계 구분선 */}
          <div style={{ borderTop: '1.5px dashed #D1D5DB', margin: '6px 0 8px' }} />

          {/* 합계 */}
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>합계</span>
              <span style={{ fontFamily: PR_MONO, fontWeight: 800, fontSize: 20, color: '#E8572A' }}>
                {hasApprox ? '≈ ' : ''}{formatCurrency(total)}
              </span>
            </div>
            {hasBudget && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#6B7280' }}>
                <span>예산</span>
                <span style={{ fontFamily: PR_MONO }}>{formatCurrency(budget!)}</span>
              </div>
            )}
            {hasBudget && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 12 }}>
                <span style={{ color: '#6B7280' }}>차액</span>
                <span style={{ fontFamily: PR_MONO, fontWeight: 700, color: total > budget! ? '#EF4444' : '#16A34A' }}>
                  {total > budget! ? '+' : ''}{formatCurrency(total - budget!)}
                </span>
              </div>
            )}
          </div>

          {hasApprox && (
            <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
              ※ 일부 재료는 대략적인 금액입니다
            </div>
          )}

          {/* 이중선 */}
          <div style={{ borderTop: '3px double #374151', margin: '8px 0 16px' }} />

          {/* 푸터 */}
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
              {rangeMeals.length}끼 · {groups.length}일 기록
            </div>
            {/* 바코드 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 1.5, marginBottom: 8 }} aria-hidden>
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} style={{
                  backgroundColor: '#1F2937',
                  width: i % 5 === 0 ? 3.5 : i % 3 === 0 ? 2.5 : 1.5,
                  height: 36,
                  borderRadius: 1,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.2em', marginTop: 6 }}>
              한끼 영수증
            </div>
          </div>

        </div>

        {/* 찢긴 아랫면 */}
        <div style={{
          width: '100%', height: 20,
          background: [
            'linear-gradient(135deg,#FEFDFB 33.33%,transparent 33.33%) -14px 0',
            'linear-gradient(225deg,#FEFDFB 33.33%,transparent 33.33%) -14px 0',
            'linear-gradient(315deg,#FEFDFB 33.33%,transparent 33.33%)',
            'linear-gradient( 45deg,#FEFDFB 33.33%,transparent 33.33%)',
          ].join(', '),
          backgroundSize: '28px 20px',
          backgroundColor: '#F8F4EF',
        }} />
      </div>

      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
      >
        이미지로 저장
      </button>
    </div>
  );
}

// ── 해먹기 vs 배달 비교 ───────────────────────────────────────
function MealKindStats({ meals }: { meals: import('../types').MealRecord[] }) {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const today = getTodayString();

  const filtered = (() => {
    if (period === 'week') {
      const r = getWeekRange(today);
      return getMealsByDateRange(meals, r.from, r.to);
    }
    if (period === 'month') {
      const r = getMonthRange(today);
      return getMealsByDateRange(meals, r.from, r.to);
    }
    return meals;
  })();

  const homemade = filtered.filter((m) => (m.mealKind ?? 'homemade') === 'homemade');
  const delivery = filtered.filter((m) => m.mealKind === 'delivery');

  const hmTotal = homemade.reduce((s, m) => s + m.totalCost, 0);
  const dlTotal = delivery.reduce((s, m) => s + m.totalCost, 0);
  const hmAvg = homemade.length ? Math.round(hmTotal / homemade.length) : 0;
  const dlAvg = delivery.length ? Math.round(dlTotal / delivery.length) : 0;
  const grandTotal = hmTotal + dlTotal;

  if (filtered.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-receipt overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-receipt-border flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">🍳 해먹기 vs 🛵 배달/외식</span>
        <div className="flex rounded-lg border border-receipt-border overflow-hidden text-xs">
          {([['week', '주'], ['month', '월'], ['all', '전체']] as [typeof period, string][]).map(([p, l]) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1.5 font-medium transition-colors ${period === p ? 'bg-brand-500 text-white' : 'bg-white text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 바 비교 */}
        {grandTotal > 0 && (
          <div>
            <div className="flex rounded-full overflow-hidden h-3 mb-1.5">
              <div
                className="bg-brand-500 transition-all"
                style={{ width: `${(hmTotal / grandTotal) * 100}%` }}
              />
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${(dlTotal / grandTotal) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />해먹기 {grandTotal > 0 ? Math.round((hmTotal / grandTotal) * 100) : 0}%</span>
              <span className="flex items-center gap-1">배달/외식 {grandTotal > 0 ? Math.round((dlTotal / grandTotal) * 100) : 0}%<span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /></span>
            </div>
          </div>
        )}

        {/* 수치 비교 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-50 rounded-xl p-3">
            <div className="text-xs text-brand-600 font-medium mb-2">🍳 해먹기</div>
            <div className="text-lg font-bold font-receipt text-brand-600">{formatCurrency(hmTotal)}</div>
            <div className="text-xs text-brand-400 mt-1">{homemade.length}끼 · 평균 {hmAvg > 0 ? formatCurrency(hmAvg) : '-'}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="text-xs text-amber-700 font-medium mb-2">🛵 배달/외식</div>
            <div className="text-lg font-bold font-receipt text-amber-600">{formatCurrency(dlTotal)}</div>
            <div className="text-xs text-amber-400 mt-1">{delivery.length}끼 · 평균 {dlAvg > 0 ? formatCurrency(dlAvg) : '-'}</div>
          </div>
        </div>

        {/* 절약 메시지 */}
        {hmAvg > 0 && dlAvg > 0 && (
          <div className={`text-xs px-3 py-2 rounded-xl ${dlAvg > hmAvg ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {dlAvg > hmAvg
              ? `해먹으면 1끼당 평균 ${formatCurrency(dlAvg - hmAvg)} 절약돼요 💚`
              : `이번엔 해먹기가 오히려 더 비쌌어요 😅`}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 예산 설정 폼 ──────────────────────────────────────────────
function BudgetEditor({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [monthly, setMonthly] = useState(String(state.budget.monthly || ''));

  const monthlyNum = parseInt(monthly) || 0;
  const autoWeekly = monthlyNum > 0 ? Math.round(monthlyNum * 7 / 30) : 0;

  function save(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'UPDATE_BUDGET', payload: { monthly: monthlyNum, weekly: autoWeekly } });
    onClose();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">월간 예산</label>
        <div className="relative">
          <input
            type="number" min="0"
            className="w-full border border-receipt-border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:border-brand-400"
            placeholder="0 (미설정)"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">주간 예산 (자동 계산)</span>
        <span className="text-sm font-semibold font-receipt text-gray-700">
          {autoWeekly > 0 ? formatCurrency(autoWeekly) : '미설정'}
        </span>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-receipt-border text-gray-600 text-sm font-medium hover:bg-gray-50">
          취소
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">
          저장
        </button>
      </div>
    </form>
  );
}

// ── 기간 선택기 (영수증용) ────────────────────────────────────
type PeriodPreset = 'week' | 'month' | 'custom';

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().split('T')[0],
    to: sun.toISOString().split('T')[0],
  };
}

function getMonthRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

// ── 메인 Stats 페이지 ─────────────────────────────────────────
export default function Stats() {
  const { state } = useApp();
  const { meals, budget } = state;
  const today = getTodayString();

  const [chartRange, setChartRange] = useState<'7' | '30'>('7');
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('week');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]   = useState(today);

  const weeklyTotal  = getWeeklyTotal(meals, today);
  const monthlyTotal = getMonthlyTotal(meals, today);
  const prevWeekTotal  = getPrevWeekTotal(meals, today);
  const prevMonthTotal = getPrevMonthTotal(meals, today);

  const chartData = chartRange === '7'
    ? getLast7Days().map((d) => ({
        label: `${new Date(d + 'T00:00:00').getMonth() + 1}/${new Date(d + 'T00:00:00').getDate()}`,
        cost: getDailyTotal(meals, d),
        isToday: d === today,
      }))
    : getLast30Days().map(({ date, label }) => ({
        label, cost: getDailyTotal(meals, date), isToday: date === today,
      }));

  const avgCost = (() => {
    const days = chartData.filter((d) => d.cost > 0);
    return days.length ? Math.round(days.reduce((s, d) => s + d.cost, 0) / days.length) : 0;
  })();

  // 기간 영수증 범위 계산
  const receiptRange = (() => {
    if (periodPreset === 'week') {
      const r = getWeekRange(today);
      return { ...r, label: '주간 결산', budgetAmt: budget.weekly };
    }
    if (periodPreset === 'month') {
      const r = getMonthRange(today);
      return { ...r, label: '월간 결산', budgetAmt: budget.monthly };
    }
    return { from: customFrom, to: customTo, label: '기간 결산', budgetAmt: 0 };
  })();

  return (
    <div className="space-y-4 pb-6">
      {/* 차트 */}
      <div className="bg-white rounded-2xl p-4 shadow-receipt">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">일별 식비</span>
          <div className="flex rounded-lg border border-receipt-border overflow-hidden text-xs">
            {(['7', '30'] as const).map((r) => (
              <button key={r} onClick={() => setChartRange(r)}
                className={`px-3 py-1.5 font-medium transition-colors ${chartRange === r ? 'bg-brand-500 text-white' : 'bg-white text-gray-600'}`}>
                {r}일
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={chartRange === '7' ? 28 : 8}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={chartRange === '30' ? 4 : 0} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '0' : `${Math.round(v / 1000)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,87,42,0.06)' }} />
            {avgCost > 0 && <ReferenceLine y={avgCost} stroke="#E8572A" strokeDasharray="3 3" strokeOpacity={0.5} />}
            <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isToday ? '#E8572A' : '#FFC5A8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {avgCost > 0 && (
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>평균: <span className="font-receipt text-gray-600">{formatCurrency(avgCost)}</span></span>
            <span>최대: <span className="font-receipt text-gray-600">{formatCurrency(Math.max(...chartData.map(d => d.cost)))}</span></span>
          </div>
        )}
      </div>

      {/* 주간/월간 통합 비교 */}
      <PeriodCompareCard
        weekCurrent={weeklyTotal}   weekPrev={prevWeekTotal}   weekBudget={budget.weekly}
        monthCurrent={monthlyTotal} monthPrev={prevMonthTotal} monthBudget={budget.monthly}
      />

      {/* 해먹기 vs 배달 비교 */}
      <MealKindStats meals={meals} />

      {/* 기간 영수증 */}
      <div className="bg-white rounded-2xl shadow-receipt overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-receipt-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-brand-500" />
            <span className="text-sm font-semibold text-gray-700">기간 영수증</span>
          </div>
          {/* 프리셋 버튼 */}
          <div className="flex gap-2 mb-3">
            {([['week', '이번 주'], ['month', '이번 달'], ['custom', '직접 설정']] as [PeriodPreset, string][]).map(([p, l]) => (
              <button key={p} onClick={() => setPeriodPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  periodPreset === p ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {l}
              </button>
            ))}
          </div>
          {/* 직접 설정 */}
          {periodPreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} max={today}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 border border-receipt-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-brand-400" />
              <span className="text-gray-400 text-xs">~</span>
              <input type="date" value={customTo} min={customFrom} max={today}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 border border-receipt-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-brand-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <PeriodReceipt
            key={`${receiptRange.from}-${receiptRange.to}`}
            meals={meals}
            from={receiptRange.from}
            to={receiptRange.to}
            label={receiptRange.label}
            budget={receiptRange.budgetAmt}
          />
        </div>
      </div>

      {/* 예산 설정 */}
      <div className="bg-white rounded-2xl shadow-receipt overflow-hidden">
        <button onClick={() => setShowBudgetEdit((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand-500" />
            <span className="text-sm font-semibold text-gray-700">예산 설정</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">월 {budget.monthly > 0 ? formatCurrency(budget.monthly) : '미설정'}</span>
            {showBudgetEdit ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>
        {showBudgetEdit && (
          <div className="border-t border-receipt-border px-4 py-4">
            <BudgetEditor onClose={() => setShowBudgetEdit(false)} />
          </div>
        )}
      </div>

      {/* TOP 5 */}
      {meals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-receipt">
          <div className="text-sm font-semibold text-gray-700 mb-3">비용이 높은 식사 TOP 5</div>
          <div className="space-y-2">
            {[...meals].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5).map((meal, i) => (
              <div key={meal.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">{meal.menuName}</div>
                  <div className="text-xs text-gray-400">{meal.date}</div>
                </div>
                <div className="text-sm font-bold font-receipt text-brand-500">{formatCurrency(meal.totalCost)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
