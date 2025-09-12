import { Fragment, useState, useEffect, useMemo } from 'react';
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
import type { App, Category } from '../../../interfaces';

// UI
import { Message, ActionButton } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

// CSS
import styles from './AppTable.module.css';

interface SortableRowProps {
  app: App;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (id: number) => void;
  pinHandler: (id: number) => void;
  changeVisibilityHandler: (id: number) => void;
}

const SortableAppRow = ({
  app,
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
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: isDragging ? '1px solid var(--color-accent)' : 'none',
    borderRadius: '4px',
  };
  
  const entityForActions = {
    ...app,
    isPinned: !!app.isPinned,
    isPublic: !!app.isPublic,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>{app.name}</td>
      <td>{app.url}</td>
      <td>{app.icon}</td>
      <td>{entityForActions.isPublic ? 'Visible' : 'Hidden'}</td>
      <td onPointerDown={(e) => e.stopPropagation()}>
        {!isDragging && (
          <TableActions
            entity={entityForActions}
            deleteHandler={deleteHandler}
            updateHandler={updateHandler}
            pinHanlder={pinHandler}
            changeVisibilty={changeVisibilityHandler}
          />
        )}
      </td>
    </tr>
  );
};

interface Props {
  category: Category;
  openFormForUpdating: (app: App) => void;
  onFinishEditing: () => void;
}

export const AppTable = ({
  category,
  openFormForUpdating,
  onFinishEditing,
}: Props): JSX.Element => {
  const {
    apps: { apps: allApps },
    config: { config },
  } = useSelector((state: State) => state);
  
  const appsToShow = useMemo(() => {
    const filtered = allApps.filter(app => {
      if (category.id === -1) {
        return app.categoryId === null;
      }
      return app.categoryId === category.id;
    });
    return filtered.sort((a, b) => a.orderId - b.orderId);
  }, [allApps, category.id]);

  const dispatch = useDispatch();
  const { pinApp, deleteApp, reorderApps, createNotification, updateApp } =
    bindActionCreators(actionCreators, dispatch);

  const [localApps, setLocalApps] = useState<App[]>([]);

  // Update useEffect to use the filtered list
  useEffect(() => {
    setLocalApps(appsToShow);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);
  
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

    const oldIndex = localApps.findIndex((a) => a.id === active.id);
    const newIndex = localApps.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(localApps, oldIndex, newIndex);

    setLocalApps(reordered);
    reorderApps(reordered);
  };

  // Action handlers
  const deleteAppHandler = (id: number, name: string) => {
    const proceed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (proceed) {
      deleteApp(id);
    }
  };

  const updateAppHandler = (id: number) => {
    const app = allApps.find((a) => a.id === id) as App;
    openFormForUpdating(app);
  };

  const pinAppHandler = (id: number) => {
    // UI 1st
    setLocalApps(currentApps =>
      currentApps.map(app =>
        app.id === id ? { ...app, isPinned: !app.isPinned } : app
      )
    );

    const appToPin = localApps.find(app => app.id === id);
    if (appToPin) {
      // Redux action => app object
      pinApp(appToPin);
    }
  };

  const changeAppVisibilityHandler = (id: number) => {
    setLocalApps(currentApps => {
      const appToUpdate = currentApps.find(app => app.id === id);
      if (!appToUpdate) return currentApps;

      const updatedApp = { ...appToUpdate, isPublic: !appToUpdate.isPublic };
      updateApp(id, updatedApp);

      return currentApps.map(app => (app.id === id ? updatedApp : app));
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
          <p>You can drag and drop single rows to reorder applications</p>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={localApps.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {localApps.map((app: App) => (
                <SortableAppRow
                  key={app.id}
                  app={app}
                  deleteHandler={deleteAppHandler}
                  updateHandler={updateAppHandler}
                  pinHandler={pinAppHandler}
                  changeVisibilityHandler={changeAppVisibilityHandler}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </Fragment>
  );
};
