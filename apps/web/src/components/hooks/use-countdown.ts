import * as React from "react";

export const useCountdown = () => {
  const [timer, setTimer] = React.useState<number | null>(null);

  const start = (seconds: number) => {
    setTimer(Date.now() + seconds * 1000);
  };

  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);

  React.useEffect(() => {
    const countdown = () => {
      if (!timer) {
        setRetryAfter(null);
        return;
      }

      const left = Math.ceil((timer - Date.now()) / 1000);
      setRetryAfter(left > 0 ? left : null);
    };

    const interval = setInterval(countdown, 1000);
    countdown();

    return () => clearInterval(interval);
  }, [timer]);

  return [retryAfter, start] as const;
};
