import { ActionType } from '../action-types';
import { App, Category } from '../../interfaces';

export interface GetCategories {
  type: ActionType.getCategories;
}

export interface GetCategoriesSuccess {
  type: ActionType.getCategoriesSuccess;
  payload: { categories: Category[]; total: number };
}

export interface GetCategoriesError {
  type: ActionType.getCategoriesError;
  payload: string;
}

export interface AddCategory {
  type: ActionType.addCategory;
  payload: Category;
}

export interface UpdateCategory {
  type: ActionType.updateCategory;
  payload: Category;
}

export interface DeleteCategory {
  type: ActionType.deleteCategory;
  payload: number;
}

export interface SetEditCategory {
  type: ActionType.setEditCategory;
  payload: Category | null;
}

export interface PinCategory {
  type: ActionType.pinCategory;
  payload: Category;
}

export interface ReorderCategories {
  type: ActionType.reorderCategories;
  payload: Category[];
}

export interface SortCategories {
  type: ActionType.sortCategories;
  payload: string;
}

export interface UpdateCategoryCollapseState {
  type: ActionType.updateCategoryCollapseState;
  payload: { categoryId: number; isCollapsed: boolean };
}

export interface ExpandAllCategories {
  type: ActionType.expandAllCategories;
}

// special => delivers multiple data types
export interface FetchHomepageDataSuccess {
  type: ActionType.fetchHomepageDataSuccess;
  payload: {
    apps: {
      apps: App[];
      totalApps: number;
    };
    categories: Category[];
    totalBookmarkCategories: number;
  };
}

export type CategoryAction =
  | FetchHomepageDataSuccess
  | GetCategories
  | GetCategoriesSuccess
  | GetCategoriesError
  | AddCategory
  | UpdateCategory
  | DeleteCategory
  | SetEditCategory
  | PinCategory
  | ReorderCategories
  | SortCategories
  | UpdateCategoryCollapseState
  | ExpandAllCategories;
