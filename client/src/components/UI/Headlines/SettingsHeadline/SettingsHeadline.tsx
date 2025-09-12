import { type ReactNode } from 'react';
import classes from './SettingsHeadline.module.css';

interface Props {
  text?: string;
  children?: ReactNode;
}

export const SettingsHeadline = ({ text, children }: Props): JSX.Element => {
  return <h2 className={classes.SettingsHeadline}>{children ?? text}</h2>;
};
