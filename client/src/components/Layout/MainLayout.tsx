import { useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getHomePageData } from '../../store/action-creators/bookmark';
import { store, actionCreators } from '../../store';
import { State } from '../../store/reducers';
import { checkVersion, decodeToken, parsePABToTheme } from '../../utility';

interface Props {
  children: ReactNode;
}

export const MainLayout = ({ children }: Props): JSX.Element => {
  const { config, loading } = useSelector((state: State) => state.config);
  const { isAuthenticated } = useSelector((state: State) => state.auth);

  const dispatch = useDispatch();
  const { fetchQueries, setTheme, logout, createNotification, fetchThemes } =
    bindActionCreators(actionCreators, dispatch);

  // This hook loads ALL initial data
  useEffect(() => {
    store.dispatch<any>(getHomePageData());

    const tokenIsValid = setInterval(() => {
      if (localStorage.token) {
        const expiresIn = decodeToken(localStorage.token).exp * 1000;
        const now = new Date().getTime();
        if (now > expiresIn) {
          logout();
          createNotification({
            title: 'Info',
            message: 'Session expired. You have been logged out',
          });
        }
      }
    }, 1000);

    fetchThemes();
    if (localStorage.theme) {
      setTheme(parsePABToTheme(localStorage.theme));
    }
    checkVersion();
    fetchQueries();

    return () => window.clearInterval(tokenIsValid);
  }, [isAuthenticated]);

  // If there is no user theme, set the default one
  useEffect(() => {
    if (!loading && !localStorage.theme) {
      setTheme(parsePABToTheme(config.defaultTheme), false);
    }
  }, [loading, config]);

  return <>{children}</>;
};
