import { useEffect, useMemo, useState } from 'react';
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
    apps: { apps },
    auth: { isAuthenticated },
    categories: { categories: allCategories, categoryInEdit: prefilledCategory },
  } = useSelector((state: State) => state);

  // Bind actions
  const dispatch = useDispatch();
  const { getApps, setEditApp, setEditCategory } = bindActionCreators(actionCreators, dispatch);

  // Local UI state
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false); // app form
  const [categoryInEdit, setCategoryInEdit] = useState<Category | null>(null);
  const [categoryModalIsOpen, setCategoryModalIsOpen] = useState(false);
  const [isInCategoryUpdate, setIsInCategoryUpdate] = useState(false);
  const [showCategoryTable, setShowCategoryTable] = useState(false);

  // only the cats for Apps
  const appCategories = useMemo(
    () => (allCategories || []).filter((c: any) => c.section === 'apps'),
    [allCategories]
  );
  
  // apps after we have categories
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

  // Reset edit UIs when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCategoryInEdit(null);
      setModalIsOpen(false);
      setShowCategoryTable(false);
      setCategoryModalIsOpen(false);
    }
  }, [isAuthenticated]);

  // Handlers: App form
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
    setEditCategory(null); // Clear any old data
    setIsInCategoryUpdate(false);
    setCategoryModalIsOpen(true);
  };

  const openFormForUpdatingCategory = (_category: Category): void => {
    setEditCategory(_category); // Set category in Redux for the form to use
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
                    return (
                      <div key={cat.id} style={{ marginBottom: '2rem' }}>
  		        <h2
		          style={{ margin: '0 0 0.5rem', cursor: 'pointer', color: 'var(--color-accent)' }}
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
		      style={{ margin: '0 0 0.5rem', cursor: 'pointer', color: 'var(--color-accent)' }}
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
