import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from '../../store/reducers';
import { actionCreators } from '../../store';

// Types
import type { App as AppModel, Category } from '../../interfaces';

// CSS
import classes from './Apps.module.css';

// UI
import { Icon, Headline, Spinner, ActionButton, Modal, Container, Message } from '../UI';
import { motion, AnimatePresence } from 'framer-motion';

// Subcomponents
import { AppGrid } from './AppGrid/AppGrid';
import { AppForm } from './AppForm/AppForm';
import { AppTable } from './AppTable/AppTable';

// Category modal + table (for Applications)
import { CategoryForm } from './CategoryForm/CategoryForm';
import { AppCategoryTable } from './CategoryTable/CategoryTable';

// Utils
import { applyAuth } from '../../utility';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

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

const CollapseToggle = ({
  isHovered,
  config,
}: {
  isHovered: boolean;
  config: State['config']['config'];
}) => {
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

interface Props {
  searching: boolean;
}

export const Apps = (props: Props): JSX.Element => {
  // Redux state
  const {
    apps: { apps },
    auth: { isAuthenticated },
    categories: { categories: allCategories, categoryInEdit: prefilledCategory },
    config: { config },
  } = useSelector((state: State) => state);

  // Bind actions
  const dispatch = useDispatch();
  const { getApps, setEditApp, setEditCategory, updateCategoryCollapseState, fetchHomepageData, } = bindActionCreators(actionCreators, dispatch);

  // Local UI state
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [categoryInEdit, setCategoryInEdit] = useState<Category | null>(null);
  const [categoryModalIsOpen, setCategoryModalIsOpen] = useState(false);
  const [isInCategoryUpdate, setIsInCategoryUpdate] = useState(false);
  const [showCategoryTable, setShowCategoryTable] = useState(false);

  const [didInitCollapse, setDidInitCollapse] = useState(false);
  const [collapseState, setCollapseState] = useState<Record<number, boolean>>({});
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // only the cats for Apps
  const appCategories = useMemo(
    () => (allCategories || []).filter((c: any) => c.section === 'apps'),
    [allCategories],
  );

  // apps after cats
  useEffect(() => {
    const loadApps = async () => {
      if (!apps.length && appCategories.length > 0) {
        setIsAppsLoading(true);
        await getApps();
        setIsAppsLoading(false);
      }
    }
    loadApps();
  }, [apps.length, appCategories, getApps]);

  // collapse state => fetched data
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

  // Reset edit UIs when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCategoryInEdit(null);
      setModalIsOpen(false);
      setShowCategoryTable(false);
      setCategoryModalIsOpen(false);
    }
  }, [isAuthenticated]);

  const prevShowCategoryTable = usePrevious(showCategoryTable);
  const prevCategoryInEdit = usePrevious(categoryInEdit);

  useEffect(() => {
    // trans => showing table => hiding
    if (prevShowCategoryTable && !showCategoryTable) {
      fetchHomepageData();
    }
  }, [showCategoryTable, prevShowCategoryTable, fetchHomepageData]);

  // edit app => save => auto-refresh
  useEffect(() => {
    if (prevCategoryInEdit && !categoryInEdit) {
      fetchHomepageData();
    }
  }, [categoryInEdit, prevCategoryInEdit, fetchHomepageData]);

  const toggleCollapsed = async (catId: number) => {
    const newState = !collapseState[catId];
  
    // Update UI first
    setCollapseState((prev) => {
      const next = { ...prev, [catId]: newState };
      if (!isAuthenticated) saveLocalAppCollapse(next);
      return next;
    });
    dispatch(updateCategoryCollapseState(catId, newState));
  
    // authenticated ??
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

  // handlers: app form
  const openCreateApp = (): void => {
    setEditApp(null);
    setModalIsOpen(true);
  };
  const openFormForUpdatingApp = (app: AppModel): void => {
    setEditApp(app);
    setModalIsOpen(true);
  };
  const toggleAppModal = (): void => setModalIsOpen((s) => !s);

  // handlers: cat form
  const openFormForAddingCategory = (): void => {
    setEditCategory(null); // clear old
    setIsInCategoryUpdate(false);
    setCategoryModalIsOpen(true);
  };

  const openFormForUpdatingCategory = (_category: Category): void => {
    setEditCategory(_category); // Set category => Redux => form
    setIsInCategoryUpdate(true);
    setCategoryModalIsOpen(true);
  };

  const toggleCategoryModal = (): void => setCategoryModalIsOpen((s) => !s);

  const isEditing = showCategoryTable || categoryInEdit;

  const goBackElement = isEditing ? (
    <span className={classes.GoBack} onClick={() => {
      setShowCategoryTable(false);
      setCategoryInEdit(null);
    }}>
      Go back
    </span>
  ) : (
    <Link to="/">Go back</Link>
  );

  return (
    <Container>
      {/* app create/update modal */}
      <Modal isOpen={modalIsOpen} setIsOpen={setModalIsOpen}>
        {modalIsOpen && <AppForm modalHandler={toggleAppModal} />}
      </Modal>

      {/* cat create/update modal */}
      <Modal isOpen={categoryModalIsOpen} setIsOpen={toggleCategoryModal}>
        {categoryModalIsOpen && (
          <CategoryForm
            modalHandler={toggleCategoryModal}
            category={isInCategoryUpdate ? prefilledCategory ?? undefined : undefined}
          />
        )}
      </Modal>

      <Headline title="All Applications" subtitle={goBackElement} />

      {isAuthenticated && (
        <div className={classes.ActionsContainer}>
	  <ActionButton
            name="Add Category"
            icon="mdiPlusBox"
            handler={openFormForAddingCategory}
          />
	  <ActionButton name="Add Application" icon="mdiPlusBox" handler={openCreateApp} />

          <ActionButton
            name={showCategoryTable ? 'Done Editing Categories' : 'Edit Categories'}
            icon="mdiPencil"
            handler={() => {
              setShowCategoryTable((v) => !v);
              if (!showCategoryTable) setCategoryInEdit(null);
            }}
          />
        </div>
      )}

      {isAuthenticated && !showCategoryTable && !categoryInEdit && appCategories.length > 0 ? (
        <Message isPrimary={false}>
          Click on category name to edit its applications
        </Message>
      ) : (
        <></>
      )}

      {/* Main body */}
      <div className={classes.Apps}>
        {isAppsLoading ? (
          <Spinner />
        ) : showCategoryTable ? (
          <AppCategoryTable openFormForUpdating={openFormForUpdatingCategory} />
        ) : categoryInEdit ? (
          <AppTable
            category={categoryInEdit}
	    openFormForUpdating={openFormForUpdatingApp}
	    onFinishEditing={() => setCategoryInEdit(null)}
          />
        ) : (
          // ---------- grouped grid with fallback ----------
          <>
            {appCategories.length === 0 ? (
              <AppGrid apps={apps} searching={props.searching} />
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
                    const buttonClasses = `${classes.toggleButton} ${
                      !isCollapsed ? classes.isExpanded : ''
                    }`;

                    return (
                      <div key={cat.id} style={{ marginBottom: '2rem' }}>
                        <h2 className={classes.categoryTitle}>
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
                          <span
                            className={classes.categoryName}
                            onClick={() => setCategoryInEdit(cat)}
                          >
                            {cat.name}
                          </span>
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
                            <AppGrid apps={list} searching={props.searching} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                    );
                  })}

                {(apps || []).some((a) => a.categoryId == null) && (
                  <div style={{ marginBottom: '2rem' }}>
		    <h2 className={classes.categoryTitle}>
		      <span
                        className={classes.categoryName}
		      onClick={() =>
		        setCategoryInEdit({
		          id: -1,
		          name: 'Uncategorized',
		          section: 'apps',
		          isPinned: false,
		          isPublic: true,
		          createdAt: new Date(),
		          updatedAt: new Date(),
		        })
		      }
		    >
		      Uncategorized
                      </span>
		    </h2>
                    <AppGrid
                      apps={(apps || []).filter((a) => a.categoryId == null)}
                      searching={props.searching}
                    />
                  </div>
                )}
              </>
            )}
          </>
          // ---------- end grouped grid with fallback ----------
        )}
      </div>
    </Container>
  );
};
