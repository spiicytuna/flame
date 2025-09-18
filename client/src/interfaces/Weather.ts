import { Model } from '.';

export interface Weather extends Model {
  externalLastUpdate: string;
  tempC: number;
  tempF: number;
  isDay: number;
  cloud: number;
  conditionText: string;
  conditionCode: number;
  humidity: number;
  windK: number;
  windM: number;
  location: string;
  precip_mm: number;
  precip_in: number;
  vis_km: number;
  vis_miles: number;
  uv: number;
  gust_kph: number;
  gust_mph: number;
}

export interface ForecastDay {
  date: string;
  tempC: number;
  tempF: number;
  conditionText: string;
  conditionCode: number;
  iconUrl?: string;
}
