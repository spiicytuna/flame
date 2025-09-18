import { useEffect, useRef } from 'react';
import { ForecastDay } from '../../../interfaces';
import { Spinner, WeatherIcon, Icon } from '../../UI';
import classes from './ForecastModal.module.css';

interface Props {
  data: ForecastDay[] | null;
  isLoading: boolean;
  onClose: () => void;
  isCelsius: boolean;
}

export const ForecastModal = ({ data, isLoading, onClose, isCelsius }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // click2close
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // lost focus close
    const handleBlur = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onClose]);

  // look+feel
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modalContent} ref={modalRef}>
        {/* CLOSE BUTTON */}
        <div className={classes.closeButton} onClick={onClose}>
          <Icon icon="mdiClose" />
        </div>

        <h3>Weather Forecast</h3>
        {isLoading && <Spinner />}
        {!isLoading && data && (
          <div className={classes.forecastGrid}>
            {data.map((day) => (
              <div key={day.date} className={classes.forecastDay}>
                {/* DEBUG: <pre style={{ color: '#999', margin: 0 }}>{JSON.stringify(day, null, 2)}</pre> */}
                <span className={classes.date}>{formatDate(day.date)}</span>
                <div className={classes.weatherInfo}>
                  <WeatherIcon
                    weatherStatusCode={day.conditionCode}
                    isDay={1}
                    className={classes.weatherIcon}
                    size={40}
                  />
                  <span className={classes.temp}>
                    {isCelsius ? (
                      <>
                        <span style={{ color: 'var(--color-accent)' }}>{Math.round(day.tempC)}°C</span>
                        <span> / {Math.round(day.tempF)}°F</span>
                      </>
                    ) : (
                      <>
                        <span>{Math.round(day.tempC)}°C / </span>
                        <span style={{ color: 'var(--color-accent)' }}>{Math.round(day.tempF)}°F</span>
                      </>
                    )}
                  </span>
                </div>
                <span className={classes.condition}>{day.conditionText}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
