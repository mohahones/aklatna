import { useEffect, useState } from "react";

function readSessionValue(key, initialValue) {
  if (typeof window === "undefined") {
    return typeof initialValue === "function" ? initialValue() : initialValue;
  }

  try {
    const storedValue = window.sessionStorage.getItem(key);
    if (storedValue === null) {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }

    return JSON.parse(storedValue);
  } catch {
    return typeof initialValue === "function" ? initialValue() : initialValue;
  }
}

export function useSessionStorageState(key, initialValue) {
  const [value, setValue] = useState(() => readSessionValue(key, initialValue));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [key, value]);

  function clearValue() {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }

  return [value, setValue, clearValue];
}
