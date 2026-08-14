import { useEffect, useState } from 'preact/hooks';

const IST = 'Asia/Kolkata';

/** The clock is real, in IST. */
export function useClock() {
  const read = () => new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: IST,
  });
  const [time, setTime] = useState(read);
  useEffect(() => {
    const id = setInterval(() => setTime(read()), 10000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * The listener count is not.
 *
 * There is no server behind this page, so it cannot measure anything. It
 * breathes with the hour the way a real room would — busy in the evening,
 * quiet at 4am — and the README says so plainly rather than passing it off
 * as a measurement.
 */
export function useListeners() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let value = 0;
    const drift = () => {
      const hour = Number(new Date().toLocaleString('en-IN', {
        hour: '2-digit', hour12: false, timeZone: IST,
      }));
      const curve = 0.35 + 0.65 * Math.pow(Math.sin(Math.max(0, (hour - 5) / 19) * Math.PI), 1.5);
      const target = Math.round(180 + 900 * curve);
      value = value
        ? value + Math.round((target - value) * 0.25 + (Math.random() * 12 - 6))
        : target;
      setN(value);
    };
    drift();
    const id = setInterval(drift, 5000);
    return () => clearInterval(id);
  }, []);
  return n;
}

/** Turns the line card over every nine seconds, fading through the swap. */
export function useRotatingLine(lines) {
  const [i, setI] = useState(0);
  const [turning, setTurning] = useState(false);

  useEffect(() => {
    if (lines.length < 2) return undefined;
    const id = setInterval(() => {
      setTurning(true);
      setTimeout(() => {
        setI((n) => (n + 1) % lines.length);
        setTurning(false);
      }, 450);
    }, 9000);
    return () => clearInterval(id);
  }, [lines.length]);

  return { line: lines[i] || null, turning };
}
