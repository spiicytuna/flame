import { ActionType } from '../action-types';
import { Action } from '../actions/index';
import { App, Category } from '../../interfaces';
import { sortData } from '../../utility';

interface AppsState {
  loading: boolean;
  apps: App[];
  totalApps: number;
  errors: string | undefined;
  appInUpdate: App | null;
}

const initialState: AppsState = {
  loading: true,
  apps: [],
  totalApps: 0,
  errors: undefined,
  appInUpdate: null,
};

export const appsReducer = (
  state: AppsState = initialState,
  action: Action
): AppsState => {
  switch (action.type) {
    case ActionType.getAppsSuccess: {
      const payload = action.payload as { apps: App[], totalApps: number };
      return {
        ...state,
        loading: false,
        apps: payload.apps || [],
        totalApps: payload.totalApps || 0,
      };
    }

    case ActionType.fetchHomepageDataSuccess: {
      return {
        ...state,
        loading: false,
        apps: action.payload.apps.apps,
        totalApps: action.payload.apps.totalApps,
      };
    }

    case ActionType.pinApp: {
      const appIdx = state.apps.findIndex(
        (app) => app.id === action.payload.id
      );

      return {
        ...state,
        apps: [
          ...state.apps.slice(0, appIdx),
          action.payload,
          ...state.apps.slice(appIdx + 1),
        ],
      };
    }

    case ActionType.addAppSuccess: {
      return {
        ...state,
        apps: [...state.apps, action.payload],
        totalApps: state.totalApps + 1,
      };
    }

    case ActionType.deleteApp: {
      return {
        ...state,
        apps: [...state.apps].filter((app) => app.id !== action.payload),
        totalApps: state.totalApps - 1,
      };
    }

    case ActionType.updateApp: {
      const appIdx = state.apps.findIndex(
        (app) => app.id === action.payload.id
      );

      return {
        ...state,
        apps: [
          ...state.apps.slice(0, appIdx),
          action.payload,
          ...state.apps.slice(appIdx + 1),
        ],
      };
    }

    case ActionType.reorderApps: {
      return {
        ...state,
        apps: action.payload,
      };
    }

    case ActionType.sortApps: {
      return {
        ...state,
        apps: sortData<App>(state.apps, action.payload),
      };
    }

    case ActionType.setEditApp: {
      return {
        ...state,
        appInUpdate: action.payload,
      };
    }

    default:
      return state;
  }
};
