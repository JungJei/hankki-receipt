import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Ingredient, MealRecord, Budget, UnitDef } from '../types';
import { storage } from '../utils/storage';
import { calcPricePerUnit, getTodayString } from '../utils/calculations';
import { toBaseAmount } from '../utils/units';
import { v4 as uuidv4 } from 'uuid';

type Action =
  | { type: 'ADD_INGREDIENT'; payload: Omit<Ingredient, 'id' | 'pricePerUnit' | 'remainingQuantity'> }
  | { type: 'UPDATE_INGREDIENT'; payload: Ingredient }
  | { type: 'DELETE_INGREDIENT'; payload: string }
  | { type: 'ADD_MEAL'; payload: Omit<MealRecord, 'id' | 'createdAt'> }
  | { type: 'DELETE_MEAL'; payload: string }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'RESTORE_INGREDIENT_QTY'; mealId: string }
  | { type: 'ADD_UNIT'; payload: UnitDef }
  | { type: 'UPDATE_UNIT'; payload: { name: string; baseValue: number } }
  | { type: 'DELETE_UNIT'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_INGREDIENT': {
      const ingredient: Ingredient = {
        ...action.payload,
        id: uuidv4(),
        pricePerUnit: action.payload.totalPrice / toBaseAmount(action.payload.totalQuantity, action.payload.unit, state.units),
        remainingQuantity: action.payload.totalQuantity,
      };
      return { ...state, ingredients: [...state.ingredients, ingredient] };
    }
    case 'UPDATE_INGREDIENT': {
      const updated = {
        ...action.payload,
        pricePerUnit: action.payload.totalPrice / toBaseAmount(action.payload.totalQuantity, action.payload.unit, state.units),
      };
      return {
        ...state,
        ingredients: state.ingredients.map((i) => (i.id === updated.id ? updated : i)),
      };
    }
    case 'DELETE_INGREDIENT':
      return { ...state, ingredients: state.ingredients.filter((i) => i.id !== action.payload) };

    case 'ADD_MEAL': {
      const meal: MealRecord = {
        ...action.payload,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      // Deduct used quantities from ingredients
      const updatedIngredients = state.ingredients.map((ing) => {
        const used = meal.ingredients.find((mi) => mi.ingredientId === ing.id);
        if (!used) return ing;
        const usedInOriginalUnit = used.usedAmount / (ing.unit === 'kg' ? 1000 : ing.unit === 'L' ? 1000 : 1);
        const newRemaining = Math.max(0, ing.remainingQuantity - usedInOriginalUnit);
        return { ...ing, remainingQuantity: newRemaining };
      });
      return { ...state, meals: [...state.meals, meal], ingredients: updatedIngredients };
    }
    case 'DELETE_MEAL': {
      const meal = state.meals.find((m) => m.id === action.payload);
      if (!meal) return state;
      // Restore quantities
      const updatedIngredients = state.ingredients.map((ing) => {
        const used = meal.ingredients.find((mi) => mi.ingredientId === ing.id);
        if (!used) return ing;
        const usedInOriginalUnit = used.usedAmount / (ing.unit === 'kg' ? 1000 : ing.unit === 'L' ? 1000 : 1);
        return { ...ing, remainingQuantity: ing.remainingQuantity + usedInOriginalUnit };
      });
      return { ...state, meals: state.meals.filter((m) => m.id !== action.payload), ingredients: updatedIngredients };
    }
    case 'UPDATE_BUDGET': {
      const monthly = action.payload.monthly;
      const weekly = monthly > 0 ? Math.round(monthly * 7 / 30) : 0;
      return { ...state, budget: { monthly, weekly } };
    }

    case 'ADD_UNIT': {
      if (state.units.find((u) => u.name === action.payload.name)) return state;
      return { ...state, units: [...state.units, action.payload] };
    }
    case 'UPDATE_UNIT': {
      return {
        ...state,
        units: state.units.map((u) =>
          u.name === action.payload.name ? { ...u, baseValue: action.payload.baseValue } : u
        ),
      };
    }
    case 'DELETE_UNIT': {
      return { ...state, units: state.units.filter((u) => u.name !== action.payload) };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  today: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ingredients: storage.loadIngredients(),
    meals: storage.loadMeals(),
    budget: storage.loadBudget(),
    units: storage.loadUnits(),
  }));

  useEffect(() => { storage.saveIngredients(state.ingredients); }, [state.ingredients]);
  useEffect(() => { storage.saveMeals(state.meals); }, [state.meals]);
  useEffect(() => { storage.saveBudget(state.budget); }, [state.budget]);
  useEffect(() => { storage.saveUnits(state.units); }, [state.units]);

  return (
    <AppContext.Provider value={{ state, dispatch, today: getTodayString() }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export for convenience
export { calcPricePerUnit };
