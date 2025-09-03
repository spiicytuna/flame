import axios from 'axios';
import { ActionType } from '../action-types';
import { Category, ApiResponse } from '../../interfaces';
import { CategoryAction } from '../actions/categoryActions';
import { Dispatch } from 'redux';
import { applyAuth } from '../../utility';

interface CategoryState {
  loading: boolean;
  errors: string | undefined;
  categories: Category[];
  categoryInEdit: Category | null;
}

const initialState: CategoryState = {
  loading: true,
  errors: undefined,
  categories: [],
  categoryInEdit: null,
};

export const getCategoriesForSection =
  (section: 'bookmarks' | 'apps') =>
  async (dispatch: Dispatch) => {
    // dispatch({ type: ActionType.getCategories }); // REMOVED
    try {
      const res = await axios.get<ApiResponse<Category[]>>(
        `/api/categories?section=${section}`,
        { headers: applyAuth() }
      );
      dispatch({
        type: ActionType.getCategoriesSuccess,
        payload: {
          categories: res.data.data ?? [],
          section: section,
        },
      });
    } catch (err: any) {
      dispatch({
        type: ActionType.getCategoriesError,
        payload: err?.message || 'Failed to fetch categories',
      });
    }
  };

export const categoriesReducer = (
  state: CategoryState = initialState,
  action: CategoryAction
): CategoryState => {
  switch (action.type) {
    case ActionType.getCategories:
      return {
        ...state,
        loading: true,
      };

    case ActionType.fetchHomepageDataSuccess:
      return {
        ...state,
        loading: false,
        categories: action.payload.categories,
      };

    case ActionType.getCategoriesSuccess: {
      const incoming = action.payload; 
      const current = state.categories;

      // valid array
      if (!Array.isArray(incoming) || !Array.isArray(current)) {
        return { ...state, loading: false };
      }
      
      const incomingIds = new Set(incoming.map((c) => c.id));
      
      // filter dupes
      const kept = current.filter((c: any) => !incomingIds.has(c.id));
      const merged = [...kept, ...incoming];
      
      return { ...state, loading: false, categories: merged };
    }

    case ActionType.getCategoriesError:
      return { ...state, loading: false, errors: action.payload };

    case ActionType.addCategory:
      return { ...state, categories: [...state.categories, action.payload] };

    case ActionType.updateCategory:
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id
	    ? { ...cat, ...action.payload }
	    : cat
        ),
      };

    case ActionType.deleteCategory:
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      };

    case ActionType.setEditCategory:
      return { ...state, categoryInEdit: action.payload };
      
    // ... etc.

    default:
      return state;
  }
};
