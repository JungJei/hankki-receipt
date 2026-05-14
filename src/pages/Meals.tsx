import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, Receipt, UtensilsCrossed, Edit2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import ReceiptCard from '../components/ReceiptCard';
import type { MealRecord, MealIngredient, MealKind } from '../types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJI } from '../types';
import { CASUAL_UNITS, isCasualUnit, casualToBaseAmount, toBaseAmount } from '../utils/units';
import { STANDARD_UNITS } from '../utils/units';
import { formatCurrency, formatDateKo, getTodayString, calcIngredientCost } from '../utils/calculations';

type AnyUnit = string;

interface MealFormIngredient {
  ingredientId: string;
  amount: string;
  unit: AnyUnit;
}

interface MealFormData {
  date: string;
  time: string;
  mealKind: MealKind;
  menuName: string;
  items: MealFormIngredient[];
  price: string;  // 배달/외식 수동 가격
  memo: string;
}

function getNowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getMealSortKey(meal: MealRecord): string {
  if (meal.time) return meal.time;
  const order: Record<string, string> = { breakfast: '08:00', lunch: '12:00', dinner: '19:00', snack: '15:00' };
  return order[meal.mealType ?? 'snack'] ?? '12:00';
}

function MealForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: MealRecord;
  onSave: (data: MealFormData) => void;
  onCancel: () => void;
}) {
  const { state } = useApp();
  const [form, setForm] = useState<MealFormData>(() => {
    if (initialData) {
      return {
        date: initialData.date,
        time: initialData.time ?? getNowTime(),
        mealKind: initialData.mealKind ?? 'homemade',
        menuName: initialData.menuName,
        items: initialData.ingredients.map((mi) => ({
          ingredientId: mi.ingredientId,
          amount: mi.displayAmount,
          unit: mi.unit,
        })),
        price: initialData.mealKind === 'delivery' ? String(initialData.totalCost) : '',
        memo: initialData.memo ?? '',
      };
    }
    return {
      date: getTodayString(),
      time: getNowTime(),
      mealKind: 'homemade',
      menuName: '',
      items: [],
      price: '',
      memo: '',
    };
  });

  const ingredients = state.ingredients;

  function addItem() {
    if (ingredients.length === 0) return;
    setForm((f) => ({
      ...f,
      items: [...f.items, { ingredientId: ingredients[0].id, amount: '', unit: ingredients[0].unitConversion?.unit ?? ingredients[0].unit }],
    }));
  }

  function removeItem(i: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  function updateItem(i: number, key: keyof MealFormIngredient, val: string) {
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], [key]: val };
      if (key === 'ingredientId') {
        const ing = ingredients.find((ig) => ig.id === val);
        if (ing) items[i].unit = ing.unitConversion?.unit ?? ing.unit;
      }
      return { ...f, items };
    });
  }

  function resolveBaseAmount(item: MealFormIngredient, ing: ReturnType<typeof ingredients.find> & object): number {
    if (isCasualUnit(item.unit)) return casualToBaseAmount(item.unit as any, ing.unit);
    const numAmt = parseFloat(item.amount);
    if (isNaN(numAmt)) return 0;
    if (ing.unitConversion && item.unit === ing.unitConversion.unit)
      return toBaseAmount(numAmt * ing.unitConversion.amount, ing.unit);
    return toBaseAmount(numAmt, item.unit as any);
  }

  function calcItemCost(item: MealFormIngredient): number {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    if (!ing) return 0;
    if (!isCasualUnit(item.unit) && !item.amount) return 0;
    return calcIngredientCost(ing, resolveBaseAmount(item, ing));
  }

  const totalCost = form.items.reduce((sum, item) => sum + calcItemCost(item), 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.menuName.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-medium text-gray-500 mb-1">날짜</label>
          <input
            type="date"
            className="w-full border border-receipt-border rounded-xl px-1.5 py-2 text-xs focus:outline-none focus:border-brand-400"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-medium text-gray-500 mb-1">시간</label>
          <input
            type="time"
            className="w-full border border-receipt-border rounded-xl px-1.5 py-2 text-xs focus:outline-none focus:border-brand-400"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          />
        </div>
      </div>

      {/* 식사 종류 toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, mealKind: 'homemade' }))}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
            form.mealKind === 'homemade'
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-500 border-receipt-border hover:bg-gray-50'
          }`}
        >
          🍳 해먹기
        </button>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, mealKind: 'delivery' }))}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
            form.mealKind === 'delivery'
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-500 border-receipt-border hover:bg-gray-50'
          }`}
        >
          🛵 배달/외식
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">메뉴명 *</label>
        <input
          className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
          placeholder="예: 된장찌개, 볶음밥, 샐러드..."
          value={form.menuName}
          onChange={(e) => setForm((f) => ({ ...f, menuName: e.target.value }))}
          required
        />
      </div>

      {/* 배달/외식: 금액 직접 입력 */}
      {form.mealKind === 'delivery' ? (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">금액 *</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="100"
              className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 pr-8"
              placeholder="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
          </div>
        </div>
      ) : (
        /* 해먹기: 재료 선택 */
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">사용한 재료</label>
            <button
              type="button"
              onClick={addItem}
              disabled={ingredients.length === 0}
              className="text-xs text-brand-500 hover:text-brand-600 disabled:opacity-40 flex items-center gap-1"
            >
              <Plus size={12} /> 재료 추가
            </button>
          </div>

          {ingredients.length === 0 && (
            <div className="text-xs text-gray-400 py-2 text-center bg-gray-50 rounded-xl">
              식재료를 먼저 등록해주세요
            </div>
          )}

          <div className="space-y-2">
            {form.items.map((item, i) => {
              const cost = calcItemCost(item);
              const casual = isCasualUnit(item.unit);
              return (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      className="flex-1 border border-receipt-border rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
                      value={item.ingredientId}
                      onChange={(e) => updateItem(i, 'ingredientId', e.target.value)}
                    >
                      {ingredients.map((ig) => {
                        const dateLabel = ig.purchaseDate.slice(5).replace('-', '/');
                        const remLabel = `${ig.remainingQuantity.toFixed(ig.remainingQuantity < 10 ? 1 : 0)}${ig.unit}`;
                        return (
                          <option key={ig.id} value={ig.id}>
                            {ig.name} ({dateLabel} 구입, {remLabel} 남음)
                          </option>
                        );
                      })}
                    </select>
                    <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const selIng = ingredients.find((ig) => ig.id === item.ingredientId);
                      return (
                        <select
                          className="w-16 shrink-0 border border-receipt-border rounded-lg px-1 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
                          value={item.unit}
                          onChange={(e) => updateItem(i, 'unit', e.target.value)}
                        >
                          {selIng?.unitConversion && (
                            <optgroup label="⭐ 개수 단위">
                              <option value={selIng.unitConversion.unit}>
                                {selIng.unitConversion.unit} (1{selIng.unitConversion.unit}={selIng.unitConversion.amount}{selIng.unit})
                              </option>
                            </optgroup>
                          )}
                          <optgroup label="표준 단위">
                            {STANDARD_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </optgroup>
                          <optgroup label="표현 단위">
                            {CASUAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </optgroup>
                        </select>
                      );
                    })()}
                    {casual ? (
                      <div className="w-20 shrink-0 px-2 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        ≈ 대략
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-20 shrink-0 border border-receipt-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
                        placeholder="수량"
                        value={item.amount}
                        onChange={(e) => updateItem(i, 'amount', e.target.value)}
                      />
                    )}
                    <div className="flex-1 min-w-0 text-xs font-receipt font-semibold text-brand-500 truncate">
                      {cost > 0 ? `= ~${formatCurrency(cost)}` : '= -'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          {form.items.length > 0 && (
            <div className="mt-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-brand-700">예상 총 비용</span>
              <span className="text-lg font-bold text-brand-600 font-receipt">{formatCurrency(totalCost)}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
        <input
          className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
          placeholder="맛있었다, 좀 짰다 등..."
          value={form.memo}
          onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-receipt-border text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          기록하기
        </button>
      </div>
    </form>
  );
}

function MealCard({
  meal,
  onDelete,
  onEdit,
  onViewReceipt,
}: {
  meal: MealRecord;
  onDelete: () => void;
  onEdit: () => void;
  onViewReceipt: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-receipt overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {meal.mealKind === 'delivery' ? '🛵' : meal.time ? '🍳' : MEAL_TYPE_EMOJI[meal.mealType ?? 'lunch']}
            </span>
            <div>
              <div className="font-semibold text-gray-800">{meal.menuName}</div>
              <div className="text-xs text-gray-400">
                {meal.mealKind === 'delivery'
                  ? `배달/외식${meal.time ? ` · ${meal.time}` : ''}`
                  : meal.time ?? MEAL_TYPE_LABELS[meal.mealType ?? 'lunch']}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-brand-500 font-receipt">{formatCurrency(meal.totalCost)}</div>
            {meal.ingredients.some((i) => i.isApprox) && (
              <div className="text-xs text-gray-400">≈ 대략적</div>
            )}
          </div>
        </div>

        {meal.ingredients.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-receipt-dash">
            <div className="space-y-1">
              {meal.ingredients.map((ing, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600">
                  <span>{ing.ingredientName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{ing.displayAmount}{!isCasualUnit(ing.unit) ? ing.unit : ' ' + ing.unit}</span>
                    <span className="font-receipt">{ing.isApprox ? '≈' : ''}{formatCurrency(ing.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {meal.memo && (
          <div className="mt-2 text-xs text-gray-400 italic">"{meal.memo}"</div>
        )}
      </div>

      <div className="flex border-t border-receipt-border">
        <button
          onClick={onViewReceipt}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Receipt size={13} /> 영수증
        </button>
        <div className="w-px bg-receipt-border" />
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-brand-500 hover:bg-brand-50 transition-colors"
        >
          <Edit2 size={13} /> 수정
        </button>
        <div className="w-px bg-receipt-border" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} /> 삭제
        </button>
      </div>
    </div>
  );
}

export default function Meals() {
  const { state, dispatch } = useApp();
  const [viewDate, setViewDate] = useState(getTodayString());
  const [showForm, setShowForm] = useState(false);
  const [editMeal, setEditMeal] = useState<MealRecord | null>(null);
  const [receiptMeal, setReceiptMeal] = useState<MealRecord | null>(null);

  const dayMeals = state.meals
    .filter((m) => m.date === viewDate)
    .sort((a, b) => getMealSortKey(a).localeCompare(getMealSortKey(b)));

  const dayTotal = dayMeals.reduce((s, m) => s + m.totalCost, 0);

  function localDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function prevDay() {
    const d = new Date(viewDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setViewDate(localDateString(d));
  }
  function nextDay() {
    const d = new Date(viewDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const today = getTodayString();
    const next = localDateString(d);
    if (next <= today) setViewDate(next);
  }
  const isToday = viewDate === getTodayString();

  function handleSave(data: MealFormData) {
    let ingredients: MealIngredient[] = [];
    let totalCost = 0;

    if (data.mealKind === 'delivery') {
      totalCost = parseFloat(data.price) || 0;
    } else {
      ingredients = data.items
        .map((item) => {
          const ing = state.ingredients.find((i) => i.id === item.ingredientId);
          if (!ing) return null;
          const casual = isCasualUnit(item.unit);
          let usedAmount: number;
          let displayAmount: string;
          let cost: number;

          if (casual) {
            usedAmount = casualToBaseAmount(item.unit as any, ing.unit);
            displayAmount = item.unit;
            cost = calcIngredientCost(ing, usedAmount);
          } else {
            const numAmt = parseFloat(item.amount) || 0;
            if (ing.unitConversion && item.unit === ing.unitConversion.unit) {
              usedAmount = toBaseAmount(numAmt * ing.unitConversion.amount, ing.unit);
            } else {
              usedAmount = toBaseAmount(numAmt, item.unit as any);
            }
            displayAmount = item.amount;
            cost = calcIngredientCost(ing, usedAmount);
          }

          return {
            ingredientId: ing.id,
            ingredientName: ing.name,
            usedAmount,
            displayAmount,
            unit: item.unit,
            cost,
            isApprox: casual,
          } as MealIngredient;
        })
        .filter(Boolean) as MealIngredient[];

      totalCost = ingredients.reduce((s, i) => s + i.cost, 0);
    }

    const payload = {
      date: data.date,
      time: data.time,
      mealKind: data.mealKind,
      menuName: data.menuName.trim(),
      ingredients,
      totalCost,
      memo: data.memo || undefined,
    };

    if (editMeal) {
      dispatch({ type: 'UPDATE_MEAL', payload: { old: editMeal, updated: payload } });
      setEditMeal(null);
    } else {
      dispatch({ type: 'ADD_MEAL', payload });
    }
    setShowForm(false);
  }

  return (
    <div className="pb-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-2xl px-4 py-3 shadow-receipt">
        <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="font-semibold text-gray-800 text-sm">{formatDateKo(viewDate)}</div>
          {isToday && <div className="text-xs text-brand-500 font-medium">오늘</div>}
        </div>
        <button
          onClick={nextDay}
          disabled={isToday}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day total */}
      {dayMeals.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm text-gray-500">{dayMeals.length}끼 기록</span>
          <span className="text-sm font-bold text-gray-700 font-receipt">{formatCurrency(dayTotal)}</span>
        </div>
      )}

      {/* Meals */}
      {dayMeals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-30" />
          <div className="text-sm">이 날 기록된 식사가 없어요</div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-brand-500 text-sm hover:underline"
          >
            식사 기록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDelete={() => { if (confirm('이 식사 기록을 삭제할까요?')) dispatch({ type: 'DELETE_MEAL', payload: meal.id }); }}
              onEdit={() => { setEditMeal(meal); setShowForm(true); }}
              onViewReceipt={() => setReceiptMeal(meal)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-receipt-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all z-40"
      >
        <Plus size={26} />
      </button>

      {/* Meal form modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditMeal(null); }}
        title={editMeal ? '식사 수정' : '식사 기록'}
        size="md"
      >
        <MealForm
          initialData={editMeal ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMeal(null); }}
        />
      </Modal>

      {/* Receipt modal */}
      <Modal
        isOpen={!!receiptMeal}
        onClose={() => setReceiptMeal(null)}
        title="영수증"
        size="sm"
      >
        {receiptMeal && <ReceiptCard meal={receiptMeal} />}
      </Modal>
    </div>
  );
}
