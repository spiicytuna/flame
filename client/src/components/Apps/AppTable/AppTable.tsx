import { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// DND Kit Imports
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
import { App } from '../../../interfaces';

// UI
import { Message, Table } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

// Props for the new Sortable Row component
interface SortableAppRowProps {
  app: App;
  deleteHandler: (id: number, name: string) => void;
  updateHandler: (id: number) => void;
  pinHanlder: (id: number) => void;
  changeVisibilty: (id: number) => void;
}

// New component for the sortable table row
const SortableAppRow = ({
  app,
  deleteHandler,
  updateHandler,
  pinHanlder,
  changeVisibilty,
}: SortableAppRowProps) => {
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

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td style={{ width: '50px', cursor: 'grab' }} {...listeners}>
        ⋮⋮
      </td>
      <td style={{ width: '200px' }}>{app.name}</td>
      <td style={{ width: '200px' }}>{app.url}</td>
      <td style={{ width: '200px' }}>{app.icon}</td>
      <td style={{ width: '200px' }}>
        {app.isPublic ? 'Visible' : 'Hidden'}
      </td>

      {!isDragging && (
        <TableActions
          entity={app}
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
  openFormForUpdating: (app: App) => void;
}

export const AppTable = (props: Props): JSX.Element => {
  const {
    apps: { apps },
    config: { config },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { pinApp, deleteApp, reorderApps, createNotification, updateApp } =
    bindActionCreators(actionCreators, dispatch);

  const [localApps, setLocalApps] = useState<App[]>([]);

  // Copy apps array
  useEffect(() => {
    setLocalApps([...apps]);
  }, [apps]);

  // DND Kit sensors for pointer and keyboard accessibility
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

    if (over && active.id !== over.id) {
      const oldIndex = localApps.findIndex((a) => a.id === active.id);
      const newIndex = localApps.findIndex((a) => a.id === over.id);

      const reordered = arrayMove(localApps, oldIndex, newIndex);

      setLocalApps(reordered);
      reorderApps(reordered);
    }
  };

  // Action handlers
  const deleteAppHandler = (id: number, name: string) => {
    const proceed = window.confirm(`Are you sure you want to delete ${name}?`);

    if (proceed) {
      deleteApp(id);
    }
  };

  const updateAppHandler = (id: number) => {
    const app = apps.find((a) => a.id === id) as App;
    props.openFormForUpdating(app);
  };

  const pinAppHandler = (id: number) => {
    const app = apps.find((a) => a.id === id) as App;
    pinApp(app);
  };

  const changeAppVisibiltyHandler = (id: number) => {
    const app = apps.find((a) => a.id === id) as App;
    updateApp(id, { ...app, isPublic: !app.isPublic });
  };

  return (
    <Fragment>
      <Message isPrimary={false}>
        {config.useOrdering === 'orderId' ? (
          <>You can drag and drop single rows to reorder application</>
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
        <Table headers={['', 'Name', 'URL', 'Icon', 'Visibility', 'Actions']}>
          <SortableContext
            items={localApps.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {localApps.map((app: App) => (
              <SortableAppRow
                key={app.id}
                app={app}
                deleteHandler={deleteAppHandler}
                updateHandler={updateAppHandler}
                pinHanlder={pinAppHandler}
                changeVisibilty={changeAppVisibiltyHandler}
              />
            ))}
          </SortableContext>
        </Table>
      </DndContext>
    </Fragment>
  );
};
