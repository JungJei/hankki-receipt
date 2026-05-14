export type IngredientCategory =
  | '채소' | '과일' | '육류' | '해산물'
  | '유제품' | '곡물/면' | '조미료' | '소스'
  | '음료' | '가공식품' | '기타';

// 동적 단위 시스템을 위해 string으로 확장
export type StandardUnit = string;

export interface UnitDef {
  name: string;
  type: 'weight' | 'volume' | 'count';
  baseValue: number; // weight: grams, volume: ml, count: 1
  isBuiltin: boolean;
}

export type CasualUnit =
  | '한주먹' | '한줌' | '한꼬집' | '약간' | '조금'
  | '한스푼' | '반스푼' | '한컵' | '반컵'
  | '한개' | '반개' | '두개' | '세개';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealKind = 'homemade' | 'delivery';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

export const CATEGORY_EMOJI: Record<IngredientCategory, string> = {
  채소: '🥬',
  과일: '🍎',
  육류: '🥩',
  해산물: '🐟',
  유제품: '🧀',
  '곡물/면': '🌾',
  조미료: '🧂',
  소스: '🫙',
  음료: '🥤',
  가공식품: '🥫',
  기타: '📦',
};

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  totalQuantity: number;
  unit: string;
  totalPrice: number;
  pricePerUnit: number;
  purchaseDate: string;
  expiryDate?: string;
  remainingQuantity: number;
  memo?: string;
}

export interface MealIngredient {
  ingredientId: string;
  ingredientName: string;
  usedAmount: number;
  displayAmount: string;
  unit: string;
  cost: number;
  isApprox: boolean;
}

export interface MealRecord {
  id: string;
  date: string;
  mealKind?: MealKind;  // 'homemade' | 'delivery' (없으면 homemade로 간주)
  mealType?: MealType;  // 구버전 호환용
  time?: string;        // "HH:MM" 형식
  menuName: string;
  ingredients: MealIngredient[];
  totalCost: number;
  memo?: string;
  createdAt: string;
}

export interface Budget {
  weekly: number;
  monthly: number;
}

export interface AppState {
  ingredients: Ingredient[];
  meals: MealRecord[];
  budget: Budget;
  units: UnitDef[];
}
