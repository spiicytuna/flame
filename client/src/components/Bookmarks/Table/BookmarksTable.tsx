import { useState, useEffect, Fragment } from 'react';

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
import { Message, Table } from '../../UI';
import { TableActions } from '../../Actions/TableActions';
import { bookmarkTemplate } from '../../../utility';


interface SortableBookmarkRowProps {
  bookmark: Bookmark;
  categoryName: string;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (id: number) => void;
  changeVisibilty: (id: number) => void;
}

// New component for the sortable table row
const SortableBookmarkRow = ({
  bookmark,
  categoryName,
  deleteHandler,
  updateHandler,
  changeVisibilty,
}: SortableBookmarkRowProps) => {
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
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td style={{ width: '50px', cursor: 'grab' }} {...listeners}>
        ⋮⋮
      </td>
      <td style={{ width: '200px' }}>{bookmark.name}</td>
      <td style={{ width: '200px' }}>{bookmark.url}</td>
      <td style={{ width: '200px' }}>{bookmark.icon}</td>
      <td style={{ width: '200px' }}>
        {bookmark.isPublic ? 'Visible' : 'Hidden'}
      </td>
      <td style={{ width: '200px' }}>{categoryName}</td>

      {!isDragging && (
        <TableActions
          entity={bookmark}
          deleteHandler={deleteHandler}
          updateHandler={updateHandler}
          changeVisibilty={changeVisibilty}
          showPin={false}
        />
      )}
    </tr>
  );
};

interface Props {
  openFormForUpdating: (data: Category | Bookmark) => void;
}

export const BookmarksTable = ({ openFormForUpdating }: Props): JSX.Element => {
  const {
    bookmarks: { categoryInEdit },
    config: { config },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const {
    deleteBookmark,
    updateBookmark,
    createNotification,
    reorderBookmarks,
  } = bindActionCreators(actionCreators, dispatch);

  const [localBookmarks, setLocalBookmarks] = useState<Bookmark[]>([]);

  // Copy bookmarks array
  useEffect(() => {
    if (categoryInEdit) {
      setLocalBookmarks([...categoryInEdit.bookmarks]);
    } else {
      setLocalBookmarks([]);
    }
  }, [categoryInEdit]);
  
  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    if (config.useOrdering !== 'orderId') {
      createNotification({
        title: 'Error',
        message: 'Custom order is disabled',
      });
      return;
    }

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localBookmarks.findIndex((b) => b.id === active.id);
      const newIndex = localBookmarks.findIndex((b) => b.id === over.id);
      
      const reordered = arrayMove(localBookmarks, oldIndex, newIndex);
      
      setLocalBookmarks(reordered);
      
      const categoryId = categoryInEdit?.id || -1;
      reorderBookmarks(reordered, categoryId);
    }
  };

  // Action hanlders
  const deleteBookmarkHandler = (id: number, name: string) => {
    const categoryId = categoryInEdit?.id || -1;

    const proceed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (proceed) deleteBookmark(id, categoryId);
  };

  const updateBookmarkHandler = (id: number) => {
    const bookmark =
      categoryInEdit?.bookmarks.find((b) => b.id === id) || bookmarkTemplate;

    openFormForUpdating(bookmark);
  };

  const changeBookmarkVisibiltyHandler = (id: number) => {
    const bookmark =
      categoryInEdit?.bookmarks.find((b) => b.id === id) || bookmarkTemplate;

    const categoryId = categoryInEdit?.id || -1;
    const [prev, curr] = [categoryId, categoryId];

    updateBookmark(
      id,
      { ...bookmark, isPublic: !bookmark.isPublic },
      { prev, curr }
    );
  };

  return (
    <Fragment>
      {!categoryInEdit ? (
        <Message isPrimary={false}>
          Switch to grid view and click on the name of category you want to edit
        </Message>
      ) : (
        <Message isPrimary={false}>
          Editing bookmarks from&nbsp;<span>{categoryInEdit.name}</span>
          &nbsp;category
        </Message>
      )}

      {categoryInEdit && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table
            headers={[
              '',
              'Name',
              'URL',
              'Icon',
              'Visibility',
              'Category',
              'Actions',
            ]}
          >
            <SortableContext
              items={localBookmarks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {localBookmarks.map((bookmark) => (
                <SortableBookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  categoryName={categoryInEdit.name}
                  deleteHandler={deleteBookmarkHandler}
                  updateHandler={updateBookmarkHandler}
                  changeVisibilty={changeBookmarkVisibiltyHandler}
                />
              ))}
            </SortableContext>
          </Table>
        </DndContext>
      )}
    </Fragment>
  );
};
