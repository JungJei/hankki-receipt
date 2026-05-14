import type { CasualUnit, UnitDef } from '../types';

export const DEFAULT_UNITS: UnitDef[] = [
  { name: 'g',   type: 'weight', baseValue: 1,    isBuiltin: true  },
  { name: 'kg',  type: 'weight', baseValue: 1000, isBuiltin: true  },
  { name: 'ml',  type: 'volume', baseValue: 1,    isBuiltin: true  },
  { name: 'L',   type: 'volume', baseValue: 1000, isBuiltin: true  },
  { name: '개',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '장',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '봉',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '팩',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '병',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '캔',  type: 'count',  baseValue: 1,    isBuiltin: false },
  { name: '컵',  type: 'volume', baseValue: 200,  isBuiltin: false },
];

// 기본 단위 이름 목록 (단위 선택 UI용)
export const STANDARD_UNITS: string[] = DEFAULT_UNITS.map((u) => u.name);

export const CASUAL_UNITS: CasualUnit[] = [
  '한주먹', '한줌', '한꼬집', '약간', '조금',
  '한스푼', '반스푼', '한컵', '반컵',
  '한개', '반개', '두개', '세개',
];

export const ALL_UNITS = [...STANDARD_UNITS, ...CASUAL_UNITS];

export const CASUAL_APPROX_GRAMS: Record<CasualUnit, number> = {
  '한주먹': 100,
  '한줌': 50,
  '한꼬집': 2,
  '약간': 5,
  '조금': 10,
  '한스푼': 15,
  '반스푼': 7,
  '한컵': 200,
  '반컵': 100,
  '한개': 1,
  '반개': 0.5,
  '두개': 2,
  '세개': 3,
};

export const CASUAL_APPROX_COUNT: Record<CasualUnit, number> = {
  '한주먹': 3,
  '한줌': 5,
  '한꼬집': 1,
  '약간': 1,
  '조금': 1,
  '한스푼': 1,
  '반스푼': 1,
  '한컵': 1,
  '반컵': 1,
  '한개': 1,
  '반개': 0.5,
  '두개': 2,
  '세개': 3,
};

export const COUNT_UNITS: string[] = DEFAULT_UNITS.filter((u) => u.type === 'count').map((u) => u.name);
export const WEIGHT_UNITS: string[] = DEFAULT_UNITS.filter((u) => u.type === 'weight').map((u) => u.name);
export const VOLUME_UNITS: string[] = DEFAULT_UNITS.filter((u) => u.type === 'volume').map((u) => u.name);

export function isCasualUnit(unit: string): unit is CasualUnit {
  return CASUAL_UNITS.includes(unit as CasualUnit);
}

export function isCountUnit(unit: string, unitDefs?: UnitDef[]): boolean {
  if (unitDefs) {
    const def = unitDefs.find((d) => d.name === unit);
    if (def) return def.type === 'count';
  }
  return COUNT_UNITS.includes(unit);
}

/** 단위를 기준 단위(g 또는 ml)로 변환. unitDefs 제공 시 동적 변환 */
export function toBaseAmount(quantity: number, unit: string, unitDefs?: UnitDef[]): number {
  if (unitDefs) {
    const def = unitDefs.find((d) => d.name === unit);
    if (def) return quantity * def.baseValue;
  }
  // 하드코딩 fallback (기존 데이터 호환)
  if (unit === 'kg') return quantity * 1000;
  if (unit === 'L') return quantity * 1000;
  if (unit === '컵') return quantity * 200;
  return quantity;
}

export function getBaseUnit(unit: string, unitDefs?: UnitDef[]): string {
  if (unitDefs) {
    const def = unitDefs.find((d) => d.name === unit);
    if (def) {
      if (def.type === 'weight') return 'g';
      if (def.type === 'volume') return 'ml';
      return unit;
    }
  }
  if (unit === 'kg') return 'g';
  if (unit === 'L') return 'ml';
  if (unit === '컵') return 'ml';
  return unit;
}

export function casualToBaseAmount(casualUnit: CasualUnit, ingredientUnit: string, unitDefs?: UnitDef[]): number {
  if (isCountUnit(ingredientUnit, unitDefs)) {
    return CASUAL_APPROX_COUNT[casualUnit];
  }
  return CASUAL_APPROX_GRAMS[casualUnit];
}
