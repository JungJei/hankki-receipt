import { TrendingUp, TrendingDown, Minus, ChefHat, Wallet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  formatCurrency, getWeeklyTotal, getMonthlyTotal,
  getPrevWeekTotal, getPrevMonthTotal, getBudgetRatio, getBudgetStatus,
  getLast7Days, groupMealsByDate, formatDateKo,
} from '../utils/calculations';
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI } from '../types';

function BudgetBar({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const ratio = getBudgetRatio(spent, budget);
  const status = getBudgetStatus(spent, budget);
  const color = status === 'over' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-brand-500';

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs text-gray-500">
          {formatCurrency(spent)}{budget > 0 ? ` / ${formatCurrency(budget)}` : ''}
        </span>
      </div>
      {budget > 0 ? (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      ) : (
        <div className="w-full h-2 bg-gray-100 rounded-full" />
      )}
    </div>
  );
}

function MiniMealCard({ meal }: { meal: import('../types').MealRecord }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-xl border border-receipt-border">
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {meal.mealKind === 'delivery' ? '🛵' : meal.time ? '🍳' : MEAL_TYPE_EMOJI[meal.mealType ?? 'lunch']}
        </span>
        <div>
          <div className="text-sm font-semibold text-gray-800">{meal.menuName}</div>
          <div className="text-xs text-gray-400">
            {meal.mealKind === 'delivery'
              ? `배달/외식${meal.time ? ` · ${meal.time}` : ''}`
              : meal.time ?? MEAL_TYPE_LABELS[meal.mealType ?? 'lunch']}
          </div>
        </div>
      </div>
      <div className="text-sm font-bold text-brand-500 font-receipt">{formatCurrency(meal.totalCost)}</div>
    </div>
  );
}

function ChangeIndicator({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null;
  const diff = current - prev;
  const pct = Math.abs(Math.round((diff / prev) * 100));
  if (diff > 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs"><TrendingUp size={12} />+{pct}%</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-green-600 text-xs"><TrendingDown size={12} />-{pct}%</span>;
  return <span className="flex items-center gap-0.5 text-gray-400 text-xs"><Minus size={12} />동일</span>;
}

export default function Home({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { state, today } = useApp();
  const { meals, budget } = state;

  const dailyTotal = meals.filter((m) => m.date === today).reduce((s, m) => s + m.totalCost, 0);
  const weeklyTotal = getWeeklyTotal(meals, today);
  const monthlyTotal = getMonthlyTotal(meals, today);
  const prevWeekTotal = getPrevWeekTotal(meals, today);
  const prevMonthTotal = getPrevMonthTotal(meals, today);

  const todayMeals = meals.filter((m) => m.date === today)
    .sort((a, b) => {
      const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
      return (order[a.mealType ?? 'lunch'] ?? 1) - (order[b.mealType ?? 'lunch'] ?? 1);
    });

  const last7 = getLast7Days();
  const last7Totals = last7.map((d) => ({ date: d, total: meals.filter((m) => m.date === d).reduce((s, m) => s + m.totalCost, 0) }));
  const maxDay = Math.max(...last7Totals.map((d) => d.total), 1);

  const recentGroups = groupMealsByDate(meals).slice(0, 3);

  const d = new Date(today + 'T00:00:00');
  const dateLabel = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  return (
    <div className="space-y-4 pb-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white shadow-receipt">
        <div className="text-sm opacity-80 mb-1">{dateLabel} {dayNames[d.getDay()]}</div>
        <div className="text-2xl font-bold mb-3">오늘 식비</div>
        <div className="text-4xl font-bold font-receipt mb-1">{formatCurrency(dailyTotal)}</div>
        {budget.monthly > 0 && (
          <div className="text-sm opacity-80">
            이번 달 예산 {formatCurrency(budget.monthly)}의{' '}
            {Math.round(getBudgetRatio(monthlyTotal, budget.monthly) * 100)}%
          </div>
        )}
        {todayMeals.length === 0 && (
          <button
            onClick={() => onNavigate('meals')}
            className="mt-3 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <ChefHat size={14} /> 첫 식사 기록하기
          </button>
        )}
      </div>

      {/* Budget bars */}
      <div className="bg-white rounded-2xl p-4 shadow-receipt space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Wallet size={15} className="text-brand-500" /> 예산 현황
          </span>
          <button
            onClick={() => onNavigate('stats')}
            className="text-xs text-brand-500 hover:underline"
          >
            설정
          </button>
        </div>
        <BudgetBar label="이번 주" spent={weeklyTotal} budget={budget.weekly} />
        <BudgetBar label="이번 달" spent={monthlyTotal} budget={budget.monthly} />
      </div>

      {/* Week mini chart */}
      <div className="bg-white rounded-2xl p-4 shadow-receipt">
        <div className="text-sm font-semibold text-gray-700 mb-3">최근 7일 식비</div>
        <div className="flex items-end gap-1.5 h-16">
          {last7Totals.map((d) => {
            const h = d.total === 0 ? 4 : Math.max(8, Math.round((d.total / maxDay) * 56));
            const isToday = d.date === today;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm ${isToday ? 'bg-brand-500' : 'bg-brand-200'}`}
                  style={{ height: h }}
                />
                <div className={`text-xs ${isToday ? 'text-brand-500 font-bold' : 'text-gray-400'}`}>
                  {new Date(d.date + 'T00:00:00').getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>주간 합계</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{formatCurrency(weeklyTotal)}</span>
            <ChangeIndicator current={weeklyTotal} prev={prevWeekTotal} />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>월간 합계</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{formatCurrency(monthlyTotal)}</span>
            <ChangeIndicator current={monthlyTotal} prev={prevMonthTotal} />
          </div>
        </div>
      </div>

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-receipt">
          <div className="text-sm font-semibold text-gray-700 mb-3">오늘의 식사</div>
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <MiniMealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      )}

      {/* Recent history */}
      {recentGroups.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-receipt">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">최근 기록</span>
            <button onClick={() => onNavigate('meals')} className="text-xs text-brand-500 hover:underline">전체 보기</button>
          </div>
          <div className="space-y-3">
            {recentGroups.map(({ date, meals: dayMeals }) => (
              <div key={date}>
                <div className="text-xs text-gray-400 mb-1.5 flex justify-between">
                  <span>{formatDateKo(date)}</span>
                  <span className="font-receipt font-semibold text-gray-600">
                    {formatCurrency(dayMeals.reduce((s, m) => s + m.totalCost, 0))}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayMeals.map((meal) => (
                    <MiniMealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meals.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ChefHat size={40} className="mx-auto mb-2 opacity-30" />
          <div className="text-sm">아직 기록된 식사가 없어요</div>
          <div className="text-xs mt-1">식재료를 먼저 등록하고 식사를 기록해보세요!</div>
        </div>
      )}
    </div>
  );
}
