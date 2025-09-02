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
import type { Category } from '../../../interfaces';

// UI
import { Message, Table } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

// Thunk to load only apps categories
import { getCategoriesForSection } from '../../../store/reducers/category';

interface Props {
  openFormForUpdating: (category: Category) => void;
}

export const AppCategoryTable = ({ openFormForUpdating }: Props): JSX.Element => {
  const {
    config: { config },
    categories: { categories: allCategories },
  } = useSelector((state: State) => state);
  
  // Create a new list that is filtered for ONLY app categories
  const categories = (allCategories || []).filter(
    (category) => category.section === 'apps'
  );

  const dispatch = useDispatch();
  const {
    pinCategory,
    deleteCategory,
    createNotification,
    reorderCategories,
    updateCategory,
    // bind the section-aware loader
    getCategoriesForSection: loadSectionCategories,
  } = bindActionCreators(
    { ...actionCreators, getCategoriesForSection },
    dispatch
  );

  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Load only the "apps" section once
  useEffect(() => {
    loadSectionCategories('apps');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror store → local state
  useEffect(() => {
    setLocalCategories(categories || []);
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

    const reordered = [...localCategories];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setLocalCategories(reordered);
    reorderCategories(reordered);
  };

  // Action handlers
  const deleteCategoryHandler = (id: number, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete category "${name}"? It will remove it for Applications.`
    );
    if (confirmDelete) deleteCategory(id);
  };

  const updateCategoryHandler = (id: number) => {
    const category = localCategories.find((c) => c.id === id);
    if (category) openFormForUpdating(category);
  };

  const pinCategoryHandler = (id: number) => {
    const category = localCategories.find((c) => c.id === id);
    if (category) pinCategory(category);
  };

  const toggleVisibilityHandler = (id: number) => {
    const category = localCategories.find((c) => c.id === id);
    if (category) updateCategory(id, { ...category, isPublic: !category.isPublic });
  };

  return (
    <Fragment>
      <Message isPrimary={false}>
        {config.useOrdering === 'orderId' ? (
          <p>You can drag and drop rows to reorder categories.</p>
        ) : (
          <p>
            Custom ordering is disabled. Enable it in{' '}
            <Link to="/settings/general">Settings</Link>.
          </p>
        )}
      </Message>

      <DragDropContext onDragEnd={dragEndHandler}>
        <Droppable droppableId="categories">
          {(provided) => (
            <Table headers={['Name', 'Visibility', 'Actions']} innerRef={provided.innerRef}>
              {localCategories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id.toString()}
                  index={index}
                >
                  {(providedDraggable, snapshot) => {
                    const style = {
                      border: snapshot.isDragging ? '1px solid var(--color-accent)' : 'none',
                      borderRadius: '4px',
                      ...(providedDraggable.draggableProps.style as object),
                    };

                    // Normalize flags to booleans for TableActions’ Entity type
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
                            entity={entityForActions}
                            deleteHandler={deleteCategoryHandler}
                            updateHandler={updateCategoryHandler}
                            pinHanlder={pinCategoryHandler}
                            changeVisibilty={toggleVisibilityHandler}
                          />
                        )}
                      </tr>
                    );
                  }}
                </Draggable>
              ))}

              {provided.placeholder}
            </Table>
          )}
        </Droppable>
      </DragDropContext>
    </Fragment>
  );
};

export default AppCategoryTable;
