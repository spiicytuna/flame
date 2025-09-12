import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { autoLogin, getConfig } from './store/action-creators';
import { actionCreators, store } from './store';
import { State } from './store/reducers';

// Utils
import { checkVersion, decodeToken, parsePABToTheme } from './utility';

// Routes
import { Home } from './components/Home/Home';
import { Apps } from './components/Apps/Apps';
import { Settings } from './components/Settings/Settings';
import { Bookmarks } from './components/Bookmarks/Bookmarks';
import { NotificationCenter } from './components/NotificationCenter/NotificationCenter';

// routing
import { ProtectedRoute } from './components/Routing/ProtectedRoute';

// Get config
store.dispatch<any>(getConfig());

// Validate token
if (localStorage.token) {
  store.dispatch<any>(autoLogin());
}

export const App = (): JSX.Element => {
  const { config, loading } = useSelector((state: State) => state.config);
  const dispatch = useDispatch();
  const { fetchQueries, setTheme, logout, createNotification, fetchThemes } =
    bindActionCreators(actionCreators, dispatch);

  useEffect(() => {
    const id = window.setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
  
      try {
        const { exp } = decodeToken(token) as { exp?: number };
        if (exp && Date.now() > exp * 1000) {
          // clear token+logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete axios.defaults.headers.common['Authorization'];
  
          logout();
          createNotification({
            title: 'Info',
            message: 'Session expired. You have been logged out',
          });
  
          window.clearInterval(id);
        }
      } catch {
        localStorage.removeItem('token');
        logout();
        window.clearInterval(id);
      }
    }, 1000);
  
    fetchThemes();
    if (localStorage.theme) setTheme(parsePABToTheme(localStorage.theme));
    fetchQueries();
  
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (config.automaticUpdates && (config.showPopups ?? true)) {
      const useDefaults = config.useDefaults ?? true;
      const defaultUpdateUrl = undefined;
      const urlToUse = useDefaults ? defaultUpdateUrl : (config.updateUrl || undefined);
      void checkVersion(false, urlToUse, true); // settings => about => version => popups enabled
    }
  }, [config.automaticUpdates, config.showPopups, config.useDefaults, config.updateUrl]);
  
  // If there is no user theme, set the default one
  useEffect(() => {
    if (!loading && !localStorage.theme) {
      setTheme(parsePABToTheme(config.defaultTheme), false);
    }
  }, [loading, config.defaultTheme]);

  return (
    <>
      <BrowserRouter>
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
            <Route
              path="/settings/*"
              element={
                  <Settings />
              }
            />
          </Routes>
      </BrowserRouter>
      <NotificationCenter />
    </>
  );
};
