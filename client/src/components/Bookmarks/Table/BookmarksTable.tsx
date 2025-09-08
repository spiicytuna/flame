import { useState, useEffect, Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';

// @dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { Bookmark, Category } from '../../../interfaces';

// UI
import { Message, ActionButton } from '../../UI';
import { TableActions } from '../../Actions/TableActions';
import { bookmarkTemplate } from '../../../utility';

// CSS
import styles from './CategoryTable.module.css';

interface SortableRowProps {
  bookmark: Bookmark;
  categoryName: string;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (id: number) => void;
  changeVisibilityHandler: (id: number) => void;
}

const SortableBookmarkRow = ({
  bookmark,
  categoryName,
  deleteHandler,
  updateHandler,
  changeVisibilityHandler,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: isDragging ? '1px solid var(--color-accent)' : 'none',
    borderRadius: '4px',
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>{bookmark.name}</td>
      <td>{bookmark.url}</td>
      <td>{bookmark.icon}</td>
      <td>{bookmark.isPublic ? 'Visible' : 'Hidden'}</td>
      <td>{categoryName}</td>
      <td onPointerDown={(e) => e.stopPropagation()}>
        {!isDragging && (
          <TableActions
            entity={bookmark}
            deleteHandler={deleteHandler}
            updateHandler={updateHandler}
            changeVisibilty={changeVisibilityHandler}
            showPin={false}
          />
        )}
      </td>
    </tr>
  );
};

interface Props {
  category: Category;
  onFinishEditing: () => void;
  openFormForUpdating: (data: Category | Bookmark) => void;
}

export const BookmarksTable = ({
  category,
  onFinishEditing,
  openFormForUpdating,
}: Props): JSX.Element => {
  const {
    config: { config },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const {
    deleteBookmark,
    updateBookmark,
    createNotification,
    reorderBookmarks,
  } = bindActionCreators(actionCreators, dispatch);

  const bookmarks = useMemo(() => 
    (category?.bookmarks ?? []).slice().sort((a, b) => a.orderId - b.orderId), 
    [category]
  );

  const [localBookmarks, setLocalBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setLocalBookmarks(bookmarks);
  }, [bookmarks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (config.useOrdering !== 'orderId') {
      createNotification({
        title: 'Error',
        message: 'Custom order is disabled',
      });
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = localBookmarks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(localBookmarks, oldIndex, newIndex);

    setLocalBookmarks(reordered);
    reorderBookmarks(reordered, category.id);
  };

  const deleteBookmarkHandler = (id: number, name: string) => {
    const proceed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (proceed) {
      deleteBookmark(id, category.id);
    }
  };

  const updateBookmarkHandler = (id: number) => {
    const bookmark =
      (category.bookmarks ?? []).find((b) => b.id === id) || bookmarkTemplate;
    openFormForUpdating(bookmark);
  };

  const changeBookmarkVisibilityHandler = (id: number) => {
    // latest state ??
    setLocalBookmarks(currentBookmarks => {
      const bookmarkToUpdate = currentBookmarks.find(bm => bm.id === id);

      // ! bookmark => do nothing
      if (!bookmarkToUpdate) {
        return currentBookmarks;
      }

      // bookmark object => toggle visible
      const updatedBookmark = { ...bookmarkToUpdate, isPublic: !bookmarkToUpdate.isPublic };
      
      // DB
      const [prev, curr] = [category.id, category.id];
      updateBookmark(id, updatedBookmark, { prev, curr });

      // update UI
      return currentBookmarks.map(bm => (bm.id === id ? updatedBookmark : bm));
    });
  };

  return (
    <Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>Editing: {category.name}</h2>
        <ActionButton
          name="Done Editing"
          icon="mdiPencilOff"
          handler={onFinishEditing}
        />
      </div>

      <Message isPrimary={false}>
        {config.useOrdering === 'orderId' ? (
          <p>You can drag and drop single rows to reorder bookmarks</p>
        ) : (
          <p>
            Custom order is disabled. You can change it in the{' '}
            <Link to="/settings/general">settings</Link>
          </p>
        )}
      </Message>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Icon</th>
              <th>Visibility</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={localBookmarks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {localBookmarks.map((bookmark) => (
                <SortableBookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  categoryName={category.name}
                  deleteHandler={deleteBookmarkHandler}
                  updateHandler={updateBookmarkHandler}
                  changeVisibilityHandler={changeBookmarkVisibilityHandler}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </Fragment>
  );
};
