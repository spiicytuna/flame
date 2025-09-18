import { Fragment } from 'react';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../../store/reducers';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';

// Typescript
import { Bookmark, Category } from '../../../interfaces';

// Other
import classes from './BookmarkCard.module.css';
import { Icon } from '../../UI';
import { iconParser, isImage, isSvg, isUrl, urlParser } from '../../../utility';

interface Props {
  category: Category;
  fromHomepage?: boolean;
  iconSizePx?: number;
}

export const BookmarkCard = (props: Props): JSX.Element => {
  const { category, fromHomepage = false, iconSizePx } = props;

  // default !provided
  const size =
    typeof iconSizePx === 'number' && Number.isFinite(iconSizePx)
      ? Math.max(12, Math.min(64, Math.round(iconSizePx)))
      : 32;

  const {
    config: { config },
    auth: { isAuthenticated },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { setEditCategory } = bindActionCreators(actionCreators, dispatch);

  return (
    <div className={classes.BookmarkCard}>
      <h3
        className={fromHomepage || !isAuthenticated ? '' : classes.BookmarkHeader}
        onClick={() => {
          if (!fromHomepage && isAuthenticated) {
            setEditCategory(category);
          }
        }}
      >
        {category.name}
      </h3>

      <div className={classes.Bookmarks}>
        {category.bookmarks.map((bookmark: Bookmark) => {
          const redirectUrl = urlParser(bookmark.url)[1];

          let iconEl: JSX.Element = <Fragment></Fragment>;

          if (bookmark.icon) {
            const { icon, name } = bookmark;

            if (isImage(icon)) {
              const source = isUrl(icon) ? icon : `/uploads/${icon}`;

              iconEl = (
                <div
                  className={classes.BookmarkIcon}
                  style={{ width: `${size}px`, height: `${size}px` }}
                >
                  <img
                    src={source}
                    alt={`${name} icon`}
                    className={classes.CustomIcon}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              );
            } else if (isSvg(icon)) {
              const source = isUrl(icon) ? icon : `/uploads/${icon}`;

              iconEl = (
                <div
                  className={classes.BookmarkIcon}
                  style={{ width: `${size}px`, height: `${size}px` }}
                >
                  <svg
                    data-src={source}
                    fill="var(--color-primary)"
                    className={classes.BookmarkIconSvg}
                    // placeholder
                    width={size}
                    height={size}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              );
            } else {
              // mdiIconName
              iconEl = (
                <div
                  className={classes.BookmarkIcon}
                  style={{ width: `${size}px`, height: `${size}px` }}
                >
                  <Icon icon={iconParser(icon)} sizePx={size} />
                </div>
              );
            }
          }

          return (
            <a
              href={redirectUrl}
              target={config.bookmarksSameTab ? '' : '_blank'}
              rel="noreferrer"
              key={`bookmark-${bookmark.id}`}
            >
              {bookmark.icon && iconEl}
              {bookmark.name}
            </a>
          );
        })}
      </div>
    </div>
  );
};
