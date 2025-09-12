import { useState, useEffect, Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';

// react-beautiful-dnd => @dnd-kit
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
import { Category } from '../../../interfaces';

// UI
import { Message } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

// CSS Module import
import styles from './CategoryTable.module.css';

// react-beautiful-dnd => @dnd-kit
interface SortableRowProps {
  category: Category;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (category: Category) => void;
  pinHandler: (id: number) => void;
  changeVisibilityHandler: (id: number) => void;
}

const SortableCategoryRow = ({
  category,
  deleteHandler,
  updateHandler,
  pinHandler,
  changeVisibilityHandler,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: isDragging ? '1px solid var(--color-accent)' : 'none',
    borderRadius: '4px',
  };

  // Using the reverted "working but reversed" logic for consistency
  const entityForActions = {
    ...category,
    isPinned: Boolean((category as any).isPinned),
    isPublic: Boolean((category as any).isPublic),
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>{category.name}</td>
      <td>{category.abbreviation ?? '—'}</td>
      <td>{entityForActions.isPublic ? 'Visible' : 'Hidden'}</td>
      <td onPointerDown={(e) => e.stopPropagation()}>
        {!isDragging && (
          <TableActions
            entity={entityForActions}
            deleteHandler={deleteHandler}
            updateHandler={() => updateHandler(entityForActions as Category)}
            // Using the typo'd prop name that <TableActions> expects
            pinHanlder={pinHandler}
            changeVisibilty={changeVisibilityHandler}
          />
        )}
      </td>
    </tr>
  );
};

interface Props {
  openFormForUpdating: (data: Category) => void;
}

export const CategoryTable = ({ openFormForUpdating }: Props): JSX.Element => {
  const {
    config: { config },
    categories: { categories: allCategories },
  } = useSelector((state: State) => state);

  // Create a new list that is filtered for ONLY bookmark categories  
  const categories = useMemo(() => (allCategories || [])
    .filter((category) => category.section === 'bookmarks')
    .sort((a, b) => a.orderId - b.orderId), [allCategories]);

  const dispatch = useDispatch();
  const {
    pinCategory,
    deleteCategory,
    createNotification,
    reorderCategories,
    updateCategory,
  } = bindActionCreators(actionCreators, dispatch);

  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Mirror store → local state
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // react-beautiful-dnd => @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // @dnd-kit => event object
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

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(localCategories, oldIndex, newIndex);
    
    setLocalCategories(reordered); 
    reorderCategories(reordered);
  };

  // Action handlers
  const deleteCategoryHandler = (id: number, name: string) => {
    const proceed = window.confirm(
      `Are you sure you want to delete ${name}? It will delete ALL assigned bookmarks`
    );
    if (proceed) deleteCategory(id);
  };

  const updateCategoryHandler = (categoryToUpdate: Category) => {
    openFormForUpdating(categoryToUpdate);
  };

  const pinCategoryHandler = (id: number) => {
    const categoryIndex = localCategories.findIndex((c) => c.id === id);
    if (categoryIndex > -1) {
      const category = localCategories[categoryIndex];
      pinCategory(category);
      const updatedCategories = [...localCategories];
      updatedCategories[categoryIndex] = { ...category, isPinned: !category.isPinned };
      setLocalCategories(updatedCategories);
    }
  };

  const changeCategoryVisibilityHandler = (id: number) => {
    const category = localCategories.find((c) => c.id === id) as Category;
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Abbrev</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={localCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {localCategories.map((category) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  deleteHandler={deleteCategoryHandler}
                  updateHandler={updateCategoryHandler}
                  pinHandler={pinCategoryHandler}
                  changeVisibilityHandler={changeCategoryVisibilityHandler}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </Fragment>
  );
};
