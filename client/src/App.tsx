import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Redux (bootstrap)
import { autoLogin, getConfig } from './store/action-creators';
import { store } from './store';

// Layout
import { MainLayout } from './components/Layout/MainLayout';

// Pages
import { Home } from './components/Home/Home';
import { Apps } from './components/Apps/Apps';
import { Settings } from './components/Settings/Settings';
import { Bookmarks } from './components/Bookmarks/Bookmarks';
import { NotificationCenter } from './components/NotificationCenter/NotificationCenter';

// Routing
import { ProtectedRoute } from './components/Routing/ProtectedRoute';

// App level
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from './store/reducers';
import { actionCreators } from './store';

import { decodeToken } from 'react-jwt';
import axios from 'axios';
import { checkVersion, parsePABToTheme } from './utility';

// Get config
store.dispatch<any>(getConfig());

// Validate token
if (localStorage.token) {
  store.dispatch<any>(autoLogin());
}

export const App = (): JSX.Element => {
  const dispatch = useDispatch();
  const { config, loading } = useSelector((state: State) => state.config);
  const { fetchQueries, setTheme, logout, createNotification, fetchThemes } =
    bindActionCreators(actionCreators, dispatch);

  useEffect(() => {
    const id = window.setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const { exp } = decodeToken(token) as { exp?: number };
        if (exp && Date.now() > exp * 1000) {
          // clear token + logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          try {
            delete axios.defaults.headers.common['Authorization'];
          } catch {
            /* --- */
          }

          logout();
          createNotification({
            title: 'Info',
            message: 'Session expired. You have been logged out',
          });

          window.clearInterval(id);
        }
      } catch {
        // malformed token: clear + logout
        localStorage.removeItem('token');
        logout();
        window.clearInterval(id);
      }
    }, 1000);

    // themes & queries bootstrap
    fetchThemes();
    if (localStorage.theme) {
      setTheme(parsePABToTheme(localStorage.theme));
    }
    fetchQueries();

    return () => window.clearInterval(id);
  }, [createNotification, fetchQueries, fetchThemes, logout, setTheme]);

  // check for updates => popups enabled
  useEffect(() => {
    if (config.automaticUpdates && (config.showPopups ?? true)) {
      const useDefaults = config.useDefaults ?? true;
      const urlOverride = useDefaults ? undefined : (config.updateUrl || undefined);
      void checkVersion(false, urlOverride, true);
    }
  }, [
    config.automaticUpdates,
    config.showPopups,
    config.useDefaults,
    config.updateUrl,
  ]);

  // default theme => none set
  useEffect(() => {
    if (!loading && !localStorage.theme) {
      setTheme(parsePABToTheme(config.defaultTheme), false);
    }
  }, [loading, config.defaultTheme, setTheme]);

  return (
    <>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            {/* Public route */}
            <Route path="/" element={<Home />} />

            {/* Protected Routes */}
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Apps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <Bookmarks />
                </ProtectedRoute>
              }
            />
            <Route path="/settings/*" element={<Settings />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
      <NotificationCenter />
    </>
  );
};
