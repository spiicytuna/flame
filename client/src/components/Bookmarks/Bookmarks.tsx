import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { State } from '../../store/reducers';
import { actionCreators } from '../../store';
// import { getCategoriesForSection } from '../../store/action-creators/category';

// Typescript
import type { Category, Bookmark } from '../../interfaces';

// CSS
import classes from './Bookmarks.module.css';

// UI
import {
  Container,
  Headline,
  ActionButton,
  Spinner,
  Modal,
  Message,
} from '../UI';

// Components
import { BookmarkGrid } from './BookmarkGrid/BookmarkGrid';
import { Form } from './Form/Form';
import { Table } from './Table/Table';

// FIX: A helper hook to track the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export enum ContentType {
  category,
  bookmark,
}

export const Bookmarks = (props: Props): JSX.Element => {
  // Redux state: Using specific selectors to prevent unnecessary re-renders
  const loading = useSelector((state: State) => state.categories.loading);
  const allCategories = useSelector((state: State) => state.categories.categories);
  const isAuthenticated = useSelector((state: State) => state.auth.isAuthenticated);

  // Filter to ONLY bookmark categories
  const categories = (allCategories || []).filter(
    (c) => c.section === 'bookmarks'
  );

  // Actions
  const dispatch = useDispatch();
  const { setEditCategory, setEditBookmark, getCategoriesForSection } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // UI state
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formContentType, setFormContentType] = useState(ContentType.category);
  const [isInUpdate, setIsInUpdate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryTable, setShowCategoryTable] = useState(false);
  const [categoryForForm, setCategoryForForm] = useState<Category | undefined>(undefined);

  const prevShowCategoryTable = usePrevious(showCategoryTable);
  const prevSelectedCategory = usePrevious(selectedCategory);

   // cat has books ??
   const nonEmptyBookmarkCategories = useMemo(
     () =>
       (categories || []).filter(
         ({ section, bookmarks }) =>
           section === 'bookmarks' && (bookmarks?.length ?? 0) > 0
       ),
     [categories]
   );

  // Cleanup hooks
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedCategory(null);
      setShowCategoryTable(false);
      setModalIsOpen(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setEditCategory(null);
  }, [setEditCategory]);

  useEffect(() => {
    if (!modalIsOpen) {
      setEditCategory(null);
      setEditBookmark(null);
    }
  }, [modalIsOpen, setEditCategory, setEditBookmark]);

  useEffect(() => {
    if (prevShowCategoryTable && !showCategoryTable) {
      getCategoriesForSection('bookmarks');
    }

    if (prevSelectedCategory && !selectedCategory) {
      getCategoriesForSection('bookmarks');
    }
  }, [showCategoryTable, prevShowCategoryTable, selectedCategory, prevSelectedCategory, getCategoriesForSection]);

  // Handlers
  const toggleModal = (): void => setModalIsOpen((s) => !s);

  const selectCategoryHandler = (category: Category): void => {
    setSelectedCategory(category);
  };

  const openFormForAdding = (contentType: ContentType) => {
    setFormContentType(contentType);
    setIsInUpdate(false);
    setCategoryForForm(undefined);
    setEditCategory(null);
    setEditBookmark(null);
    toggleModal();
  };

  const openFormForUpdating = (data: Category | Bookmark): void => {
    setIsInUpdate(true);
    const isCategory = (obj: any): obj is Category => 'bookmarks' in obj;
    if (isCategory(data)) {
      setEditBookmark(null);
      setFormContentType(ContentType.category);
      setEditCategory(data);
      setCategoryForForm(data);
    } else {
      setEditCategory(null);
      setFormContentType(ContentType.bookmark);
      setEditBookmark(data);
    }
    toggleModal();
  };

  // done edit => reset the new states
  const finishEditing = () => {
    setSelectedCategory(null);
    setShowCategoryTable(false);
    setEditCategory(null);
  };

  const isEditing = showCategoryTable || !!selectedCategory;

  // goBackElement use => corrected finishEditing handler
  const goBackElement = isEditing ? (
    <span className={classes.GoBack} onClick={finishEditing}>
      Go back
    </span>
  ) : (
    <Link to="/">Go back</Link>
  );

  return (
    <Container>
      <Modal isOpen={modalIsOpen} setIsOpen={toggleModal}>
        {modalIsOpen && (
          <Form
            modalHandler={toggleModal}
            contentType={formContentType}
            inUpdate={isInUpdate}
            categoryToEdit={categoryForForm}
          />
        )}
      </Modal>

      <Headline title="All Bookmarks" subtitle={goBackElement} />

      {isAuthenticated && (
        <div className={classes.ActionsContainer}>
          <ActionButton
            name="Add Category"
            icon="mdiPlusBox"
            handler={() => openFormForAdding(ContentType.category)}
          />
          <ActionButton
            name="Add Bookmark"
            icon="mdiPlusBox"
            handler={() => openFormForAdding(ContentType.bookmark)}
          />
          <ActionButton
            name={showCategoryTable ? 'Done Editing' : 'Edit Categories'}
            icon="mdiPencil"
            handler={() => {
              setSelectedCategory(null);
              setShowCategoryTable((v) => !v);
            }}
          />
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : showCategoryTable ? (
        <Table
          contentType={ContentType.category}
          openFormForUpdating={openFormForUpdating}
        />
      ) : selectedCategory ? (
        <Table
          contentType={ContentType.bookmark}
          openFormForUpdating={openFormForUpdating}
          category={selectedCategory}
          onFinishEditing={() => setSelectedCategory(null)}
        />
       ) : nonEmptyBookmarkCategories.length > 0 ? (
         // show the grid if not loading AND hv non-empty cats
         <BookmarkGrid
           categories={nonEmptyBookmarkCategories}
           searching={props.searching}
           selectCategoryHandler={selectCategoryHandler}
         />
      
      ) : (
        // else show empty msg
        <Message>
          You don't have any bookmarks. You can add a new one from the{' '}
          <Link to="/bookmarks">/bookmarks</Link> menu
        </Message>
      )}
    </Container>
  );
};
