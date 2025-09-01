import { ActionType } from '../action-types';
import { Category } from '../../interfaces';

export const getCategoriesSuccess = (categories: Category[]) => ({
  type: ActionType.getCategoriesSuccess,
  payload: categories,
});

export const addCategory = (category: Category) => ({
  type: ActionType.addCategory,
  payload: category,
});

export const updateCategory = (category: Category) => ({
  type: ActionType.updateCategory,
  payload: category,
});

export const deleteCategory = (id: number) => ({
  type: ActionType.deleteCategory,
  payload: id,
});

export const setEditCategory = (category: Category | null) => ({
  type: ActionType.setEditCategory,
  payload: category,
});

export const pinCategory = (category: Category) => ({
  type: ActionType.pinCategory,
  payload: category,
});

export const reorderCategories = (categories: Category[]) => ({
  type: ActionType.reorderCategories,
  payload: categories,
});
