import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';

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

// props => sort row component
interface SortableCategoryRowProps {
  category: Category;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (id: number) => void;
  pinHanlder: (id: number) => void;
  changeVisibilty: (id: number) => void;
}

const SortableCategoryRow = ({
  category,
  deleteHandler,
  updateHandler,
  pinHanlder,
  changeVisibilty,
}: SortableCategoryRowProps) => {
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

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td style={{ width: '50px', cursor: 'grab' }} {...listeners}>
        ⋮⋮
      </td>
      <td style={{ width: '300px' }}>{category.name}</td>
      <td style={{ width: '300px' }}>
        {category.isPublic ? 'Visible' : 'Hidden'}
      </td>
      {!isDragging && (
        <TableActions
          entity={category}
          deleteHandler={deleteHandler}
          updateHandler={updateHandler}
          pinHanlder={pinHanlder}
          changeVisibilty={changeVisibilty}
        />
      )}
    </tr>
  );
};

interface Props {
  openFormForUpdating: (data: Category | Bookmark) => void;
}

export const CategoryTable = ({ openFormForUpdating }: Props): JSX.Element => {
  const {
    config: { config },
    bookmarks: { categories },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const {
    pinCategory,
    deleteCategory,
    createNotification,
    reorderCategories,
    updateCategory,
  } = bindActionCreators(actionCreators, dispatch);

  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Copy categories array
  useEffect(() => {
    setLocalCategories([...categories]);
  }, [categories]);
  
  // mouse+keyboard
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
      const oldIndex = localCategories.findIndex((c) => c.id === active.id);
      const newIndex = localCategories.findIndex((c) => c.id === over.id);
      
      const reordered = arrayMove(localCategories, oldIndex, newIndex);
      
      setLocalCategories(reordered);
      reorderCategories(reordered);
    }
  };

  // Action handlers
  const deleteCategoryHandler = (id: number, name: string) => {
    const proceed = window.confirm(
      `Are you sure you want to delete ${name}? It will delete ALL assigned bookmarks`
    );
    if (proceed) deleteCategory(id);
  };

  const updateCategoryHandler = (id: number) => {
    const category = categories.find((c) => c.id === id) as Category;
    openFormForUpdating(category);
  };

  const pinCategoryHandler = (id: number) => {
    const category = categories.find((c) => c.id === id) as Category;
    pinCategory(category);
  };

  const changeCategoryVisibiltyHandler = (id: number) => {
    const category = categories.find((c) => c.id === id) as Category;
    updateCategory(id, { ...category, isPublic: !category.isPublic });
  };

  return (
    <Fragment>
      <Message isPrimary={false}>
        {config.useOrdering === 'orderId' ? (
          <>You can drag and drop single rows to reorder categories</>
        ) : (
          <>
            Custom order is disabled. You can change it in the{' '}
            <Link to="/settings/general">settings</Link>
          </>
        )}
      </Message>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table headers={['', 'Name', 'Visibility', 'Actions']}>
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
                pinHanlder={pinCategoryHandler}
                changeVisibilty={changeCategoryVisibiltyHandler}
              />
            ))}
          </SortableContext>
        </Table>
      </DndContext>
    </Fragment>
  );
};
