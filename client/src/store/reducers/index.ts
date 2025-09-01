import { combineReducers } from 'redux';

import { themeReducer } from './theme';
import { configReducer } from './config';
import { notificationReducer } from './notification';
import { appsReducer } from './app';
import { bookmarksReducer } from './bookmark';
import { authReducer } from './auth';
import { categoriesReducer } from './category';

export const reducers = combineReducers({
  theme: themeReducer,
  config: configReducer,
  notification: notificationReducer,
  apps: appsReducer,
  bookmarks: bookmarksReducer,
  auth: authReducer,
  categories: categoriesReducer
});

export type State = ReturnType<typeof reducers>;
