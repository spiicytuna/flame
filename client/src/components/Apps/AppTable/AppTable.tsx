import { Fragment, useState, useEffect } from 'react';
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
import type { App, App as AppModel, Category } from '../../../interfaces';

// Other
import { Message, Table, ActionButton } from '../../UI';
import { TableActions } from '../../Actions/TableActions';

interface Props {
  category: Category;
  openFormForUpdating: (app: AppModel) => void;
  onFinishEditing: () => void;
}

export const AppTable = (props: Props): JSX.Element => {
  const {
    apps: { apps: allApps }, // Renamed to allApps for clarity
    config: { config },
  } = useSelector((state: State) => state);

  // This is the new filtering logic
  const appsToShow = allApps.filter(app => {
    // Handle the special "Uncategorized" case
    if (props.category.id === -1) {
      return app.categoryId === null;
    }
    return app.categoryId === props.category.id;
  });

  const dispatch = useDispatch();
  const { pinApp, deleteApp, reorderApps, createNotification, updateApp } =
    bindActionCreators(actionCreators, dispatch);

  const [localApps, setLocalApps] = useState<App[]>([]);

  // Update useEffect to use the filtered list
  useEffect(() => {
    setLocalApps([...appsToShow]);
  }, [appsToShow]);

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

    const tmpApps = [...localApps];
    const [movedApp] = tmpApps.splice(result.source.index, 1);
    tmpApps.splice(result.destination.index, 0, movedApp);

    setLocalApps(tmpApps);
    reorderApps(tmpApps);
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
    props.openFormForUpdating(app);
  };

  const pinAppHandler = (id: number) => {
    const app = allApps.find((a) => a.id === id) as App;
    pinApp(app);
  };

  const changeAppVisibiltyHandler = (id: number) => {
    const app = allApps.find((a) => a.id === id) as App;
    updateApp(id, { ...app, isPublic: !app.isPublic });
  };

  return (
    <Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>Editing: {props.category.name}</h2>
        <ActionButton
          name="Done Editing"
          icon="mdiPencilOff"
          handler={props.onFinishEditing}
        />
      </div>
      <Message isPrimary={false}>

        {config.useOrdering === 'orderId' ? (
          <p>You can drag and drop single rows to reorder application</p>
        ) : (
          <p>
            Custom order is disabled. You can change it in the{' '}
            <Link to="/settings/general">settings</Link>
          </p>
        )}
      </Message>

      <DragDropContext onDragEnd={dragEndHanlder}>
        <Droppable droppableId="apps">
          {(provided) => (
            <Table
              headers={['Name', 'URL', 'Icon', 'Visibility', 'Actions']}
              innerRef={provided.innerRef}
            >
              {localApps.map((app: App, index): JSX.Element => {
                return (
                  <Draggable
                    key={app.id}
                    draggableId={app.id.toString()}
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
                          <td style={{ width: '200px' }}>{app.name}</td>
                          <td style={{ width: '200px' }}>{app.url}</td>
                          <td style={{ width: '200px' }}>{app.icon}</td>
                          <td style={{ width: '200px' }}>
                            {app.isPublic ? 'Visible' : 'Hidden'}
                          </td>

                          {!snapshot.isDragging && (
                            <TableActions
                              entity={app}
                              deleteHandler={deleteAppHandler}
                              updateHandler={updateAppHandler}
                              pinHanlder={pinAppHandler}
                              changeVisibilty={changeAppVisibiltyHandler}
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
