import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, AlertCircle, Package, LayoutGrid, LayoutList } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Modal from '../components/Modal';
import type { Ingredient, IngredientCategory, StandardUnit } from '../types';
import { CATEGORY_EMOJI } from '../types';
import { formatCurrency, getTodayString } from '../utils/calculations';

const CATEGORIES: IngredientCategory[] = [
  '채소', '과일', '육류', '해산물', '유제품', '곡물/면', '조미료', '소스', '음료', '가공식품', '기타',
];

const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  채소: 'bg-green-100 text-green-700',
  과일: 'bg-orange-100 text-orange-700',
  육류: 'bg-red-100 text-red-700',
  해산물: 'bg-blue-100 text-blue-700',
  유제품: 'bg-yellow-100 text-yellow-700',
  '곡물/면': 'bg-purple-100 text-purple-700',
  조미료: 'bg-gray-100 text-gray-700',
  소스: 'bg-pink-100 text-pink-700',
  음료: 'bg-cyan-100 text-cyan-700',
  가공식품: 'bg-lime-100 text-lime-700',
  기타: 'bg-slate-100 text-slate-700',
};

interface IngredientFormData {
  name: string;
  category: IngredientCategory;
  totalQuantity: string;
  remainingQuantity: string;
  unit: StandardUnit;
  totalPrice: string;
  purchaseDate: string;
  expiryDate: string;
  memo: string;
}

const DEFAULT_FORM: IngredientFormData = {
  name: '',
  category: '채소',
  totalQuantity: '',
  remainingQuantity: '',
  unit: 'g',
  totalPrice: '',
  purchaseDate: getTodayString(),
  expiryDate: '',
  memo: '',
};

function IngredientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Ingredient;
  onSave: (data: IngredientFormData) => void;
  onCancel: () => void;
}) {
  const { state } = useApp();
  const [form, setForm] = useState<IngredientFormData>(
    initial
      ? {
          name: initial.name,
          category: initial.category,
          totalQuantity: String(initial.totalQuantity),
          remainingQuantity: String(initial.remainingQuantity),
          unit: initial.unit,
          totalPrice: String(initial.totalPrice),
          purchaseDate: initial.purchaseDate,
          expiryDate: initial.expiryDate ?? '',
          memo: initial.memo ?? '',
        }
      : DEFAULT_FORM
  );

  const qty = parseFloat(form.totalQuantity) || 0;
  const price = parseInt(form.totalPrice) || 0;
  const ppu = qty > 0 ? price / qty : 0;

  function set(k: keyof IngredientFormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.totalQuantity || !form.totalPrice) return;
    onSave(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">재료명 *</label>
        <input
          className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
          placeholder="예: 당근, 두부, 된장..."
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">카테고리</label>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className={`py-1.5 px-1 rounded-lg text-xs font-medium transition-colors border ${
                form.category === cat
                  ? 'border-brand-400 bg-brand-50 text-brand-600'
                  : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {CATEGORY_EMOJI[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{initial ? '구매 수량 *' : '수량 *'}</label>
          <input
            type="number"
            min="0"
            step="any"
            className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
            placeholder="500"
            value={form.totalQuantity}
            onChange={(e) => set('totalQuantity', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">단위</label>
          <select
            className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 bg-white"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value as StandardUnit)}
          >
            {state.units.map((u) => (
              <option key={u.name} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {initial && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">남은 양</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              max={parseFloat(form.totalQuantity) || undefined}
              className="w-full border border-receipt-border rounded-xl px-3 py-2.5 pr-12 text-sm focus:outline-none focus:border-brand-400"
              value={form.remainingQuantity}
              onChange={(e) => set('remainingQuantity', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{form.unit}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">구입 가격 *</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            className="w-full border border-receipt-border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:border-brand-400"
            placeholder="2000"
            value={form.totalPrice}
            onChange={(e) => set('totalPrice', e.target.value)}
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
        </div>
        {ppu > 0 && (
          <div className="mt-1 text-xs text-gray-400">
            ≈ {form.unit}당 {ppu < 1 ? ppu.toFixed(2) : Math.round(ppu)}원
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-medium text-gray-500 mb-1">구입일</label>
          <input
            type="date"
            className="w-full border border-receipt-border rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-brand-400"
            value={form.purchaseDate}
            onChange={(e) => set('purchaseDate', e.target.value)}
          />
        </div>
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-medium text-gray-500 mb-1">유통기한</label>
          <input
            type="date"
            className="w-full border border-receipt-border rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-brand-400"
            value={form.expiryDate}
            onChange={(e) => set('expiryDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
        <input
          className="w-full border border-receipt-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
          placeholder="브랜드, 구입처 등..."
          value={form.memo}
          onChange={(e) => set('memo', e.target.value)}
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
          {initial ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  );
}

function IngredientGridCard({
  ingredient,
  onEdit,
  onDelete,
}: {
  ingredient: Ingredient;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const remaining = ingredient.remainingQuantity;
  const total = ingredient.totalQuantity;
  const ratio = total > 0 ? remaining / total : 0;
  const isExpired = ingredient.expiryDate ? ingredient.expiryDate < getTodayString() : false;
  const isLow = ratio < 0.2 && ratio > 0;

  return (
    <div className={`bg-white rounded-2xl p-3 shadow-receipt border ${isExpired ? 'border-red-200' : 'border-transparent'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{CATEGORY_EMOJI[ingredient.category]}</span>
        <div className="flex gap-0.5">
          <button onClick={onEdit} className="p-1 rounded-lg text-gray-300 hover:text-brand-500 transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="mb-2.5">
        <div className="font-semibold text-gray-800 text-sm leading-tight truncate">{ingredient.name}</div>
        <div className={`text-xs mt-0.5 ${isExpired ? 'text-red-400' : isLow ? 'text-amber-500' : 'text-gray-400'}`}>
          {remaining.toFixed(remaining < 10 ? 1 : 0)}{ingredient.unit}
          {isExpired && ' · 만료'}
          {isLow && !isExpired && ' · 부족'}
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isExpired ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-brand-400'}`}
          style={{ width: `${Math.max(0, ratio) * 100}%` }}
        />
      </div>
    </div>
  );
}

function IngredientCard({
  ingredient,
  onEdit,
  onDelete,
}: {
  ingredient: Ingredient;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const remaining = ingredient.remainingQuantity;
  const total = ingredient.totalQuantity;
  const ratio = total > 0 ? remaining / total : 0;
  const isExpired =
    ingredient.expiryDate ? ingredient.expiryDate < getTodayString() : false;
  const isLow = ratio < 0.2 && ratio > 0;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-receipt border ${isExpired ? 'border-red-200' : 'border-transparent'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{CATEGORY_EMOJI[ingredient.category]}</span>
            <span className="font-semibold text-gray-800 text-base">{ingredient.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[ingredient.category]}`}>
              {ingredient.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
            <span className="font-receipt">{formatCurrency(ingredient.totalPrice)}</span>
            <span className="text-gray-300">|</span>
            <span>{ingredient.totalQuantity}{ingredient.unit} 구입</span>
          </div>

          {/* Remaining bar */}
          <div className="mb-1.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">남은 양</span>
              <span className={`text-xs font-medium ${isLow ? 'text-amber-500' : 'text-gray-600'}`}>
                {remaining.toFixed(remaining < 10 ? 1 : 0)}{ingredient.unit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isExpired ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-brand-400'
                }`}
                style={{ width: `${Math.max(0, ratio) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            {isExpired && (
              <span className="flex items-center gap-0.5 text-red-500">
                <AlertCircle size={10} /> 유통기한 만료
              </span>
            )}
            {isLow && !isExpired && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <AlertCircle size={10} /> 재료 부족
              </span>
            )}
            {ingredient.expiryDate && !isExpired && (
              <span>{ingredient.expiryDate} 까지</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ingredients() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<IngredientCategory | '전체'>('전체');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);

  const filtered = state.ingredients.filter((ing) => {
    const matchCat = catFilter === '전체' || ing.category === catFilter;
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleSave(data: IngredientFormData) {
    const payload = {
      name: data.name.trim(),
      category: data.category,
      totalQuantity: parseFloat(data.totalQuantity),
      unit: data.unit,
      totalPrice: parseInt(data.totalPrice),
      purchaseDate: data.purchaseDate,
      expiryDate: data.expiryDate || undefined,
      memo: data.memo || undefined,
    };

    if (editTarget) {
      const remainingQty = data.remainingQuantity !== ''
        ? Math.min(parseFloat(data.remainingQuantity), payload.totalQuantity)
        : editTarget.remainingQuantity;
      dispatch({
        type: 'UPDATE_INGREDIENT',
        payload: { ...editTarget, ...payload, remainingQuantity: remainingQty, pricePerUnit: payload.totalPrice / payload.totalQuantity },
      });
    } else {
      dispatch({ type: 'ADD_INGREDIENT', payload });
    }
    setShowForm(false);
    setEditTarget(null);
  }

  function handleDelete(id: string) {
    if (confirm('이 재료를 삭제할까요?')) {
      dispatch({ type: 'DELETE_INGREDIENT', payload: id });
    }
  }

  return (
    <div className="pb-6">
      {/* Search & filter */}
      <div className="sticky top-0 bg-receipt-bg pt-0 pb-3 z-10">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-white border border-receipt-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-400"
              placeholder="재료 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex border border-receipt-border rounded-xl overflow-hidden bg-white shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 flex items-center transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 flex items-center transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(['전체', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                catFilter === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-receipt-border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat !== '전체' && CATEGORY_EMOJI[cat as IngredientCategory]}{' '}{cat}
            </button>
          ))}
        </div>
      </div>

      {/* List / Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-30" />
          <div className="text-sm">등록된 재료가 없어요</div>
          <div className="text-xs mt-1">아래 + 버튼을 눌러 재료를 등록해보세요</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((ing) => (
            <IngredientGridCard
              key={ing.id}
              ingredient={ing}
              onEdit={() => { setEditTarget(ing); setShowForm(true); }}
              onDelete={() => handleDelete(ing.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ing) => (
            <IngredientCard
              key={ing.id}
              ingredient={ing}
              onEdit={() => { setEditTarget(ing); setShowForm(true); }}
              onDelete={() => handleDelete(ing.id)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditTarget(null); setShowForm(true); }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-receipt-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all z-40"
      >
        <Plus size={26} />
      </button>

      {/* Form modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget ? '재료 수정' : '식재료 등록'}
        size="md"
      >
        <IngredientForm
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      </Modal>
    </div>
  );
}
