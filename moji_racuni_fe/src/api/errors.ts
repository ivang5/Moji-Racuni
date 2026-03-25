export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;
  readonly details: unknown;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      status?: number | null;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.details = options.details ?? null;
  }
}

const getCodeByStatus = (status: number): ApiErrorCode => {
  if (status === 400) {
    return "BAD_REQUEST";
  }

  if (status === 401) {
    return "UNAUTHORIZED";
  }

  if (status === 403) {
    return "FORBIDDEN";
  }

  if (status === 404) {
    return "NOT_FOUND";
  }

  if (status === 409) {
    return "CONFLICT";
  }

  if (status >= 500) {
    return "SERVER_ERROR";
  }

  return "UNKNOWN_ERROR";
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof (payload as { detail: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
};

export const toApiError = (
  status: number,
  payload: unknown,
  fallback = "Request failed.",
): ApiError => {
  return new ApiError(getErrorMessage(payload, fallback), {
    code: getCodeByStatus(status),
    status,
    details: payload,
  });
};

export const toNetworkError = (
  message = "Network request failed.",
): ApiError => {
  return new ApiError(message, {
    code: "NETWORK_ERROR",
    status: null,
  });
};
