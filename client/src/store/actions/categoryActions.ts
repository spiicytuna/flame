import { ActionType } from '../action-types';
import { App, Category } from '../../interfaces';

// This is a general action for starting any category fetch
export interface GetCategories {
  type: ActionType.getCategories;
}

// This is for when the fetch succeeds
export interface GetCategoriesSuccess {
  type: ActionType.getCategoriesSuccess;
  payload: Category[]; // The payload is the array of categories
}

// This is for when the fetch fails
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

// This action is special because it delivers multiple data types
export interface FetchHomepageDataSuccess {
  type: ActionType.fetchHomepageDataSuccess;
  payload: {
    apps: App[];
    categories: Category[];
  };
}

// This is the final "union" type that the reducer will use
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
  | SortCategories;
