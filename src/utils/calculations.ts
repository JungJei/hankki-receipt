import type { Ingredient, MealRecord } from '../types';
import { toBaseAmount } from './units';

export function calcPricePerUnit(ingredient: Ingredient): number {
  const baseQty = toBaseAmount(ingredient.totalQuantity, ingredient.unit);
  if (baseQty === 0) return 0;
  return ingredient.totalPrice / baseQty;
}

export function calcIngredientCost(ingredient: Ingredient, usedAmountInBase: number): number {
  return Math.round(calcPricePerUnit(ingredient) * usedAmountInBase);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayString(): string {
  const d = new Date();
  // 새벽 3시 이전은 전날로 취급
  if (d.getHours() < 3) {
    d.setDate(d.getDate() - 1);
  }
  return toLocalDateString(d);
}

export function getMealsByDate(meals: MealRecord[], dateStr: string): MealRecord[] {
  return meals.filter((m) => m.date === dateStr);
}

export function getMealsByDateRange(meals: MealRecord[], from: string, to: string): MealRecord[] {
  return meals.filter((m) => m.date >= from && m.date <= to);
}

export function getTotalCost(meals: MealRecord[]): number {
  return meals.reduce((sum, m) => sum + m.totalCost, 0);
}

export function getDailyTotal(meals: MealRecord[], dateStr: string): number {
  return getTotalCost(getMealsByDate(meals, dateStr));
}

function getWeekBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: toLocalDateString(mon),
    to: toLocalDateString(sun),
  };
}

function getMonthBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    from: toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: toLocalDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
}

export function getWeeklyTotal(meals: MealRecord[], dateStr: string): number {
  const { from, to } = getWeekBounds(dateStr);
  return getTotalCost(getMealsByDateRange(meals, from, to));
}

export function getMonthlyTotal(meals: MealRecord[], dateStr: string): number {
  const { from, to } = getMonthBounds(dateStr);
  return getTotalCost(getMealsByDateRange(meals, from, to));
}

export function getPrevWeekTotal(meals: MealRecord[], dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return getWeeklyTotal(meals, toLocalDateString(d));
}

export function getPrevMonthTotal(meals: MealRecord[], dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() - 1);
  return getMonthlyTotal(meals, toLocalDateString(d));
}

export function getBudgetRatio(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.min(spent / budget, 1);
}

export function getBudgetStatus(spent: number, budget: number): 'safe' | 'warning' | 'over' {
  if (budget === 0) return 'safe';
  const r = spent / budget;
  if (r >= 1) return 'over';
  if (r >= 0.8) return 'warning';
  return 'safe';
}

export function getLast7Days(): string[] {
  const result: string[] = [];
  const today = getTodayString();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - i);
    result.push(toLocalDateString(d));
  }
  return result;
}

export function getLast30Days(): { date: string; label: string }[] {
  const result = [];
  const today = getTodayString();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - i);
    const date = toLocalDateString(d);
    result.push({ date, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }
  return result;
}

export function groupMealsByDate(meals: MealRecord[]): { date: string; meals: MealRecord[] }[] {
  const map = new Map<string, MealRecord[]>();
  const sorted = [...meals].sort((a, b) => b.date.localeCompare(a.date));
  for (const meal of sorted) {
    if (!map.has(meal.date)) map.set(meal.date, []);
    map.get(meal.date)!.push(meal);
  }
  return Array.from(map.entries()).map(([date, meals]) => ({
    date,
    meals: meals.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
  }));
}

export function formatDateKo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function formatMonthKo(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
