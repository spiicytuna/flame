import axios from 'axios';
import { Dispatch } from 'redux';
import { applyAuth } from '../../utility';
import { ActionType } from '../action-types';
import { ApiResponse, Category } from '../../interfaces';

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
      // IMPORTANT: Update this line to point to the new state slice
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
