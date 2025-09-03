import { BrowserRouter, Route, Switch } from 'react-router-dom';
import 'external-svg-loader';

// Redux
import { autoLogin, getConfig } from './store/action-creators';
import { store } from './store';

// Shared layout logic shouldn't live in apps for all section, moved to:
import { MainLayout } from './components/Layout/MainLayout';

// Routes
import { Home } from './components/Home/Home';
import { Apps } from './components/Apps/Apps';
import { Settings } from './components/Settings/Settings';
import { Bookmarks } from './components/Bookmarks/Bookmarks';
import { NotificationCenter } from './components/NotificationCenter/NotificationCenter';

// Get config
store.dispatch<any>(getConfig());

// Validate token
if (localStorage.token) {
  store.dispatch<any>(autoLogin());
}

export const App = (): JSX.Element => {
  return (
    <>
      <BrowserRouter>
        <MainLayout>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/settings" component={Settings} />
            <Route path="/applications" component={Apps} />
            <Route path="/bookmarks" component={Bookmarks} />
          </Switch>
        </MainLayout>
      </BrowserRouter>
      <NotificationCenter />
    </>
  );
};
