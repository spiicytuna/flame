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
    // fetch => prim data
    store.dispatch<any>(getHomePageData());
    fetchThemes();
    fetchQueries();
    checkVersion();

    // theme
    if (!loading && !localStorage.theme) {
      setTheme(parsePABToTheme(config.defaultTheme), false);
    } else if (localStorage.theme) {
      setTheme(parsePABToTheme(localStorage.theme));
    }

    // Validate token on an interval
    const tokenValidator = setInterval(() => {
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
    }, 5000);

    return () => window.clearInterval(tokenValidator);
  }, [isAuthenticated, dispatch, loading, config.defaultTheme]); // Correct dependency array

  return <>{children}</>;
};
