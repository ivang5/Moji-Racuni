import { ApiError } from "../api/errors";

export const isNotFoundResponse = (value: unknown): value is 404 =>
  value === 404;

export const ensureNoConflict = (value: unknown, message: string): void => {
  if (value === 409) {
    throw new ApiError(message, {
      code: "CONFLICT",
      status: 409,
    });
  }
};

export const ensurePresent = (value: unknown, message: string): void => {
  if (value === null || value === undefined) {
    throw new ApiError(message, {
      code: "UNKNOWN_ERROR",
    });
  }
};

export const parseObjectOrThrow = <T extends object>(
  value: unknown,
  message: string,
): T => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as T;
  }

  throw new ApiError(message, {
    code: "UNKNOWN_ERROR",
  });
};

export const parseNumberFieldOrThrow = (
  value: unknown,
  field: string,
  message: string,
): number => {
  const parsed = parseObjectOrThrow<Record<string, unknown>>(value, message);
  const numberValue = Number(parsed[field]);

  if (Number.isNaN(numberValue)) {
    throw new ApiError(message, {
      code: "UNKNOWN_ERROR",
    });
  }

  return numberValue;
};

export const parseArrayLengthOrThrow = (
  value: unknown,
  message: string,
): number => {
  if (Array.isArray(value)) {
    return value.length;
  }

  throw new ApiError(message, {
    code: "UNKNOWN_ERROR",
  });
};
