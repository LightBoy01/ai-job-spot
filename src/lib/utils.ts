// Type guard to check if an error object has a 'message' property
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * smoothly scrolls the window to the top over a specified duration.
 * @param duration - Duration of the scroll animation in milliseconds (default: 1000ms)
 */
export function smoothScrollToTop(duration: number = 1000) {
  const startPosition = window.scrollY;
  const startTime = performance.now();

  function easeInOutQuad(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  function animation(currentTime: number) {
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, -startPosition, duration);
    
    window.scrollTo(0, run);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      window.scrollTo(0, 0); // Ensure we hit exactly 0 at the end
    }
  }

  requestAnimationFrame(animation);
}
