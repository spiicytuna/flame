import { useState, ChangeEvent, useEffect, FormEvent } from 'react';
import axios from 'axios';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';

// Typescript
import { ApiResponse, Weather, WeatherForm } from '../../../interfaces';

// UI
import { InputGroup, Button, SettingsHeadline } from '../../UI';

// Utils
import { inputHandler, weatherSettingsTemplate } from '../../../utility';

export const WeatherSettings = (): JSX.Element => {
  const { loading, config } = useSelector((state: State) => state.config);

  const dispatch = useDispatch();
  const { createNotification, updateConfig } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // Initial state
  const [formData, setFormData] = useState<WeatherForm>(
    weatherSettingsTemplate
  );

  // Get config
  useEffect(() => {
    setFormData({
      WEATHER_API_KEY: config.WEATHER_API_KEY,
      lat: config.lat,
      long: config.long,
      isCelsius: config.isCelsius,
      weatherData: config.weatherData,
      weatherMode: config.weatherMode || 'geoip',
      showExtraWeatherColumn: config.showExtraWeatherColumn || false,
      extraWeatherTop: config.extraWeatherTop || 'uv',
      extraWeatherBottom: config.extraWeatherBottom || 'gust_mph',
      forecastEnable: config.forecastEnable || false,
      forecastDays: config.forecastDays || 5,
      forecastCache: config.forecastCache || false,
      weatherWidgetIcon: config.weatherWidgetIcon || 65,
    });
  }, [loading]);

  // Form handler
  const formSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    // Check for api key input
    if ((formData.lat || formData.long) && !formData.WEATHER_API_KEY) {
      createNotification({
        title: 'Warning',
        message: 'API key is missing. Weather Module will NOT work',
      });
    }

    // Save settings
    await updateConfig(formData);

    // Update weather
    axios
      .get<ApiResponse<{ message: string }>>('/api/weather/update')
      .then(() => {
        createNotification({
          title: 'Success',
          message: 'Weather updated',
        });
      })
      .catch((err) => {
        createNotification({
          title: 'Error',
          message: err.response.data.error,
        });
      });
  };

  // Input handler
  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<WeatherForm>({
      e,
      options,
      setStateHandler: setFormData,
      state: formData,
    });
  };

  // Get user location
  const getLocation = () => {
    window.navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setFormData({
          ...formData,
          lat: latitude,
          long: longitude,
        });
      }
    );
  };

  return (
    <form onSubmit={(e) => formSubmitHandler(e)}>
      <SettingsHeadline text="API" />
      {/* API KEY */}
      <InputGroup>
        <label htmlFor="WEATHER_API_KEY">API key</label>
        <input
          type="text"
          id="WEATHER_API_KEY"
          name="WEATHER_API_KEY"
          placeholder="secret"
          value={formData.WEATHER_API_KEY}
          onChange={(e) => inputChangeHandler(e)}
        />
        <span>
          Using
          <a href="https://www.weatherapi.com/pricing.aspx" target="blank">
            {' '}
            Weather API
          </a>
          . Key is required for weather module to work.
        </span>
      </InputGroup>

      <InputGroup>
        <label htmlFor="weatherMode">Lookup Location</label>
        <select
          id="weatherMode"
          name="weatherMode"
          value={formData.weatherMode || 'geoip'}
          onChange={(e) => inputChangeHandler(e)}
        >
          <option value="geoip">Automatic (GeoIP lookup)</option>
          <option value="fixed">Use Fixed Lat/Long</option>
        </select>
        <span>
          Use automatic IP-based lookup (default), or force static coordinates.
        </span>
      </InputGroup>
      <InputGroup>
        <label htmlFor="lat">Homepage widget icon size</label>
        <input
          type="number"
          id="weatherWidgetIcon"
          name="weatherWidgetIcon"
          placeholder="65"
          value={formData.weatherWidgetIcon}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          step="any"
          lang="en-150"
        />
        <span>
          Size constraints: 24 - 160
        </span>
      </InputGroup>

      <SettingsHeadline text="Location" />
      {/* LAT */}
      <InputGroup>
        <label htmlFor="lat">Latitude</label>
        <input
          type="number"
          id="lat"
          name="lat"
          placeholder="52.22"
          value={formData.lat}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          step="any"
          lang="en-150"
        />
        <span onClick={getLocation}>
          <a href="#">Click to get current location</a>
        </span>
      </InputGroup>

      {/* LONG */}
      <InputGroup>
        <label htmlFor="long">Longitude</label>
        <input
          type="number"
          id="long"
          name="long"
          placeholder="21.01"
          value={formData.long}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          step="any"
          lang="en-150"
        />
      </InputGroup>

      <SettingsHeadline text="Other" />
      {/* TEMPERATURE */}
      <InputGroup>
        <label htmlFor="isCelsius">Temperature unit</label>
        <select
          id="isCelsius"
          name="isCelsius"
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
          value={formData.isCelsius ? 1 : 0}
        >
          <option value={1}>Celsius</option>
          <option value={0}>Fahrenheit</option>
        </select>
      </InputGroup>

      {/* WEATHER DATA */}
      <InputGroup>
        <label htmlFor="weatherData">Additional weather data</label>
        <select
          id="weatherData"
          name="weatherData"
          value={formData.weatherData}
          onChange={(e) => inputChangeHandler(e)}
        >
          <option value="cloud">Cloud coverage</option>
          <option value="humidity">Humidity</option>
        </select>
      </InputGroup>


      <SettingsHeadline text="Extra Data" />
	<InputGroup>
	  <label htmlFor="showExtraWeatherColumn">Show third weather column?</label>
	  <select
	    id="showExtraWeatherColumn"
	    name="showExtraWeatherColumn"
	    onChange={(e) => inputChangeHandler(e, { isBool: true })}
	    value={formData.showExtraWeatherColumn ? 1 : 0}
	  >
	    <option value={1}>Yes</option>
	    <option value={0}>No</option>
	  </select>
	</InputGroup>

	<InputGroup>
	  <label htmlFor="extraWeatherTop">Top data</label>
	  <select
	    id="extraWeatherTop"
	    name="extraWeatherTop"
	    value={formData.extraWeatherTop}
	    onChange={(e) => inputChangeHandler(e)}
	  >
	    <option value="precip_mm">Precipitation (mm)</option>
	    <option value="precip_in">Precipitation (in)</option>
	    <option value="vis_km">Visibility (km)</option>
	    <option value="vis_miles">Visibility (miles)</option>
	    <option value="uv">UV Index</option>
	    <option value="gust_kph">Wind (kph)</option>
	    <option value="gust_mph">Wind (mph)</option>
	  </select>
	</InputGroup>

	<InputGroup>
	  <label htmlFor="extraWeatherBottom">Bottom data</label>
	  <select
	    id="extraWeatherBottom"
	    name="extraWeatherBottom"
	    value={formData.extraWeatherBottom}
	    onChange={(e) => inputChangeHandler(e)}
	  >
	    <option value="precip_mm">Precipitation (mm)</option>
	    <option value="precip_in">Precipitation (in)</option>
	    <option value="vis_km">Visibility (km)</option>
	    <option value="vis_miles">Visibility (miles)</option>
	    <option value="uv">UV Index</option>
	    <option value="gust_kph">Wind (kph)</option>
	    <option value="gust_mph">Wind (mph)</option>
	  </select>
	</InputGroup>

    {/* FORECAST SECTION */}
       <SettingsHeadline text="Forecast" />
       <InputGroup>
         <label htmlFor="forecastEnable">Enable weather forecast</label>
         <select
           id="forecastEnable"
           name="forecastEnable"
           value={formData.forecastEnable ? 1 : 0}
           onChange={(e) => inputChangeHandler(e, { isBool: true })}
         >
           <option value={0}>Disabled</option>
           <option value={1}>Enabled</option>
         </select>
       </InputGroup>
       <InputGroup>
         <label htmlFor="forecastDays">Forecast days</label>
         <select
           id="forecastDays"
           name="forecastDays"
           value={formData.forecastDays}
           onChange={(e) => inputChangeHandler(e, { isNumber: true })}
         >
           {[3, 4, 5, 6, 7, 8, 9, 10].map(day => (
             <option key={day} value={day}>{day}</option>
           ))}
         </select>
	 <span>
           ** The free Weather API tier only supports 3 days
         </span>
       </InputGroup>

       <InputGroup>
         <label htmlFor="forecastCache">On click display forecast data from</label>
         <select
           id="forecastCache"
           name="forecastCache"
           value={formData.forecastCache ? 1 : 0}
           onChange={(e) => inputChangeHandler(e, { isBool: true })}
         >
           <option value={0}>up to date</option>
           <option value={1}>cached data</option>
         </select>
       </InputGroup>

      <Button>Save changes</Button>
    </form>
  );
};
