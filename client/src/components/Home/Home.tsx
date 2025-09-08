import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { getCategoriesForSection } from '../../store/reducers/category';
import { fetchHomepageData } from '../../store/action-creators/app';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../store';
import { ActionType } from '../../store/action-types'; 

// Typescript
import { App, Category } from '../../interfaces';

// UI
import { Icon, Container, SectionHeadline, Spinner, Message } from '../UI';
import { motion, AnimatePresence } from 'framer-motion';

// CSS
import classes from './Home.module.css';

// Components
import { AppGrid } from '../Apps/AppGrid/AppGrid';
import { BookmarkGrid } from '../Bookmarks/BookmarkGrid/BookmarkGrid';
import { SearchBar } from '../SearchBar/SearchBar';
import { Header } from './Header/Header';

// Utils
import { escapeRegex, applyAuth } from '../../utility';

// collapse cats mdi icons
const CollapseToggle = ({
  isHovered,
  config,
}: {
  isHovered: boolean;
  config: State['config']['config'];
}) => {
  // fallback => defaults
  const iconName = isHovered
    ? config.categoryCollapseIconHover || 'mdiChevronRightCircleOutline'
    : config.categoryCollapseIcon || 'mdiChevronRight';

  return (
    <Icon
      icon={iconName}
      color={isHovered ? 'var(--color-primary)' : 'var(--color-accent)'}
      className={classes.SmallIcon}
    />
  );
};

export const Home = (): JSX.Element => {
  const {
    apps: { apps },
    categories: { categories, loading: categoriesLoading },
    config: { config },
    auth: { isAuthenticated },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { updateCategoryCollapseState } = bindActionCreators(actionCreators, dispatch);

  // Local search query
  const [localSearch, setLocalSearch] = useState<null | string>(null);
  const [appSearchResult, setAppSearchResult] = useState<null | App[]>(null);
  const [bookmarkSearchResult, setBookmarkSearchResult] = useState<null | Category[]>(null);

  // Unconditionally load apps & categories on first mount
  useEffect(() => {
    dispatch(fetchHomepageData() as any);
  }, [dispatch]);
  

  // Derive app-only categories for grouping Applications
  const appCategories = useMemo(
    () => (categories || []).filter((c: any) => c.section === 'apps'),
    [categories],
  );

  const [didInitCollapse, setDidInitCollapse] = useState(false);
  const [collapseState, setCollapseState] = useState<Record<number, boolean>>({});
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    if (!didInitCollapse && appCategories.length > 0) {
      const initialState = Object.fromEntries(
        appCategories.map((cat) => [cat.id, cat.isCollapsed ?? false]),
      );
      setCollapseState(initialState);
      setDidInitCollapse(true);
    }
  }, [appCategories, didInitCollapse]);

  // Update handler
  const toggleCollapsed = async (catId: number) => {
    const newState = !collapseState[catId];
    setCollapseState((prev) => ({ ...prev, [catId]: newState }));
   
    try {
      await fetch(`/api/categories/${catId}`, {
	method: 'PATCH',
	headers: {
	  'Content-Type': 'application/json',
	  ...applyAuth(),
	},
	body: JSON.stringify({ isCollapsed: newState }),
      });
      dispatch(updateCategoryCollapseState(catId, newState));
    } catch (err) {
      console.error(`Failed to update category ${catId}:`, err);
      alert('Failed to save collapse state. Please try again.');
    }
  };


  // Search
  useEffect(() => {
    if (localSearch) {
      // Search through apps
      const re = new RegExp(escapeRegex(localSearch), 'i');
      setAppSearchResult(apps.filter(({ name, description }) => re.test(`${name} ${description}`)));

      // search bookmarks => synthetic “Search Results” category
      const base: Category | undefined = categories[0];
      const searchCategory: Category = base
        ? { ...base }
        : ({ id: 0, name: '', isPinned: false, isPublic: true, orderId: 0 } as any);

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
          {categoriesLoading ? (
            <Spinner />
          ) : appSearchResult ? (
            <AppGrid apps={appSearchResult} searching={!!localSearch} />
          ) : appCategories.length === 0 ? (
            <AppGrid apps={apps} searching={!!localSearch} />
          ) : (
            <>
              {appCategories
                .slice()
                .sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0))
                .map((cat) => {
                  const list = (apps || []).filter((a) => a.categoryId === cat.id);
                  if (list.length === 0) return null;

                  const isCollapsed = collapseState[cat.id] ?? false;
                  const isCurrentlyHovered = hoveredId === cat.id;
		  const buttonClasses = `${classes.toggleButton} ${!isCollapsed ? classes.isExpanded : ''}`;

                  return (
                    <div key={cat.id} style={{ marginBottom: '2rem' }}>
                      <h2 className={classes.categoryTitle}>
			{/* settings => interface => collapse => true|false */}
			{config.collapseCategories !== false && (
                          <button
                            onClick={() => toggleCollapsed(cat.id)}
                            onMouseEnter={() => setHoveredId(cat.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={buttonClasses}
                          >
                            <CollapseToggle isHovered={isCurrentlyHovered} config={config} />
                          </button>
			)}
                        {cat.name}
                      </h2>

		      <AnimatePresence>
			{!isCollapsed && (
                        <motion.div
			  style={{ overflow: 'hidden' }}
                          key="app-grid-content"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={{
                            visible: { opacity: 1, height: 'auto' },
                            hidden: { opacity: 0, height: 0 },
                          }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                          <AppGrid apps={list} searching={!!localSearch} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  );
                })}
              {(apps || []).some((a) => a.categoryId == null) && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: '16px', fontWeight: 400, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                    Uncategorized
                  </h2>
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
          {categoriesLoading ? (
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
