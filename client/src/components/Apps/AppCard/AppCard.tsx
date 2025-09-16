import { useMemo } from 'react';
import classes from './AppCard.module.css';
import { Icon } from '../../UI';
import { iconParser, isImage, isSvg, isUrl, urlParser } from '../../../utility';

import { App } from '../../../interfaces';
import { useSelector } from 'react-redux';
import { State } from '../../../store/reducers';

interface Props {
  app: App;
  searching: boolean;
}

export const AppCard = ({ app, searching }: Props): JSX.Element => {
  const { config } = useSelector((state: State) => state.config);
  // get cats
  const { categories } = useSelector((state: State) => state.categories);

  const [displayUrl, redirectUrl] = urlParser(app.url);

  const category = useMemo(
    () => categories.find((c) => c.id === app.categoryId),
    [app.categoryId, categories]
  );

  // display name only
  const displayName = useMemo(() => {
    if (searching && category && category.abbreviation && category.abbreviation !== '—') {
      return `${app.name} (${category.abbreviation})`;
    }
    return app.name;
  }, [app.name, category, searching]);

  let iconEl: JSX.Element;
  const { icon } = app;

  if (isImage(icon)) {
    const source = isUrl(icon) ? icon : `/uploads/${icon}`;

    iconEl = (
      <img
        src={source}
        alt={`${app.name} icon`}
        className={classes.CustomIcon}
      />
    );
  } else if (isSvg(icon)) {
    const source = isUrl(icon) ? icon : `/uploads/${icon}`;

    iconEl = (
      <div className={classes.CustomIcon}>
        <svg
          data-src={source}
          fill="var(--color-primary)"
          className={classes.CustomIcon}
        ></svg>
      </div>
    );
  } else {
    iconEl = <Icon icon={iconParser(icon)} />;
  }

  return (
    <a
      href={redirectUrl}
      target={config.appsSameTab ? '' : '_blank'}
      rel="noreferrer"
      className={classes.AppCard}
    >
      <div className={classes.AppCardIcon}>{iconEl}</div>
      <div className={classes.AppCardDetails}>
        <h5>{displayName}</h5>
        <span>{!app.description.length ? displayUrl : app.description}</span>
      </div>
    </a>
  );
};
