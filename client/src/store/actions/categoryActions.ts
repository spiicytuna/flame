// client/src/store/actions/categoryActions.ts
import { ActionType } from '../action-types';
import { Category } from '../../interfaces';

export interface GetCategoriesSuccess {
  type: ActionType.getCategoriesSuccess;
  payload: Category[];
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

export type CategoryAction =
  | GetCategoriesSuccess
  | AddCategory
  | UpdateCategory
  | DeleteCategory
  | SetEditCategory
  | PinCategory
  | ReorderCategories;
