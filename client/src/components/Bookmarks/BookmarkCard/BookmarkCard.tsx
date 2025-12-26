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
import { iconParser, isImage, isSvg, isUrl, urlParser, getFaviconUrl } from '../../../utility';

interface Props {
  category: Category;
  fromHomepage?: boolean;
}

export const BookmarkCard = (props: Props): JSX.Element => {
  const { category, fromHomepage = false } = props;

  const {
    config: { config },
    auth: { isAuthenticated },
  } = useSelector((state: State) => state);

  const dispatch = useDispatch();
  const { setEditCategory } = bindActionCreators(actionCreators, dispatch);

  return (
    <div className={classes.BookmarkCard}>
      <h3
        className={
          fromHomepage || !isAuthenticated ? '' : classes.BookmarkHeader
        }
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
          const { icon, name } = bookmark;
          const hasIcon = icon && icon.trim().length > 0;

          if (hasIcon && isImage(icon)) {
            const source = isUrl(icon) ? icon : `/uploads/${icon}`;

            iconEl = (
              <div
                className={classes.BookmarkIcon}
                style={bookmark.invertIcon ? { filter: 'invert(1)' } : {}}
              >
                <img
                  src={source}
                  alt={`${name} icon`}
                  className={classes.CustomIcon}
                />
              </div>
            );
          } else if (hasIcon && isSvg(icon)) {
            const source = isUrl(icon) ? icon : `/uploads/${icon}`;

            iconEl = (
              <div
                className={classes.BookmarkIcon}
                style={bookmark.invertIcon ? { filter: 'invert(1)' } : {}}
              >
                <svg
                  data-src={source}
                  fill="var(--color-primary)"
                  className={classes.BookmarkIconSvg}
                ></svg>
              </div>
            );
          } else if (hasIcon) {
            iconEl = (
              <div
                className={classes.BookmarkIcon}
                style={bookmark.invertIcon ? { filter: 'invert(1)' } : {}}
              >
                <Icon icon={iconParser(icon)} />
              </div>
            );
          } else {
            // No icon set - use favicon from the bookmark's URL
            const faviconUrl = getFaviconUrl(bookmark.url);
            iconEl = (
              <div
                className={classes.BookmarkIcon}
                style={bookmark.invertIcon ? { filter: 'invert(1)' } : {}}
              >
                <img
                  src={faviconUrl}
                  alt={`${bookmark.name} icon`}
                  className={classes.CustomIcon}
                />
              </div>
            );
          }

          return (
            <a
              href={redirectUrl}
              target={config.bookmarksSameTab ? '' : '_blank'}
              rel="noreferrer"
              key={`bookmark-${bookmark.id}`}
            >
              {iconEl}
              {bookmark.name}
            </a>
          );
        })}
      </div>
    </div>
  );
};
