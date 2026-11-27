/** Backend base URL without a trailing slash, e.g. `http://192.168.1.10:8000`. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
