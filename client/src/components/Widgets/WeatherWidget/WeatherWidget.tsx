import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';

// Redux
import { useSelector } from 'react-redux';

// Typescript
import { Weather, ApiResponse } from '../../../interfaces';

// CSS
import classes from './WeatherWidget.module.css';

// UI
import { WeatherIcon } from '../../UI';
import { State } from '../../../store/reducers';
import { weatherTemplate } from '../../../utility/templateObjects/weatherTemplate';


export const WeatherWidget = (): JSX.Element => {
  const { loading: configLoading, config } = useSelector(
    (state: State) => state.config
  );

  const [weather, setWeather] = useState<Weather>(weatherTemplate);
  const [isLoading, setIsLoading] = useState(true);

  // Initial request to get data
  useEffect(() => {
    // Only make the API call if there is a key
    if (config.WEATHER_API_KEY) {
      axios
        .get<ApiResponse<Weather[]>>('/api/weather')
        .then((data) => {
          const weatherData = data.data.data[0];
          if (weatherData) {
            setWeather(weatherData);
          }
        })
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false)); // Always stop loading
    } else {
      // If no key is present => do nothing
      setIsLoading(false);
    }
    // Re-run if API key is added, updated, or removed
  }, [config.WEATHER_API_KEY]);

  // socket for updates
  useEffect(() => {
    // guard the socket connection.
    if (!config.WEATHER_API_KEY) {
      return;
    }

    const socketProtocol =
      document.location.protocol === 'http:' ? 'ws:' : 'wss:';
    const socketAddress = `${socketProtocol}//${window.location.host}/socket`;
    const webSocketClient = new WebSocket(socketAddress);

    webSocketClient.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setWeather({
        ...weather,
        ...data,
      });
    };

    return () => webSocketClient.close();
  }, [config.WEATHER_API_KEY]); // depends on API key

  function formatWeatherData(type: string, weather: Weather): string {
  switch (type) {
    case 'precip_mm':
      return `p: ${weather.precip_mm}mm`;
    case 'precip_in':
      return `p: ${weather.precip_in}in`;
    case 'vis_km':
      return `v: ${weather.vis_km}km`;
    case 'vis_miles':
      return `v: ${weather.vis_miles}mi`;
    case 'uv':
      return `uv: ${weather.uv}`;
    case 'gust_kph':
      return `w: ${weather.gust_kph}kph`;
    case 'gust_mph':
      return `w: ${weather.gust_mph}mph`;
    default:
      return '';
  }
}

  return (
    <div className={classes.WeatherWidget}>
      {config.WEATHER_API_KEY && !isLoading && weather.id > 0 && (
        <Fragment>
          <div className={classes.WeatherIconBlock}>
            <div className={classes.WeatherIcon}>
              <WeatherIcon
                weatherStatusCode={weather.conditionCode}
                isDay={weather.isDay}
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
