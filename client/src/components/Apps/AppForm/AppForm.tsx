import { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NewApp } from '../../../interfaces';
import classes from './AppForm.module.css';
import { ModalForm, InputGroup, Button } from '../../UI';
import { inputHandler, newAppTemplate } from '../../../utility';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';

export const AppForm = ({ modalHandler }: { modalHandler: () => void }): JSX.Element => {
  const { appInUpdate } = useSelector((state: State) => state.apps);
  const { categories } = useSelector((state: State) => state.categories); // <- app categories

  const dispatch = useDispatch();
  const { addApp, updateApp, setEditApp, createNotification } =
    bindActionCreators(actionCreators, dispatch);

  const [useCustomIcon, toggleUseCustomIcon] = useState(false);
  const [customIcon, setCustomIcon] = useState<File | null>(null);
  const [formData, setFormData] = useState<NewApp>(newAppTemplate);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');

  useEffect(() => {
    if (appInUpdate) {
      setFormData({ ...appInUpdate });
      setSelectedCategoryId(appInUpdate.categoryId ?? '');
    } else {
      setFormData(newAppTemplate);
      // try to default to "Uncategorized" (apps)
      const unc = categories.find(
        (c) => c.name.toLowerCase() === 'uncategorized' && c.section === 'apps'
      );
      setSelectedCategoryId(unc ? unc.id : '');
    }
  }, [appInUpdate, categories]);

  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<NewApp>({ e, options, setStateHandler: setFormData, state: formData });
  };

  const fileChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setCustomIcon(e.target.files[0]);
  };

  const formSubmitHandler = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    for (let field of ['name', 'url', 'icon'] as const) {
      if (/^ +$/.test(formData[field])) {
        createNotification({ title: 'Error', message: `Field cannot be empty: ${field}` });
        return;
      }
    }
    if (!selectedCategoryId) {
      createNotification({ title: 'Error', message: 'Please select a category.' });
      return;
    }

    const createFormData = (): FormData => {
      const data = new FormData();
      if (customIcon) data.append('icon', customIcon);
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('url', formData.url);
      data.append('isPublic', `${formData.isPublic ? 1 : 0}`);
      data.append('categoryId', String(selectedCategoryId)); // <- important
      return data;
    };

    if (!appInUpdate) {
      if (customIcon) {
        addApp(createFormData());
      } else {
        addApp({ ...formData, categoryId: selectedCategoryId }); // <- important
      }
    } else {
      if (customIcon) {
        updateApp(appInUpdate.id, createFormData());
      } else {
        updateApp(appInUpdate.id, { ...formData, categoryId: selectedCategoryId }); // <- important
        modalHandler();
      }
    }

    setFormData(newAppTemplate);
    setEditApp(null);
  };

  return (
    <ModalForm modalHandler={modalHandler} formHandler={formSubmitHandler}>
      {/* NAME */}
      <InputGroup>
        <label htmlFor="name">App name</label>
        <input
          type="text" name="name" id="name" placeholder="Bookstack" required
          value={formData.name} onChange={inputChangeHandler}
        />
      </InputGroup>

      {/* URL */}
      <InputGroup>
        <label htmlFor="url">App URL</label>
        <input
          type="text" name="url" id="url" placeholder="bookstack.example.com" required
          value={formData.url} onChange={inputChangeHandler}
        />
      </InputGroup>

      {/* DESCRIPTION */}
      <InputGroup>
        <label htmlFor="description">App description</label>
        <input
          type="text" name="description" id="description" placeholder="My self-hosted app"
          value={formData.description} onChange={inputChangeHandler}
        />
        <span>Optional - If description is not set, app URL will be displayed</span>
      </InputGroup>

      {/* CATEGORY */}
      <InputGroup>
        <label htmlFor="categoryId">Category</label>
        <select
          id="categoryId"
          name="categoryId"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          required
        >
          <option value="" disabled>Select a category</option>
          {categories
            .filter((c) => c.section === 'apps')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
      </InputGroup>

      {/* ICON (MDI or upload) */}
      {!useCustomIcon ? (
        <InputGroup>
          <label htmlFor="icon">App icon</label>
          <input
            type="text" name="icon" id="icon" placeholder="book-open-outline" required
            value={formData.icon} onChange={inputChangeHandler}
          />
          <span>
            Use icon name from MDI or pass a valid URL.
            <a href="https://pictogrammers.com/library/mdi/" target="blank"> Click here for reference</a>
          </span>
          <span onClick={() => toggleUseCustomIcon(!useCustomIcon)} className={classes.Switch}>
            Switch to custom icon upload
          </span>
        </InputGroup>
      ) : (
        <InputGroup>
          <label htmlFor="icon">App Icon</label>
          <input type="file" name="icon" id="icon" required onChange={fileChangeHandler}
                 accept=".jpg,.jpeg,.png,.svg,.ico" />
          <span
            onClick={() => { setCustomIcon(null); toggleUseCustomIcon(!useCustomIcon); }}
            className={classes.Switch}
          >
            Switch to MDI
          </span>
        </InputGroup>
      )}

      {/* VISIBILITY */}
      <InputGroup>
        <label htmlFor="isPublic">App visibility</label>
        <select
          id="isPublic" name="isPublic"
          value={formData.isPublic ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>Visible (anyone can access it)</option>
          <option value={0}>Hidden (authentication required)</option>
        </select>
      </InputGroup>

      {!appInUpdate ? <Button>Add new application</Button> : <Button>Update application</Button>}
    </ModalForm>
  );
};
