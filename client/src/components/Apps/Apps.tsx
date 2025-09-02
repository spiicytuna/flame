// client/src/components/Apps/Apps.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from '../../store/reducers';
import { actionCreators } from '../../store';

// Import the bookmarks-specific action directly
import { getCategoriesForSection } from '../../store/action-creators/bookmark';

// Types
import type { App as AppModel, Category } from '../../interfaces';

// CSS
import classes from './Apps.module.css';

// UI
import { Headline, Spinner, ActionButton, Modal, Container, Message } from '../UI';

// Subcomponents
import { AppGrid } from './AppGrid/AppGrid';
import { AppForm } from './AppForm/AppForm';
import { AppTable } from './AppTable/AppTable';

// Category modal + table (for Applications)
import { CategoryForm } from './CategoryForm/CategoryForm';
import { AppCategoryTable } from './CategoryTable/CategoryTable';

interface Props {
  searching: boolean;
}

export const Apps = (props: Props): JSX.Element => {
  // Redux state
  const {
    apps: { apps, loading },
    auth: { isAuthenticated },
    bookmarks: { categories: allCategories }, // Gets the full list of categories
    categories: { categoryInEdit: prefilledCategory }, // Gets the specific category for
  } = useSelector((state: State) => state);

  // Bind app actions
  const dispatch = useDispatch();
  const { getApps, setEditApp } = bindActionCreators(actionCreators, dispatch);

  // Local UI state
  const [modalIsOpen, setModalIsOpen] = useState(false); // app form
  const [categoryInEdit, setCategoryInEdit] = useState<Category | null>(null);
  const [categoryModalIsOpen, setCategoryModalIsOpen] = useState(false);
  const [isInCategoryUpdate, setIsInCategoryUpdate] = useState(false);
  const [showCategoryTable, setShowCategoryTable] = useState(false);

  // Load apps if array is empty
  useEffect(() => {
    if (!apps.length) getApps();
  }, [apps.length, getApps]);

  // Reset edit UIs when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCategoryInEdit(null);
      setModalIsOpen(false);
      setShowCategoryTable(false);
      setCategoryModalIsOpen(false);
    }
  }, [isAuthenticated]);

  // Fetch ONLY the 'apps' categories into the bookmarks slice
  useEffect(() => {
    (dispatch as any)(getCategoriesForSection('apps'));
  }, [dispatch]);

  // Derived: only the categories for Applications (defensive if API returns extra)
  const appCategories = useMemo(
    () => (allCategories || []).filter((c: any) => c.section === 'apps'),
    [allCategories]
  );

  // Group apps by categoryId for the grid view
  const groupedApps = useMemo(() => {
    const groups = new Map<number | 'uncat', AppModel[]>();
    apps.forEach((a) => {
      const key = a.categoryId ?? 'uncat';
      const curr = groups.get(key) || [];
      curr.push(a);
      groups.set(key, curr);
    });
    return groups;
  }, [apps]);

  // Handlers: App form
  const openCreateApp = (): void => {
    setEditApp(null);
    setModalIsOpen(true);
  };
  const openFormForUpdating = (app: AppModel): void => {
    setEditApp(app);
    setModalIsOpen(true);
  };
  const toggleAppModal = (): void => setModalIsOpen((s) => !s);

  // Handlers: Category form
  const toggleCategoryModal = (): void => {
    setIsInCategoryUpdate(false);
    setCategoryModalIsOpen((s) => !s);
  };
  const openFormForUpdatingCategory = (_category: Category): void => {
    setIsInCategoryUpdate(true);
    setCategoryModalIsOpen(true);
  };

  return (
    <Container>
      {/* App create/update modal */}
      <Modal isOpen={modalIsOpen} setIsOpen={setModalIsOpen}>
        <AppForm modalHandler={toggleAppModal} />
      </Modal>

      {/* Category create/update modal (Applications section) */}
      <Modal isOpen={categoryModalIsOpen} setIsOpen={toggleCategoryModal}>
        <CategoryForm
          modalHandler={toggleCategoryModal}
	  category={isInCategoryUpdate ? prefilledCategory ?? undefined : undefined}
        />
      </Modal>

      <Headline title="All Applications" subtitle={<Link to="/">Go back</Link>} />

      {isAuthenticated && (
        <div className={classes.ActionsContainer}>
          <ActionButton
            name={showCategoryTable ? 'Done Editing Categories' : 'Edit Categories'}
            icon="mdiPencil"
            handler={() => {
              setShowCategoryTable((v) => !v);
//              if (!showCategoryTable) setShowAppTable(false); // hide the other panel
	      if (!showCategoryTable) setCategoryInEdit(null); // hide other panel
            }}
          />
          <ActionButton name="Add Application" icon="mdiPlusBox" handler={openCreateApp} />
          <ActionButton
            name="Add Category"
            icon="mdiPlusBox"
            handler={() => {
              setIsInCategoryUpdate(false);
              setCategoryModalIsOpen(true);
            }}
          />
        </div>
      )}

      {isAuthenticated && !showCategoryTable && !categoryInEdit && appCategories.length > 0 ? (
        <Message isPrimary={false}>
          Click on category name to edit its bookmarks
        </Message>
      ) : (
        <></>
      )}

      {/* Main body */}
      <div className={classes.Apps}>
        {loading ? (
          <Spinner />
        ) : showCategoryTable ? (
          <AppCategoryTable openFormForUpdating={openFormForUpdatingCategory} />
        ) : categoryInEdit ? (
          <AppTable
            category={categoryInEdit}
            openFormForUpdating={openFormForUpdating}
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
                    return (
                      <div key={cat.id} style={{ marginBottom: '2rem' }}>
  		        <h2
		          style={{ margin: '0 0 0.5rem', cursor: 'pointer' }}
		          onClick={() => setCategoryInEdit(cat)}
		        >
		          {cat.name}
		        </h2>
                        <AppGrid apps={list} searching={props.searching} />
                      </div>
                    );
                  })}

                {(apps || []).some((a) => a.categoryId == null) && (
                  <div style={{ marginBottom: '2rem' }}>
		    <h2
		      style={{ margin: '0 0 0.5rem', cursor: 'pointer' }}
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

export default Apps;
