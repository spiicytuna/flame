// Typescript
import { ContentType } from '../Bookmarks';

// Utils
import { CategoryForm } from './CategoryForm';
import { BookmarksForm } from './BookmarksForm';
import { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bookmarkTemplate } from '../../../utility';
import { Category } from '../../../interfaces';

interface Props {
  modalHandler: () => void;
  contentType: ContentType;
  inUpdate?: boolean;
  categoryToEdit?: Category; // ✅ THIS IS THE FIX
}

export const Form = (props: Props): JSX.Element => {
  // We no longer need categoryInEdit from Redux
  const { bookmarkInEdit } = useSelector((state: State) => state.bookmarks);

  const { modalHandler, contentType, inUpdate, categoryToEdit } = props;

  return (
    <Fragment>
      {!inUpdate ? (
        // form: add new
        <Fragment>
          {contentType === ContentType.category ? (
            <CategoryForm modalHandler={modalHandler} />
          ) : (
            <BookmarksForm modalHandler={modalHandler} />
          )}
        </Fragment>
      ) : (
        // form: update
        <Fragment>
          {contentType === ContentType.category ? (
            <CategoryForm
              modalHandler={modalHandler}
              // Use the prop directly
              category={categoryToEdit}
            />
          ) : (
            <BookmarksForm
              modalHandler={modalHandler}
              bookmark={bookmarkInEdit || bookmarkTemplate}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};
