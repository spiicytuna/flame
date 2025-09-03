import { useEffect, useState, SyntheticEvent, ChangeEvent } from 'react';

// Redux
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { Category, NewCategory } from '../../../interfaces';

// UI
import { ModalForm, InputGroup, Button } from '../../UI';

interface Props {
  modalHandler: () => void;
  category?: Category;
}

export const CategoryForm = ({ category, modalHandler }: Props): JSX.Element => {
  // DEBUG lines (not typically neede)
  // console.log('--- CategoryForm component is rendering ---');
  // console.log('The category prop it received is:', category);

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

  // Prefill when editing
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

    const trimmed = name.trim();
    if (!trimmed) {
      createNotification({ title: 'Error', message: 'Category name is required' });
      return;
    }

    // Build payload
    const payload: NewCategory & { abbreviation?: string } = {
      name: trimmed,
      isPublic: !!isPublic,
      section: 'bookmarks',
      abbreviation: (abbreviation || '—').slice(0, 3),
    };

    if (!category) {
      addCategory(payload as any);
    } else {
      // only send fields that can be updated; id comes from URL
      updateCategory(category.id, payload as any);
    }

    setEditCategory(null);
    modalHandler();
  };

  return (
    <ModalForm modalHandler={modalHandler} formHandler={onSubmit}>
      <InputGroup>
        <label htmlFor="name">Category Name</label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Personal"
          required
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
            setIsPublic(parseInt(e.target.value, 10))
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
