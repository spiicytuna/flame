import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { fetchHomepageData } from '../../store/action-creators/app';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../store';

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

const CollapseToggle = ({ isHovered, config }: { isHovered: boolean; config: State['config']['config']; }) => {
  const iconName = isHovered ? config.categoryCollapseIconHover || 'mdiChevronRightCircleOutline' : config.categoryCollapseIcon || 'mdiChevronRight';
  return <Icon icon={iconName} color={isHovered ? 'var(--color-primary)' : 'var(--color-accent)'} className={classes.SmallIcon} />;
};

const LOCAL_APP_COLLAPSE_KEY = 'flame:collapse:apps';

const loadLocalAppCollapse = (): Record<number, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_APP_COLLAPSE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveLocalAppCollapse = (state: Record<number, boolean>) => {
  try {
    localStorage.setItem(LOCAL_APP_COLLAPSE_KEY, JSON.stringify(state));
  } catch {}
};

export const Home = (): JSX.Element => {
  const {
    apps: { apps, totalApps },
    categories: { categories, totalCategories: totalBookmarkCategories, loading: categoriesLoading },
    config: { config },
    auth: { isAuthenticated },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { updateCategoryCollapseState } = bindActionCreators(actionCreators, dispatch);

  const [localSearch, setLocalSearch] = useState<null | string>(null);
  const [appSearchResult, setAppSearchResult] = useState<null | App[]>(null);
  const [bookmarkSearchResult, setBookmarkSearchResult] = useState<null | Category[]>(null);

  useEffect(() => {
    dispatch(fetchHomepageData() as any);
  }, [dispatch]);

  // --- START OF FINALIZED DISPLAY LOGIC ---

  const publiclyVisibleApps = useMemo(() => apps.filter(app => app.isPublic && app.isPinned), [apps]);
  const publiclyVisiblePinnedBookmarkCategories = useMemo(() => categories.filter(c => c.isPinned && c.isPublic && c.section === 'bookmarks'), [categories]);

  const appsToDisplay = isAuthenticated ? apps : publiclyVisibleApps;
  const appCategories = useMemo(() => (categories || []).filter(c => c.section === 'apps' && (isAuthenticated || c.isPublic)), [categories, isAuthenticated]);
  const populatedAppCategories = useMemo(() => appCategories.filter(cat => appsToDisplay.some(app => app.categoryId === cat.id)), [appCategories, appsToDisplay]);
  const hasUncategorizedApps = useMemo(() => appsToDisplay.some(app => app.categoryId == null), [appsToDisplay]);
  const totalAppGroups = populatedAppCategories.length + (hasUncategorizedApps ? 1 : 0);

  const shouldShowAppsSection = !config.hideApps && (isAuthenticated || publiclyVisibleApps.length > 0 || (totalApps === 0 && !isAuthenticated));
  const shouldShowBookmarksSection = !config.hideCategories && (isAuthenticated || publiclyVisiblePinnedBookmarkCategories.length > 0 || (totalBookmarkCategories === 0 && !isAuthenticated));

  const showCombinedEmptyMessage = !isAuthenticated &&
    !config.hideApps && !config.hideCategories &&
    totalApps > 0 && publiclyVisibleApps.length === 0 &&
    totalBookmarkCategories > 0 && publiclyVisiblePinnedBookmarkCategories.length === 0;

  // --- END OF FINALIZED DISPLAY LOGIC ---

  const [didInitCollapse, setDidInitCollapse] = useState(false);
  const [collapseState, setCollapseState] = useState<Record<number, boolean>>({});
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    if (!didInitCollapse && appCategories.length > 0) {
      const local = !isAuthenticated ? loadLocalAppCollapse() : {};
      const initialState = Object.fromEntries(
        appCategories.map((cat) => [cat.id, local[cat.id] ?? (cat.isCollapsed ?? false)])
      );
      setCollapseState(initialState);
      setDidInitCollapse(true);
    }
  }, [appCategories, didInitCollapse, isAuthenticated]);

  const toggleCollapsed = async (catId: number) => {
    const newState = !collapseState[catId];

    // Update local UI immediately
    setCollapseState((prev) => {
      const next = { ...prev, [catId]: newState };
      if (!isAuthenticated) saveLocalAppCollapse(next);
      return next;
    });
    dispatch(updateCategoryCollapseState(catId, newState));

    // Persist to server only when authenticated
    if (isAuthenticated) {
      try {
        await fetch(`/api/categories/${catId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...applyAuth() },
          body: JSON.stringify({ isCollapsed: newState }),
        });
      } catch (err) {
        console.error(`Failed to persist category ${catId} collapse state:`, err);
      }
    }
  };

  useEffect(() => {
    if (localSearch) {
      const re = new RegExp(escapeRegex(localSearch), 'i');
      setAppSearchResult(appsToDisplay.filter(({ name, description }) => re.test(`${name} ${description}`)));
      const base: Category | undefined = categories[0];
      const searchCategory: Category = base ? { ...base } : ({ id: 0, name: '', isPinned: false, isPublic: true, orderId: 0 } as any);
      searchCategory.name = 'Search Results';
      searchCategory.bookmarks = (categories ?? []).filter(c => isAuthenticated || c.isPublic).flatMap(({ bookmarks }) => bookmarks ?? []).filter(b => (isAuthenticated || b.isPublic) && re.test(b.name));
      setBookmarkSearchResult([searchCategory]);
    } else {
      setAppSearchResult(null);
      setBookmarkSearchResult(null);
    }
  }, [localSearch, appsToDisplay, categories, isAuthenticated]);

  return (
    <Container>
      {!config.hideSearch && <SearchBar setLocalSearch={setLocalSearch} appSearchResult={appSearchResult} bookmarkSearchResult={bookmarkSearchResult} />}
      <Header />

      {!isAuthenticated && !totalApps && !totalBookmarkCategories ? (
        <Message>Welcome to Flame! Go to <Link to="/settings/app">/settings</Link> to get started.</Message>
      ) : null}

      {showCombinedEmptyMessage && (
        <Message>Log in to get access to your Applications and Bookmarks. Go to <Link to="/settings">/settings</Link> to log in.</Message>
      )}

      {/* Applications Section */}
      {!showCombinedEmptyMessage && shouldShowAppsSection && (
        <Fragment>
          <SectionHeadline title="Applications" link="/applications" />
          {categoriesLoading ? <Spinner /> : (
            appSearchResult ? <AppGrid apps={appSearchResult} searching={!!localSearch} /> : (
              !isAuthenticated && totalApps === 0 ? <Message>You don't have any applications. You can add one from the <Link to="/applications">/applications</Link> menu.</Message> : (
                totalAppGroups <= 1 ? <AppGrid apps={appsToDisplay} searching={!!localSearch} /> : (
                  <>
                    {populatedAppCategories.slice().sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0)).map((cat) => {
                      const list = appsToDisplay.filter((a) => a.categoryId === cat.id);
                      if (list.length === 0) return null;
                      const isCollapsed = collapseState[cat.id] ?? false;
                      const isCurrentlyHovered = hoveredId === cat.id;
                      const buttonClasses = `${classes.toggleButton} ${!isCollapsed ? classes.isExpanded : ''}`;
                      return (
                        <div key={cat.id} style={{ marginBottom: '2rem' }}>
                          <h2 className={classes.categoryTitle}>
                            {config.collapseCategories !== false && (
                              <button onClick={() => toggleCollapsed(cat.id)} onMouseEnter={() => setHoveredId(cat.id)} onMouseLeave={() => setHoveredId(null)} className={buttonClasses}>
                                <CollapseToggle isHovered={isCurrentlyHovered} config={config} />
                              </button>
                            )}
                            {cat.name}
                          </h2>
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div style={{ overflow: 'hidden' }} key="app-grid-content" initial="hidden" animate="visible" exit="hidden" variants={{ visible: { opacity: 1, height: 'auto' }, hidden: { opacity: 0, height: 0 }, }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
                                <AppGrid apps={list} searching={!!localSearch} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {hasUncategorizedApps && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '16px', fontWeight: 400, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Uncategorized</h2>
                        <AppGrid apps={appsToDisplay.filter((a) => a.categoryId == null)} searching={!!localSearch} />
                      </div>
                    )}
                  </>
                )
              )
            )
          )}
          <div className={classes.HomeSpace}></div>
        </Fragment>
      )}

      {/* Bookmarks Section */}
      {!showCombinedEmptyMessage && shouldShowBookmarksSection && (
        <Fragment>
          <SectionHeadline title="Bookmarks" link="/bookmarks" />
          {categoriesLoading ? <Spinner /> : (() => {
            if (bookmarkSearchResult) {
              return (
                <BookmarkGrid
                  categories={bookmarkSearchResult}
                  searching={true}
                  fromHomepage={true}
                />
              );
            }
      
            const pinnedAndVisibleCategories = (categories || []).filter(
              ({ section, isPinned, isPublic, bookmarks }) => {
                if (section !== 'bookmarks') return false;
                const pinned = !!isPinned;
                const visible = isAuthenticated ? true : !!isPublic;
                const hasBookmarks = (bookmarks?.length ?? 0) > 0;
                return pinned && visible && hasBookmarks;
              }
            );
      
            if (pinnedAndVisibleCategories.length > 0) {
              return (
                <BookmarkGrid
                  categories={pinnedAndVisibleCategories}
                  searching={false}
                  fromHomepage={true}
                />
              );
            }
      
            if (totalBookmarkCategories > 0 && !isAuthenticated) {
              return (
                <Message>
                  There are no pinned public categories. You can pin them from the <Link to="/bookmarks">/bookmarks</Link> menu when logged in.
                </Message>
              );
            }
      
            if (totalBookmarkCategories > 0 && isAuthenticated) {
              return (
                <Message>
                  There are no pinned categories. You can pin them from the <Link to="/bookmarks">/bookmarks</Link> menu.
                </Message>
              );
            }
      
            return (
              <Message>
                You don&apos;t have any bookmarks. You can add a new one from the <Link to="/bookmarks">/bookmarks</Link> menu.
              </Message>
            );
          })()}
        </Fragment>
      )}

      <Link to="/settings" className={classes.SettingsButton}>
        <Icon icon="mdiCog" color="var(--color-background)" />
      </Link>
    </Container>
  );
};
