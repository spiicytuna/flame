import axios from 'axios';
import { Dispatch } from 'redux';
import { applyAuth } from '../../utility';
import { ActionType } from '../action-types';

import {
  ApiResponse,
  Category,
  Config,
  NewCategory,
} from '../../interfaces';

import {
  AddCategory,
  DeleteCategory,
  PinCategory,
  ReorderCategories,
  SetEditCategory,
  SortCategories,
  UpdateCategory,
  GetCategories,
  GetCategoriesSuccess,
  GetCategoriesError,
} from '../actions/categoryActions';

export const getCategoriesForSection =
  (section: 'bookmarks' | 'apps') =>
  async (dispatch: any, getState: any) => {
    dispatch({ type: ActionType.getCategories });

    try {
      const res = await axios.get<ApiResponse<Category[]>>(
        `/api/categories?section=${section}`,
        { headers: applyAuth() }
      );

      const incoming = res.data.data ?? [];
      const state = getState();
      const current: Category[] = state?.categories?.categories ?? [];

      const incomingIds = new Set(incoming.map((c) => c.id));
      const kept = current.filter(
        (c: any) => c.section !== section && !incomingIds.has(c.id)
      );

      const merged = [...kept, ...incoming];

      dispatch({
        type: ActionType.getCategoriesSuccess,
        payload: merged,
      });
    } catch (err: any) {
      dispatch({
        type: ActionType.getCategoriesError,
        payload: err?.message || 'Failed to fetch categories',
      });
    }
  };

export const expandAllCategories = () => async (dispatch: Dispatch) => {
  try {
    // expand cats
    await axios.put('/api/categories/expand-all', {}, { headers: applyAuth() });

    // Redux => expand cats
    dispatch({ type: ActionType.expandAllCategories });
  } catch (err) {
    console.error('Failed to expand all categories:', err);
  }
};

export const addCategory =
  (formData: NewCategory) => async (dispatch: Dispatch<AddCategory>) => {
    try {
      const res = await axios.post<ApiResponse<Category>>(
        '/api/categories',
        formData,
        { headers: applyAuth() }
      );

      dispatch<any>({
        type: ActionType.createNotification,
        payload: {
          title: 'Success',
          message: `Category ${formData.name} created`,
        },
      });

      dispatch({
        type: ActionType.addCategory,
        payload: res.data.data,
      });

      dispatch<any>(sortCategories());
    } catch (err) {
      console.log(err);
    }
  };

export const pinCategory =
  (category: Category) => async (dispatch: Dispatch<PinCategory>) => {
    try {
      const { id, isPinned, name } = category;
      const res = await axios.put<ApiResponse<Category>>(
        `/api/categories/${id}`,
        { isPinned: !isPinned },
        { headers: applyAuth() }
      );

      const status = isPinned
        ? 'unpinned from Homescreen'
        : 'pinned to Homescreen';

      dispatch<any>({
        type: ActionType.createNotification,
        payload: {
          title: 'Success',
          message: `Category ${name} ${status}`,
        },
      });

      dispatch({
        type: ActionType.pinCategory,
        payload: res.data.data,
      });
    } catch (err) {
      console.log(err);
    }
  };

export const deleteCategory =
  (id: number) => async (dispatch: Dispatch<DeleteCategory>) => {
    try {
      await axios.delete<ApiResponse<{}>>(`/api/categories/${id}`, {
        headers: applyAuth(),
      });

      dispatch<any>({
        type: ActionType.createNotification,
        payload: {
          title: 'Success',
          message: `Category deleted`,
        },
      });

      dispatch({
        type: ActionType.deleteCategory,
        payload: id,
      });
    } catch (err) {
      console.log(err);
    }
  };

export const updateCategory =
  (id: number, formData: NewCategory) =>
  async (dispatch: Dispatch<UpdateCategory>) => {
    try {
      const res = await axios.put<ApiResponse<Category>>(
        `/api/categories/${id}`,
        formData,
        { headers: applyAuth() }
      );

      dispatch<any>({
        type: ActionType.createNotification,
        payload: {
          title: 'Success',
          message: `Category ${formData.name} updated`,
        },
      });

      dispatch({
        type: ActionType.updateCategory,
        payload: res.data.data,
      });

      dispatch<any>(sortCategories());
    } catch (err) {
      console.log(err);
    }
  };

export const sortCategories =
  () => async (dispatch: Dispatch<SortCategories>) => {
    try {
      const res = await axios.get<ApiResponse<Config>>('/api/config');

      dispatch({
        type: ActionType.sortCategories,
        payload: res.data.data.useOrdering,
      });
    } catch (err) {
      console.log(err);
    }
  };

export const reorderCategories =
  (categories: Category[]) =>
  async (dispatch: Dispatch<ReorderCategories>) => {
    interface ReorderQuery {
      categories: {
        id: number;
        orderId: number;
      }[];
    }

    try {
      const updateQuery: ReorderQuery = { categories: [] };

      categories.forEach((category, index) =>
        updateQuery.categories.push({
          id: category.id,
          orderId: index + 1,
        })
      );

      await axios.put<ApiResponse<{}>>(
        '/api/categories/0/reorder',
        updateQuery,
        { headers: applyAuth() }
      );

      dispatch({
        type: ActionType.reorderCategories,
        payload: categories,
      });
    } catch (err) {
      console.log(err);
    }
  };

export const setEditCategory =
  (category: Category | null) =>
  (dispatch: Dispatch<SetEditCategory>) => {
    dispatch({
      type: ActionType.setEditCategory,
      payload: category,
    });
  };

export const updateCategoryCollapseState = (categoryId: number, isCollapsed: boolean) => {
  return {
    type: ActionType.updateCategoryCollapseState,
    payload: { categoryId, isCollapsed },
  };
};
