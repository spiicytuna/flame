import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../store';

// Typescript
import { App, Category } from '../../interfaces';

// UI
import { Icon, Container, SectionHeadline, Spinner, Message } from '../UI';

// CSS
import classes from './Home.module.css';

// Components
import { AppGrid } from '../Apps/AppGrid/AppGrid';
import { BookmarkGrid } from '../Bookmarks/BookmarkGrid/BookmarkGrid';
import { SearchBar } from '../SearchBar/SearchBar';
import { Header } from './Header/Header';

// Utils
import { escapeRegex } from '../../utility';

export const Home = (): JSX.Element => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const {
    apps: { apps, loading: appsLoading },
    // NOTE: there is ONE categories list in the bookmarks slice; it contains both sections.
    bookmarks: { categories, loading: bookmarksLoading },
    config: { config },
    auth: { isAuthenticated },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { getApps, getCategoriesForSection } = bindActionCreators(actionCreators, dispatch);

  // Local search query
  const [localSearch, setLocalSearch] = useState<null | string>(null);
  const [appSearchResult, setAppSearchResult] = useState<null | App[]>(null);
  const [bookmarkSearchResult, setBookmarkSearchResult] = useState<null | Category[]>(null);

  // Unconditionally load apps & categories on first mount
  useEffect(() => {
    const fetchData = async () => {
      setIsPageLoading(true);
  
      // Run these sequentially to prevent the race condition in the thunk
      await getApps();
      await getCategoriesForSection('apps');
      await getCategoriesForSection('bookmarks'); // This now runs AFTER 'apps' is in the state
  
      setIsPageLoading(false);
    };
  
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Derive app-only categories for grouping Applications
  const appCategories = useMemo(
    () => (categories || []).filter((c: any) => c.section === 'apps'),
    [categories]
  );

  // Search
  useEffect(() => {
    if (localSearch) {
      // Search through apps
      const re = new RegExp(escapeRegex(localSearch), 'i');
      setAppSearchResult(apps.filter(({ name, description }) => re.test(`${name} ${description}`)));

      // Search through bookmarks — build a synthetic “Search Results” category
      const base: Category | undefined = categories[0];
      const searchCategory: Category = base
        ? { ...base }
        : // minimal shape in case categories is empty
          ({ id: 0, name: '', isPinned: false, isPublic: true, orderId: 0 } as any);

      searchCategory.name = 'Search Results';
      searchCategory.bookmarks = (categories ?? [])
        .flatMap(({ bookmarks }) => bookmarks ?? [])
        .filter(({ name }) => re.test(name));

      setBookmarkSearchResult([searchCategory]);
    } else {
      setAppSearchResult(null);
      setBookmarkSearchResult(null);
    }
  }, [localSearch, apps, categories]);

  return (
    <Container>
      {!config.hideSearch ? (
        <SearchBar
          setLocalSearch={setLocalSearch}
          appSearchResult={appSearchResult}
          bookmarkSearchResult={bookmarkSearchResult}
        />
      ) : (
        <div></div>
      )}

      <Header />

      {!isAuthenticated &&
      !apps.some((a) => a.isPinned) &&
      !categories.some((c) => c.isPinned) ? (
        <Message>
          Welcome to Flame! Go to <Link to="/settings/app">/settings</Link>, login and start
          customizing your new homepage
        </Message>
      ) : null}

      {/* Applications */}
      {!config.hideApps && (isAuthenticated || apps.some((a) => a.isPinned)) ? (
        <Fragment>
          <SectionHeadline title="Applications" link="/applications" />
	  {isPageLoading ? (
            // wait for BOTH slices so we can group by category on first paint
            <Spinner />
          ) : appCategories.length === 0 ? (
            // Fallback to previous A→Z if there truly are no app categories
            <AppGrid apps={apps} searching={!!localSearch} />
          ) : (
            <>
              {appCategories
                .slice()
                .sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0))
                .map((cat) => {
                  const list = (apps || []).filter((a) => a.categoryId === cat.id);
                  if (list.length === 0) return null;
                  return (
                    <div key={cat.id} style={{ marginBottom: '2rem' }}>
                      <h2 style={{ margin: '0 0 0.5rem' }}>{cat.name}</h2>
                      <AppGrid apps={list} searching={!!localSearch} />
                    </div>
                  );
                })}
      
              {(apps || []).some((a) => a.categoryId == null) && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ margin: '0 0 0.5rem' }}>Uncategorized</h2>
                  <AppGrid
                    apps={(apps || []).filter((a) => a.categoryId == null)}
                    searching={!!localSearch}
                  />
                </div>
              )}
            </>
          )}
      
          <div className={classes.HomeSpace}></div>
        </Fragment>
      ) : null}
      
      {/* Bookmarks */}
      {!config.hideCategories && (isAuthenticated || categories.some((c) => c.isPinned)) ? (
        <Fragment>
          <SectionHeadline title="Bookmarks" link="/bookmarks" />
          {bookmarksLoading ? (
            <Spinner />
          ) : (
            <BookmarkGrid
              categories={
                !bookmarkSearchResult
                  ? categories.filter(
                      ({ isPinned, bookmarks }) => isPinned && (bookmarks?.length ?? 0) > 0
                    )
                  : bookmarkSearchResult
              }
              totalCategories={categories.length}
              searching={!!localSearch}
              fromHomepage={true}
            />
          )}
        </Fragment>
      ) : null}

      <Link to="/settings" className={classes.SettingsButton}>
        <Icon icon="mdiCog" color="var(--color-background)" />
      </Link>
    </Container>
  );
};
