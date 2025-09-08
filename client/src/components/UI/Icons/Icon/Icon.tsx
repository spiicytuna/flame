import classes from './Icon.module.css';

import { Icon as MDIcon } from '@mdi/react';
import * as MDIcons from '@mdi/js';

interface Props {
  icon: string;
  color?: string;
  className?: string;
}

export const Icon = ({ icon, color, className }: Props): JSX.Element => {
  let iconPath = (MDIcons as any)[icon];

  if (!iconPath) {
    console.log(`Icon ${icon} not found`);
    iconPath = MDIcons.mdiCancel;
  }

  const combinedClassName = `${classes.Icon} ${className || ''}`.trim();

  return (
    <MDIcon
      className={combinedClassName}
      path={iconPath}
      color={color ? color : 'var(--color-primary)'}
    />
  );
};
