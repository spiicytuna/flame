import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Skycons } from 'skycons-ts';
import { State } from '../../../../store/reducers';
import { IconMapping, TimeOfDay } from './IconMapping';

interface Props {
  weatherStatusCode: number;
  isDay: number;
  className?: string;
  size?: number;
}

export const WeatherIcon = ({ weatherStatusCode, isDay, className, size = 50 }: Props): JSX.Element => {
  const { activeTheme } = useSelector((state: State) => state.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mapping = new IconMapping();
  const skycon = isDay
    ? mapping.mapIcon(weatherStatusCode, TimeOfDay.day)
    : mapping.mapIcon(weatherStatusCode, TimeOfDay.night);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // HiDPI disp
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(size * dpr);     // intrinsic pixels
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;          // CSS pixels
    canvas.style.height = `${size}px`;

    const sky = new Skycons({ color: activeTheme.colors.accent });
    try {
      sky.add(canvas, skycon);
      sky.play();
    } catch {
      // skip gracefully
    }

    // cleanup
    return () => {
      try { sky.remove(canvas); } catch { /* ignore */ }
    };
  }, [weatherStatusCode, skycon, activeTheme.colors.accent, isDay, size]);

  // css handle => look+fee;
  return <canvas ref={canvasRef} className={className ?? ''} />;
};
