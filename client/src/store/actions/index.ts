import { App } from '../../interfaces';

import {
  AddThemeAction,
  DeleteThemeAction,
  EditThemeAction,
  FetchThemesAction,
  SetThemeAction,
  UpdateThemeAction,
} from './theme';

import {
  AddQueryAction,
  DeleteQueryAction,
  FetchQueriesAction,
  GetConfigAction,
  UpdateConfigAction,
  UpdateQueryAction,
} from './config';

import {
  ClearNotificationAction,
  CreateNotificationAction,
} from './notification';

import {
  GetAppsAction,
  PinAppAction,
  AddAppAction,
  DeleteAppAction,
  UpdateAppAction,
  ReorderAppsAction,
  SortAppsAction,
  SetEditAppAction,
} from './app';

import {
  AddBookmarkAction,
  DeleteBookmarkAction,
  UpdateBookmarkAction,
  SetEditBookmarkAction,
  ReorderBookmarksAction,
  SortBookmarksAction,
} from './bookmark';

import {
  AuthErrorAction,
  AutoLoginAction,
  LoginAction,
  LogoutAction,
} from './auth';

import { CategoryAction } from './categoryActions';

export type Action =
  // Theme
  | SetThemeAction
  | FetchThemesAction
  | AddThemeAction
  | DeleteThemeAction
  | UpdateThemeAction
  | EditThemeAction
  // Config
  | GetConfigAction
  | UpdateConfigAction
  | AddQueryAction
  | DeleteQueryAction
  | FetchQueriesAction
  | UpdateQueryAction
  // Notifications
  | CreateNotificationAction
  | ClearNotificationAction
  // Apps
  | GetAppsAction<undefined | App[]>
  | PinAppAction
  | AddAppAction
  | DeleteAppAction
  | UpdateAppAction
  | ReorderAppsAction
  | SortAppsAction
  | SetEditAppAction
  // Categories
  | CategoryAction
  // Bookmarks
  | AddBookmarkAction
  | DeleteBookmarkAction
  | UpdateBookmarkAction
  | SetEditBookmarkAction
  | ReorderBookmarksAction
  | SortBookmarksAction
  // Auth
  | LoginAction
  | LogoutAction
  | AutoLoginAction
  | AuthErrorAction;
