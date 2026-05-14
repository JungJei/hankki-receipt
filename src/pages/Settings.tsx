import { useState } from 'react';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { UnitDef } from '../types';

const TYPE_BASE_UNIT: Record<UnitDef['type'], string> = {
  weight: 'g',
  volume: 'ml',
  count: '',
};

const TYPE_SECTION_LABEL: Record<UnitDef['type'], string> = {
  weight: '무게 단위 (g 기준)',
  volume: '용량 단위 (ml 기준)',
  count: '개수 단위',
};

export default function Settings() {
  const { state, dispatch } = useApp();
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUnit, setNewUnit] = useState<{ name: string; type: UnitDef['type']; baseValue: string }>({
    name: '',
    type: 'count',
    baseValue: '1',
  });
  const [addError, setAddError] = useState('');

  function startEdit(unit: UnitDef) {
    setEditingUnit(unit.name);
    setEditValue(String(unit.baseValue));
  }

  function saveEdit(unitName: string) {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      dispatch({ type: 'UPDATE_UNIT', payload: { name: unitName, baseValue: val } });
    }
    setEditingUnit(null);
  }

  function handleDelete(unitName: string) {
    if (state.ingredients.some((ing) => ing.unit === unitName)) {
      alert(`"${unitName}"은 현재 등록된 재료에 사용 중이에요. 재료를 먼저 수정해주세요.`);
      return;
    }
    dispatch({ type: 'DELETE_UNIT', payload: unitName });
  }

  function handleAdd() {
    const name = newUnit.name.trim();
    if (!name) { setAddError('단위명을 입력해주세요'); return; }
    if (state.units.find((u) => u.name === name)) { setAddError('이미 존재하는 단위예요'); return; }
    const baseValue = newUnit.type === 'count' ? 1 : (parseFloat(newUnit.baseValue) || 1);
    dispatch({
      type: 'ADD_UNIT',
      payload: { name, type: newUnit.type, baseValue, isBuiltin: false },
    });
    setNewUnit({ name: '', type: 'count', baseValue: '1' });
    setAddError('');
    setShowAdd(false);
  }

  const grouped: Record<UnitDef['type'], UnitDef[]> = {
    weight: state.units.filter((u) => u.type === 'weight'),
    volume: state.units.filter((u) => u.type === 'volume'),
    count: state.units.filter((u) => u.type === 'count'),
  };

  return (
    <div className="pb-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-800">단위 관리</h2>
        <p className="text-xs text-gray-500 mt-1">재료 등록에 사용할 단위를 관리해요. 기준값을 수정하면 단가 계산에 반영돼요.</p>
      </div>

      {(['weight', 'volume', 'count'] as UnitDef['type'][]).map((type) => (
        <div key={type} className="mb-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {TYPE_SECTION_LABEL[type]}
          </div>
          <div className="space-y-2">
            {grouped[type].map((unit) => (
              <div
                key={unit.name}
                className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-receipt border border-transparent"
              >
                {/* 단위명 */}
                <span className="font-semibold text-gray-800 w-10 shrink-0">{unit.name}</span>

                {/* 기준값 표시 or 편집 */}
                <div className="flex-1 text-xs">
                  {type !== 'count' ? (
                    editingUnit === unit.name ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">1 {unit.name} =</span>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          className="w-16 border border-brand-400 rounded-lg px-1.5 py-0.5 text-sm focus:outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(unit.name); if (e.key === 'Escape') setEditingUnit(null); }}
                        />
                        <span className="text-gray-400">{TYPE_BASE_UNIT[type]}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        1 {unit.name} = {unit.baseValue}{TYPE_BASE_UNIT[type]}
                      </span>
                    )
                  ) : (
                    <span className="text-gray-400">개별 단위</span>
                  )}
                </div>

                {/* 버튼 */}
                <div className="flex items-center gap-1 shrink-0">
                  {type !== 'count' && (
                    editingUnit === unit.name ? (
                      <>
                        <button
                          onClick={() => saveEdit(unit.name)}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingUnit(null)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(unit)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    )
                  )}
                  {!unit.isBuiltin && (
                    <button
                      onClick={() => handleDelete(unit.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 단위 추가 */}
      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 shadow-receipt space-y-3">
          <div className="text-sm font-semibold text-gray-700">새 단위 추가</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">단위명 *</label>
              <input
                className="w-full border border-receipt-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="예: 스틱, 접시"
                value={newUnit.name}
                onChange={(e) => { setNewUnit((n) => ({ ...n, name: e.target.value })); setAddError(''); }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
              <select
                className="w-full border border-receipt-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
                value={newUnit.type}
                onChange={(e) => setNewUnit((n) => ({ ...n, type: e.target.value as UnitDef['type'] }))}
              >
                <option value="count">개수</option>
                <option value="weight">무게 (g)</option>
                <option value="volume">용량 (ml)</option>
              </select>
            </div>
          </div>

          {newUnit.type !== 'count' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                기준값 — 1 {newUnit.name || '단위'} = ? {TYPE_BASE_UNIT[newUnit.type]}
              </label>
              <input
                type="number"
                min="0.001"
                step="any"
                className="w-full border border-receipt-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder={newUnit.type === 'weight' ? '예: 200 (g)' : '예: 250 (ml)'}
                value={newUnit.baseValue}
                onChange={(e) => setNewUnit((n) => ({ ...n, baseValue: e.target.value }))}
              />
            </div>
          )}

          {addError && <p className="text-xs text-red-500">{addError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setShowAdd(false); setAddError(''); }}
              className="flex-1 py-2.5 rounded-xl border border-receipt-border text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-brand-400 text-brand-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
        >
          <Plus size={16} /> 단위 추가
        </button>
      )}
    </div>
  );
}
