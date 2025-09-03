import { Bookmark } from '../../interfaces';
import { ActionType } from '../action-types';

export interface AddBookmarkAction {
  type: ActionType.addBookmark;
  payload: Bookmark;
}

export interface DeleteBookmarkAction {
  type: ActionType.deleteBookmark;
  payload: {
    bookmarkId: number;
    categoryId: number;
  };
}

export interface UpdateBookmarkAction {
  type: ActionType.updateBookmark;
  payload: Bookmark;
}

export interface SetEditBookmarkAction {
  type: ActionType.setEditBookmark;
  payload: Bookmark | null;
}

export interface ReorderBookmarksAction {
  type: ActionType.reorderBookmarks;
  payload: {
    bookmarks: Bookmark[];
    categoryId: number;
  };
}

export interface SortBookmarksAction {
  type: ActionType.sortBookmarks;
  payload: {
    orderType: string;
    categoryId: number;
  };
}
