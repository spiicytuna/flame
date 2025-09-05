import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Redux
import { autoLogin, getConfig } from './store/action-creators';
import { store } from './store';

// Layout
import { MainLayout } from './components/Layout/MainLayout';

// Page Components
import { Home } from './components/Home/Home';
import { Apps } from './components/Apps/Apps';
import { Settings } from './components/Settings/Settings';
import { Bookmarks } from './components/Bookmarks/Bookmarks';
import { NotificationCenter } from './components/NotificationCenter/NotificationCenter';

// routing
import { ProtectedRoute } from './components/Routing/ProtectedRoute';

// config
store.dispatch<any>(getConfig());

if (localStorage.token) {
  store.dispatch<any>(autoLogin());
}

export const App = (): JSX.Element => {
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
            <Route
              path="/settings/*"
              element={
                  <Settings />
              }
            />
          </Routes>
        </MainLayout>
      </BrowserRouter>
      <NotificationCenter />
    </>
  );
};
