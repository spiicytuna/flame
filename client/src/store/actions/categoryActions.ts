import { ActionType } from '../action-types';
import { App, Category, Bookmark } from '../../interfaces';

export interface GetCategories {
  type: ActionType.getCategories;
}
export interface GetCategoriesSuccess {
  type: ActionType.getCategoriesSuccess;
  payload: {
    categories: Category[];
    section: 'apps' | 'bookmarks';
  };
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
export interface AddBookmark {
  type: ActionType.addBookmark;
  payload: Bookmark;
}
export interface DeleteBookmark {
  type: ActionType.deleteBookmark;
  payload: {
    bookmarkId: number;
    categoryId: number;
  };
}
export interface FetchHomepageDataSuccess {
  type: ActionType.fetchHomepageDataSuccess;
  payload: {
    apps: App[];
    categories: Category[];
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
  | AddBookmark
  | DeleteBookmark;
