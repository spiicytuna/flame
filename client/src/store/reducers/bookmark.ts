import { Bookmark, Category } from '../../interfaces';
import { sortData } from '../../utility';
import { ActionType } from '../action-types';
import { Action } from '../actions';

interface BookmarksState {
  loading: boolean;
  errors: string | undefined;
  categories: Category[];
  categoryInEdit: Category | null;
  bookmarkInEdit: Bookmark | null;
}

const initialState: BookmarksState = {
  loading: true,
  errors: undefined,
  categories: [],
  categoryInEdit: null,
  bookmarkInEdit: null,
};

export const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: Action
): BookmarksState => {
  switch (action.type) {
    case ActionType.getCategories: {
      return {
        ...state,
        loading: true,
        errors: undefined,
      };
    }

    case ActionType.getCategoriesSuccess: {
      return {
        ...state,
        loading: false,
        categories: action.payload,
      };
    }

    case ActionType.addCategory: {
      return {
        ...state,
        categories: [...state.categories, { ...action.payload, bookmarks: [] }],
      };
    }

    case ActionType.addBookmark: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.categoryId
      );
      if (categoryIdx < 0) return state;

      const baseCategory = state.categories[categoryIdx];
      const current = baseCategory.bookmarks ?? [];

      const targetCategory = {
        ...baseCategory,
        bookmarks: [...current, action.payload],
      };

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          targetCategory,
          ...state.categories.slice(categoryIdx + 1),
        ],
        categoryInEdit: targetCategory,
      };
    }

    case ActionType.pinCategory: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.id
      );
      if (categoryIdx < 0) return state;

      const current = state.categories[categoryIdx].bookmarks ?? [];

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          {
            ...action.payload,
            bookmarks: [...current],
          },
          ...state.categories.slice(categoryIdx + 1),
        ],
      };
    }

    case ActionType.deleteCategory: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload
      );
      if (categoryIdx < 0) return state;

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          ...state.categories.slice(categoryIdx + 1),
        ],
      };
    }

    case ActionType.updateCategory: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.id
      );
      if (categoryIdx < 0) return state;

      const current = state.categories[categoryIdx].bookmarks ?? [];

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          {
            ...action.payload,
            bookmarks: [...current],
          },
          ...state.categories.slice(categoryIdx + 1),
        ],
      };
    }

    case ActionType.deleteBookmark: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.categoryId
      );
      if (categoryIdx < 0) return state;

      const baseCategory = state.categories[categoryIdx];
      const current = baseCategory.bookmarks ?? [];

      const targetCategory = {
        ...baseCategory,
        bookmarks: current.filter(
          (bookmark) => bookmark.id !== action.payload.bookmarkId
        ),
      };

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          targetCategory,
          ...state.categories.slice(categoryIdx + 1),
        ],
        categoryInEdit: targetCategory,
      };
    }

    case ActionType.updateBookmark: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.categoryId
      );
      if (categoryIdx < 0) return state;

      const baseCategory = state.categories[categoryIdx];
      const current = baseCategory.bookmarks ?? [];

      const bookmarkIdx = current.findIndex(
        (bookmark) => bookmark.id === action.payload.id
      );
      if (bookmarkIdx < 0) return state;

      const targetCategory = {
        ...baseCategory,
        bookmarks: [
          ...current.slice(0, bookmarkIdx),
          action.payload,
          ...current.slice(bookmarkIdx + 1),
        ],
      };

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          targetCategory,
          ...state.categories.slice(categoryIdx + 1),
        ],
        categoryInEdit: targetCategory,
      };
    }

    case ActionType.sortCategories: {
      // sortData<T> expects T to have orderId: number
      type SortableCategory = Category & { orderId: number };
      const sortable: SortableCategory[] = state.categories.map((c) => ({
        ...c,
        orderId: c.orderId ?? 0,
      })) as SortableCategory[];

      const sorted = sortData<SortableCategory>(sortable, action.payload);

      return {
        ...state,
        // cast back to Category[]; we only coerced orderId for sorting
        categories: sorted as unknown as Category[],
      };
    }

    case ActionType.reorderCategories: {
      return {
        ...state,
        categories: action.payload,
      };
    }

    case ActionType.setEditCategory: {
      return {
        ...state,
        categoryInEdit: action.payload,
      };
    }

    case ActionType.setEditBookmark: {
      return {
        ...state,
        bookmarkInEdit: action.payload,
      };
    }

    case ActionType.reorderBookmarks: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.categoryId
      );
      if (categoryIdx < 0) return state;

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          {
            ...state.categories[categoryIdx],
            bookmarks: action.payload.bookmarks ?? [],
          },
          ...state.categories.slice(categoryIdx + 1),
        ],
      };
    }

    case ActionType.sortBookmarks: {
      const categoryIdx = state.categories.findIndex(
        (category) => category.id === action.payload.categoryId
      );
      if (categoryIdx < 0) return state;

      const current = state.categories[categoryIdx].bookmarks ?? [];
      const sortedBookmarks = sortData<Bookmark>(
        current,
        action.payload.orderType
      );

      return {
        ...state,
        categories: [
          ...state.categories.slice(0, categoryIdx),
          {
            ...state.categories[categoryIdx],
            bookmarks: sortedBookmarks,
          },
          ...state.categories.slice(categoryIdx + 1),
        ],
      };
    }

    default:
      return state;
  }
};
