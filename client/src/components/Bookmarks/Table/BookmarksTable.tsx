import { useState, useEffect, Fragment } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { Bookmark, Category } from '../../../interfaces';

// UI
import { Message, Table, ActionButton } from '../../UI';
import { TableActions } from '../../Actions/TableActions';
import { bookmarkTemplate } from '../../../utility';

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

  const [localBookmarks, setLocalBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setLocalBookmarks([...(category?.bookmarks ?? [])]);
  }, [category]);

  const dragEndHanlder = (result: DropResult): void => {
    if (config.useOrdering !== 'orderId') {
      createNotification({
        title: 'Error',
        message: 'Custom order is disabled',
      });
      return;
    }

    if (!result.destination) {
      return;
    }

    const tmpBookmarks = [...localBookmarks];
    const [movedBookmark] = tmpBookmarks.splice(result.source.index, 1);
    tmpBookmarks.splice(result.destination.index, 0, movedBookmark);

    setLocalBookmarks(tmpBookmarks);

    reorderBookmarks(tmpBookmarks, category.id);
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

  const changeBookmarkVisibiltyHandler = (id: number) => {
    const bookmark =
      (category.bookmarks ?? []).find((b) => b.id === id) || bookmarkTemplate;
    const [prev, curr] = [category.id, category.id];
    updateBookmark(
      id,
      { ...bookmark, isPublic: !bookmark.isPublic },
      { prev, curr }
    );
  };

  return (
    <Fragment>
      {/* header copied UI from AppTable.tsx */}
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

      <DragDropContext onDragEnd={dragEndHanlder}>
        <Droppable droppableId="bookmarks">
          {(provided) => (
            <Table
              headers={[
                'Name',
                'URL',
                'Icon',
                'Visibility',
                'Category',
                'Actions',
              ]}
              innerRef={provided.innerRef}
            >
              {localBookmarks.map((bookmark, index): JSX.Element => {
                return (
                  <Draggable
                    key={bookmark.id}
                    draggableId={bookmark.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => {
                      const style = {
                        border: snapshot.isDragging
                          ? '1px solid var(--color-accent)'
                          : 'none',
                        borderRadius: '4px',
                        ...provided.draggableProps.style,
                      };

                      return (
                        <tr
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                          style={style}
                        >
                          <td style={{ width: '200px' }}>{bookmark.name}</td>
                          <td style={{ width: '200px' }}>{bookmark.url}</td>
                          <td style={{ width: '200px' }}>{bookmark.icon}</td>
                          <td style={{ width: '200px' }}>
                            {bookmark.isPublic ? 'Visible' : 'Hidden'}
                          </td>
                          <td style={{ width: '200px' }}>{category.name}</td>

                          {!snapshot.isDragging && (
                            <TableActions
                              entity={bookmark}
                              deleteHandler={deleteBookmarkHandler}
                              updateHandler={updateBookmarkHandler}
                              changeVisibilty={changeBookmarkVisibiltyHandler}
                              showPin={false}
                            />
                          )}
                        </tr>
                      );
                    }}
                  </Draggable>
                );
              })}
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </Fragment>
  );
};
