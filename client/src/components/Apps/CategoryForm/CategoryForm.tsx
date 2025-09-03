import { useEffect, useState, SyntheticEvent, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { State } from '../../../store/reducers';
import { actionCreators } from '../../../store';

import { Category } from '../../../interfaces';
import { ModalForm, InputGroup, Button } from '../../UI';

interface Props {
  modalHandler: () => void;
  category?: Category; // if present -> update; else -> create
}

export const CategoryForm = ({ modalHandler, category }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const {
    addCategory,
    updateCategory,
    createNotification,
    setEditCategory,
  } = bindActionCreators(actionCreators, dispatch);

  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState<number>(1);
  const [abbreviation, setAbbreviation] = useState<string>('—');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIsPublic(category.isPublic ? 1 : 0);
      setAbbreviation((category.abbreviation ?? '—').slice(0, 3));
    } else {
      setName('');
      setIsPublic(1);
      setAbbreviation('—');
    }
  }, [category]);

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!name || /^ +$/.test(name)) {
      createNotification({ title: 'Error', message: 'Category name is required' });
      return;
    }

    const payload = {
      name,
      isPublic: !!isPublic,
      section: 'apps' as const,
      abbreviation: (abbreviation && abbreviation.trim()) ? abbreviation.slice(0, 3) : '—',
    };

    if (category) {
      updateCategory(category.id, payload);
    } else {
      addCategory(payload as any);
    }

    setEditCategory(null);
    modalHandler();
  };

  return (
    <ModalForm modalHandler={modalHandler} formHandler={onSubmit}>
      <InputGroup>
        <label htmlFor="name">Category Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Engineering"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
      </InputGroup>

      <InputGroup>
        <label htmlFor="abbr">Category Abbreviation: Used for Searching</label>
        <input
          id="abbr"
          name="abbreviation"
          type="text"
          maxLength={3}
          placeholder="—"
          value={abbreviation}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAbbreviation(e.target.value.slice(0, 3))
          }
        />
      </InputGroup>

      <InputGroup>
        <label htmlFor="isPublic">Category visibility</label>
        <select
          id="isPublic"
          name="isPublic"
          value={isPublic}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setIsPublic(parseInt(e.target.value))
          }
        >
          <option value={1}>Visible (anyone can access it)</option>
          <option value={0}>Hidden (authentication required)</option>
        </select>
      </InputGroup>

      <Button>{category ? 'Update category' : 'Add new category'}</Button>
    </ModalForm>
  );
};

export default CategoryForm;
