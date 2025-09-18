import classes from './Icon.module.css';
import { Icon as MDIcon } from '@mdi/react';
import * as MDIcons from '@mdi/js';

interface Props {
  icon?: string;
  iconPath?: string;
  color?: string;
  className?: string;
  sizePx?: number;
}

export const Icon = ({ icon, iconPath, color, className, sizePx = 32 }: Props): JSX.Element => {
  let path = iconPath;
  if (!path && icon) {
    path = (MDIcons as any)[icon];
  }
  if (!path) {
    console.warn(`Icon not found for props: icon="${icon}"`);
    path = MDIcons.mdiCancel;
  }

  return (
    <MDIcon
      path={path as string}
      color={color ?? 'currentColor'}
      className={`${classes.Icon} ${className ?? ''}`}
      // explicit px => !font-size
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        minWidth: `${sizePx}px`,
        minHeight: `${sizePx}px`,
      }}
    />
  );
};
