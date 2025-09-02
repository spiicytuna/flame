import { Bookmark } from '../../interfaces';
import { ActionType } from '../action-types';
import { Action } from '../actions';

interface BookmarksState {
  bookmarkInEdit: Bookmark | null;
}

const initialState: BookmarksState = {
  bookmarkInEdit: null,
};

export const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: Action
): BookmarksState => {
  switch (action.type) {
    case ActionType.setEditBookmark:
      return {
        ...state,
        bookmarkInEdit: action.payload,
      };

    default:
      return state;
  }
};
