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
import { Message, Table } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

interface Props {
  openFormForUpdating: (data: Category | Bookmark) => void;
}

export const CategoryTable = ({ openFormForUpdating }: Props): JSX.Element => {
  const {
    config: { config },
    categories: { categories: allCategories },
  } = useSelector((state: State) => state);
  
  // Create a new list that is filtered for ONLY bookmark categories
  const categories = (allCategories || []).filter(
    (category) => category.section === 'bookmarks'
  );

  const dispatch = useDispatch();
  const {
    pinCategory,
    deleteCategory,
    createNotification,
    reorderCategories,
    updateCategory,
  } = bindActionCreators(actionCreators, dispatch);

  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Copy categories array safely
  useEffect(() => {
    setLocalCategories([...(categories ?? [])]);
  }, [categories]);

  // Drag and drop handler
  const dragEndHandler = (result: DropResult): void => {
    if (config.useOrdering !== 'orderId') {
      createNotification({
        title: 'Error',
        message: 'Custom order is disabled',
      });
      return;
    }
    if (!result.destination) return;

    const tmp = [...localCategories];
    const [moved] = tmp.splice(result.source.index, 1);
    tmp.splice(result.destination.index, 0, moved);

    setLocalCategories(tmp);
    reorderCategories(tmp);
  };

  // Action handlers
  const deleteCategoryHandler = (id: number, name: string) => {
    const proceed = window.confirm(
      `Are you sure you want to delete ${name}? It will delete ALL assigned bookmarks`
    );
    if (proceed) deleteCategory(id);
  };

  const updateCategoryHandler = (id: number) => {
    const category = (categories ?? []).find((c) => c.id === id) as Category;
    openFormForUpdating(category);
  };

  const pinCategoryHandler = (id: number) => {
    const category = (categories ?? []).find((c) => c.id === id) as Category;
    pinCategory(category);
  };

  const changeCategoryVisibiltyHandler = (id: number) => {
    const category = (categories ?? []).find((c) => c.id === id) as Category;
    updateCategory(id, { ...category, isPublic: !category.isPublic });
  };

  return (
    <Fragment>
      <Message isPrimary={false}>
        {config.useOrdering === 'orderId' ? (
          <p>You can drag and drop single rows to reorder categories</p>
        ) : (
          <p>
            Custom order is disabled. You can change it in the{' '}
            <Link to="/settings/general">settings</Link>
          </p>
        )}
      </Message>

      <DragDropContext onDragEnd={dragEndHandler}>
        <Droppable droppableId="categories">
          {(provided) => (
            <Table
              headers={['Name', 'Visibility', 'Actions']}
              innerRef={provided.innerRef}
            >
              {localCategories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id.toString()}
                  index={index}
                >
                  {(providedDraggable, snapshot) => {
                    const style = {
                      border: snapshot.isDragging
                        ? '1px solid var(--color-accent)'
                        : 'none',
                      borderRadius: '4px',
                      ...(providedDraggable.draggableProps.style as object),
                    };

                    // 🔧 Normalize numeric flags to booleans so they fit TableActions' Entity type
                    const entityForActions = {
                      ...category,
                      isPinned: Boolean((category as any).isPinned),
                      isPublic: Boolean((category as any).isPublic),
                    };

                    return (
                      <tr
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
                        ref={providedDraggable.innerRef}
                        style={style}
                      >
                        <td style={{ width: '300px' }}>{category.name}</td>
                        <td style={{ width: '300px' }}>
                          {entityForActions.isPublic ? 'Visible' : 'Hidden'}
                        </td>

                        {!snapshot.isDragging && (
                          <TableActions
                            entity={entityForActions} // << was entity={category}
                            deleteHandler={deleteCategoryHandler}
                            updateHandler={updateCategoryHandler}
                            pinHanlder={pinCategoryHandler}
                            changeVisibilty={changeCategoryVisibiltyHandler}
                          />
                        )}
                      </tr>
                    );
                  }}
                </Draggable>
              ))}

              {/* required placeholder for react-beautiful-dnd */}
              {provided.placeholder}
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </Fragment>
  );
};
