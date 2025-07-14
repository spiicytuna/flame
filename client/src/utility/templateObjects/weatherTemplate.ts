import { Weather } from '../../interfaces';

export const weatherTemplate: Weather = {
  externalLastUpdate: '',
  tempC: 0,
  tempF: 0,
  isDay: 1,
  cloud: 0,
  conditionText: '',
  conditionCode: 1000,
  id: -1,
  createdAt: new Date(),
  updatedAt: new Date(),
  humidity: 0,
  windK: 0,
  windM: 0,
  location: '',
  precip_mm: 0,
  precip_in: 0,
  vis_km: 0,
  vis_miles: 0,
  uv: 0,
  gust_kph: 0,
  gust_mph: 0
};
