import {
  DockerSettingsForm,
  UISettingsForm,
  GeneralForm,
  ThemeSettingsForm,
  WeatherForm,
} from '../../interfaces';

export const uiSettingsTemplate: UISettingsForm = {
  customTitle: document.title,
  hideHeader: false,
  hideApps: false,
  hideCategories: false,
  useAmericanDate: false,
  greetingsSchema: 'Good evening!;Good afternoon!;Good morning!;Good night!',
  daySchema: 'Sunday;Monday;Tuesday;Wednesday;Thursday;Friday;Saturday',
  monthSchema:
    'January;February;March;April;May;June;July;August;September;October;November;December',
  showTime: false,
  hideDate: false,
  hideSearch: false,
  disableAutofocus: false,
};

export const weatherSettingsTemplate: WeatherForm = {
  WEATHER_API_KEY: '',
  lat: 0,
  long: 0,
  isCelsius: true,
  weatherData: 'humidity',
  weatherMode: 'geoip',
  weatherWidgetIcon: 65, 
  showExtraWeatherColumn: false,
  extraWeatherTop: 'uv',
  extraWeatherBottom: 'gust_mph',
  forecastEnable: false,
  forecastDays: 3,
  forecastCache: false,
};

export const generalSettingsTemplate: GeneralForm = {
  searchSameTab: false,
  defaultSearchProvider: 'l',
  secondarySearchProvider: 'd',
  pinAppsByDefault: true,
  pinCategoriesByDefault: true,
  useOrdering: 'createdAt',
  appsSameTab: false,
  bookmarksSameTab: false,
};

export const dockerSettingsTemplate: DockerSettingsForm = {
  dockerApps: true,
  dockerHost: 'localhost',
  kubernetesApps: true,
  unpinStoppedApps: true,
};

export const themeSettingsTemplate: ThemeSettingsForm = {
  defaultTheme: 'tron',
};
