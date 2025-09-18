import { useState, useEffect, Fragment } from 'react';

// Redux
import { useSelector } from 'react-redux';

// Typescript
import { Weather } from '../../../interfaces';

// CSS
import classes from './WeatherWidget.module.css';

// UI
import { WeatherIcon } from '../../UI';
import { State } from '../../../store/reducers';
import { weatherTemplate } from '../../../utility/templateObjects/weatherTemplate';


interface WidgetProps {
  onClick?: () => void;
}

export const WeatherWidget = ({ onClick }: WidgetProps): JSX.Element => {
  const { config } = useSelector((state: State) => state.config);

  // icon size ??
  const rawIconSize = (config as any)?.weatherWidgetIcon;
  let iconSize = 65;
  if (rawIconSize !== undefined && rawIconSize !== null) {
    const n = Number(rawIconSize);
    if (Number.isFinite(n) && n > 0) iconSize = Math.round(n);
  }
  iconSize = Math.max(24, Math.min(160, iconSize));

  const [weather, setWeather] = useState<Weather>(weatherTemplate);
  const [isLoading, setIsLoading] = useState(true);

  // socket for updates
  useEffect(() => {
    if (!config.WEATHER_API_KEY) return;

    const socketProtocol = document.location.protocol === 'http:' ? 'ws:' : 'wss:';
    const socketAddress = `${socketProtocol}//${window.location.host}/socket`;
    const webSocketClient = new WebSocket(socketAddress);

    webSocketClient.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setWeather(w => ({
        ...w,
        ...data,
      }));
      setIsLoading(false);
    };

    return () => webSocketClient.close();
  }, [config.WEATHER_API_KEY]);

  function formatWeatherData(type: string, w: Weather): string {
    switch (type) {
      case 'precip_mm':
        return `p: ${w.precip_mm}mm`;
      case 'precip_in':
        return `p: ${w.precip_in}in`;
      case 'vis_km':
        return `v: ${w.vis_km}km`;
      case 'vis_miles':
        return `v: ${w.vis_miles}mi`;
      case 'uv':
        return `uv: ${w.uv}`;
      case 'gust_kph':
        return `w: ${w.gust_kph}kph`;
      case 'gust_mph':
        return `w: ${w.gust_mph}mph`;
      default:
        return '';
    }
  }

  const interactive = typeof onClick === 'function';

  return (
    <div
      className={`${classes.WeatherWidget} ${
        !interactive ? classes.WeatherWidgetDisabled : ''
      }`}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-disabled={interactive ? undefined : true}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : -1}
      title={interactive ? 'Show forecast' : undefined}
    >
      {config.WEATHER_API_KEY && !isLoading && weather.id > 0 && (
        <Fragment>
          <div className={classes.WeatherIconBlock}>
            <div className={classes.WeatherIcon}>
              <WeatherIcon
                weatherStatusCode={weather.conditionCode}
                isDay={weather.isDay}
		size={iconSize}
              />
            </div>
            <div className={classes.WeatherLocation}>
              <span>{weather.location}</span>
            </div>
          </div>

          <div className={classes.WeatherDetails}>
            {config.isCelsius ? (
              <span>{weather.tempC}°C</span>
            ) : (
              <span>{Math.round(weather.tempF)}°F</span>
            )}
            <span>{weather[config.weatherData]}%</span>
          </div>

          {config.showExtraWeatherColumn && (
            <div className={classes.WeatherDetailsAddl}>
              <span>{formatWeatherData(config.extraWeatherTop, weather)}</span>
              <span>{formatWeatherData(config.extraWeatherBottom, weather)}</span>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
