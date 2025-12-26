import classes from './AppCard.module.css';
import { Icon } from '../../UI';
import { iconParser, isImage, isSvg, isUrl, urlParser, getFaviconUrl } from '../../../utility';

import { App } from '../../../interfaces';
import { useSelector } from 'react-redux';
import { State } from '../../../store/reducers';

interface Props {
  app: App;
}

export const AppCard = ({ app }: Props): JSX.Element => {
  const { config } = useSelector((state: State) => state.config);

  const [displayUrl, redirectUrl] = urlParser(app.url);

  let iconEl: JSX.Element;
  const { icon } = app;
  const hasIcon = icon && icon.trim().length > 0;

  if (hasIcon && isImage(icon)) {
    const source = isUrl(icon) ? icon : `/uploads/${icon}`;

    iconEl = (
      <img
        src={source}
        alt={`${app.name} icon`}
        className={classes.CustomIcon}
      />
    );
  } else if (hasIcon && isSvg(icon)) {
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
  } else if (hasIcon) {
    iconEl = <Icon icon={iconParser(icon)} />;
  } else {
    // No icon set - use favicon from the app's URL
    const faviconUrl = getFaviconUrl(app.url);
    iconEl = (
      <img
        src={faviconUrl}
        alt={`${app.name} icon`}
        className={classes.CustomIcon}
      />
    );
  }

  return (
    <a
      href={redirectUrl}
      target={config.appsSameTab ? '' : '_blank'}
      rel="noreferrer"
      className={classes.AppCard}
    >
      <div
        className={classes.AppCardIcon}
        style={app.invertIcon ? { filter: 'invert(1)' } : {}}
      >
        {iconEl}
      </div>
      <div className={classes.AppCardDetails}>
        <h5>{app.name}</h5>
        <span>{!app.description.length ? displayUrl : app.description}</span>
      </div>
    </a>
  );
};
