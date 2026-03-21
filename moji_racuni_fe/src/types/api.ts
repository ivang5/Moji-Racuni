export type ApiErrorCode = 0 | 401 | 404 | 409;

export type ApiStatusResult<T> = T | ApiErrorCode | null;

export interface FilterPageResult<T> {
  items: T[];
  pageCount: number;
}
