import type { Ingredient, MealRecord, Budget, UnitDef } from '../types';
import { DEFAULT_UNITS } from './units';

const KEYS = {
  ingredients: 'hankki_ingredients',
  meals: 'hankki_meals',
  budget: 'hankki_budget',
  units: 'hankki_units',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadIngredients: (): Ingredient[] => load<Ingredient[]>(KEYS.ingredients, []),
  saveIngredients: (data: Ingredient[]) => save(KEYS.ingredients, data),

  loadMeals: (): MealRecord[] => load<MealRecord[]>(KEYS.meals, []),
  saveMeals: (data: MealRecord[]) => save(KEYS.meals, data),

  loadBudget: (): Budget => load<Budget>(KEYS.budget, { weekly: 0, monthly: 0 }),
  saveBudget: (data: Budget) => save(KEYS.budget, data),

  loadUnits: (): UnitDef[] => load<UnitDef[]>(KEYS.units, DEFAULT_UNITS),
  saveUnits: (data: UnitDef[]) => save(KEYS.units, data),
};
