import classes from './BookmarkGrid.module.css';
import { Category } from '../../../interfaces';
import { BookmarkCard } from '../BookmarkCard/BookmarkCard';
import { Message } from '../../UI';

interface Props {
  categories: Category[];
  searching: boolean;
  fromHomepage?: boolean;
  selectCategoryHandler?: (category: Category) => void;
}

export const BookmarkGrid = (props: Props): JSX.Element => {
  const { categories, searching, fromHomepage = false, selectCategoryHandler } = props;

  if (searching && (categories[0]?.bookmarks ?? []).length === 0) {
    return <Message>No bookmarks match your search criteria</Message>;
  }

  return (
    <div className={classes.BookmarkGrid}>
      {categories.map((category: Category): JSX.Element => (
        <BookmarkCard
          category={category}
          fromHomepage={fromHomepage}
          key={category.id}
          selectCategoryHandler={selectCategoryHandler}
        />
      ))}
    </div>
  );
};
