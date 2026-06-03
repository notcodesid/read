export function devLog(...args: unknown[]) {
  if (__DEV__) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (__DEV__) {
    console.warn(...args);
  }
}