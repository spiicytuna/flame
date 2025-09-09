import { NavLink, Link, Routes, Route } from 'react-router-dom';

// Redux
import { useSelector } from 'react-redux';
import { State } from '../../store/reducers';

// CSS
import classes from './Settings.module.css';

// Components
import { Container } from '../UI';
import { GeneralSettings } from './GeneralSettings/GeneralSettings';
import { UISettings } from './UISettings/UISettings';
import { WeatherSettings } from './WeatherSettings/WeatherSettings';
import { DockerSettings } from './DockerSettings/DockerSettings';
import { Themer } from './Themer/Themer';
import { AppDetails } from './AppDetails/AppDetails';
import { AuthForm } from './AppDetails/AuthForm/AuthForm';
import { StyleSettings } from './StyleSettings/StyleSettings';

export const Settings = (): JSX.Element => {
  const { isAuthenticated } = useSelector((state: State) => state.auth);

  return (
    <Container>
      {!isAuthenticated ? (
        <AuthForm />
      ) : (
        <div className={classes.Settings}>
          <div className={classes.SettingsNav}>
            <h2 className={classes.SettingsNavTitle}>Settings</h2>
            <NavLink
              to="/settings/app"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              General
            </NavLink>
            <NavLink
              to="/settings/ui"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              Interface
            </NavLink>
            <NavLink
              to="/settings/weather"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              Weather
            </NavLink>
            <NavLink
              to="/settings/docker"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              Docker
            </NavLink>
            <NavLink
              to="/settings/theme"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              Theme
            </NavLink>
            <NavLink
              to="/settings/css"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              CSS
            </NavLink>
            <NavLink
              to="/settings/details"
              className={classes.SettingsNavLink}
              activeClassName={classes.Active}
            >
              About
            </NavLink>
            <Link to="/" className={classes.GoBack}>
              Go back
            </Link>
          </div>
          <div className={classes.SettingsContent}>
            <Routes>
              <Route path="/app" element={<GeneralSettings />} />
              <Route path="/ui" element={<UISettings />} />
              <Route path="/weather" element={<WeatherSettings />} />
              <Route path="/docker" element={<DockerSettings />} />
              <Route path="/theme" element={<Themer />} />
	      <Route path="/css" element={<StyleSettings />} />
              <Route path="/details" element={<AppDetails />} />
            </Routes>
          </div>
        </div>
      )}
    </Container>
  );
};
