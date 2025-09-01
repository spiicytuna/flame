import axios from 'axios';
import { ActionType } from '../action-types';
import { Category } from '../../interfaces';

interface CategoryState {
  categories: Category[];
  categoryInEdit: Category | null;
}

const initialState: CategoryState = {
  categories: [],
  categoryInEdit: null,
};

// Make action generic to avoid missing type imports
type AnyAction = { type: ActionType; payload?: any };

export const getAppCategories = () => async (dispatch: any) => {
  const { data } = await axios.get('/api/categories?section=apps');
  dispatch({ type: ActionType.getCategoriesSuccess, payload: data.data as Category[] });
};

// (optional) keep the original bookmarks loader using ?section=bookmarks
export const getBookmarkCategories = () => async (dispatch: any) => {
  const { data } = await axios.get('/api/categories?section=bookmarks');
  dispatch({ type: ActionType.getCategoriesSuccess, payload: data.data as Category[] });
};


export const categoriesReducer = (
  state: CategoryState = initialState,
  action: AnyAction
): CategoryState => {
  switch (action.type) {
    case ActionType.getCategoriesSuccess:
      return { ...state, categories: action.payload };

    case ActionType.addCategory:
      return { ...state, categories: [...state.categories, action.payload] };

    case ActionType.updateCategory:
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };

    case ActionType.deleteCategory:
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      };

    case ActionType.setEditCategory:
      return { ...state, categoryInEdit: action.payload };

    case ActionType.pinCategory:
      // assumes payload is the updated Category
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };

    case ActionType.reorderCategories:
      // assumes payload is the full reordered list
      return { ...state, categories: action.payload };

    default:
      return state;
  }
};
