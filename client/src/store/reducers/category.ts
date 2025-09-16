import { ActionType } from '../action-types';
import { Category } from '../../interfaces';
import { CategoryAction } from '../actions/categoryActions';

interface CategoryState {
  loading: boolean;
  errors: string | undefined;
  categories: Category[];
  totalCategories: number;
  categoryInEdit: Category | null;
}

const initialState: CategoryState = {
  loading: true,
  errors: undefined,
  categories: [],
  totalCategories: 0,
  categoryInEdit: null,
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
        totalCategories: action.payload.totalBookmarkCategories,
      };

    case ActionType.getCategoriesSuccess: {
      const { categories: incoming, total } = action.payload;
      const current = state.categories;

      // valid array ??
      if (!Array.isArray(incoming) || !Array.isArray(current)) {
        return { ...state, loading: false };
      }

      const incomingIds = new Set(incoming.map((c) => c.id));

      // filter dupes
      const kept = current.filter((c: any) => !incomingIds.has(c.id));
      const merged = [...kept, ...incoming];
      
      return { ...state, loading: false, categories: merged, totalCategories: total };
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

    case ActionType.updateCategoryCollapseState:
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.categoryId
            ? { ...category, isCollapsed: action.payload.isCollapsed }
            : category
        ),
      };

    case ActionType.expandAllCategories:
      return {
        ...state,
        categories: state.categories.map((category) => ({
          ...category,
          isCollapsed: false,
        })),
      };

    case ActionType.deleteCategory:
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      };

    case ActionType.setEditCategory:
      return { ...state, categoryInEdit: action.payload };

    default:
      return state;
  }
};
