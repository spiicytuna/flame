import { Category, Bookmark } from '../../../interfaces';
import { ContentType } from '../Bookmarks';
import { BookmarksTable } from './BookmarksTable';
import { CategoryTable } from './CategoryTable';

interface Props {
  contentType: ContentType;
  openFormForUpdating: (data: Category | Bookmark) => void;
  category?: Category;
  onFinishEditing?: () => void;
}

export const Table = (props: Props): JSX.Element => {
  const tableEl =
    props.contentType === ContentType.category ? (
      <CategoryTable openFormForUpdating={props.openFormForUpdating} />
    ) : (
      <BookmarksTable
        category={props.category!}
        openFormForUpdating={props.openFormForUpdating}
        onFinishEditing={props.onFinishEditing!}
      />
    );

  return tableEl;
};
