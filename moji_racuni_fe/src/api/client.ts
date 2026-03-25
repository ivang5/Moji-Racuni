import { toApiError, toNetworkError } from "./errors";

type RequestOptions = RequestInit & {
  parseAsText?: boolean;
};

const getBaseUrl = (): string => {
  return process.env.REACT_APP_BASE_URL || "";
};

const parseResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length ? text : null;
};

export const apiClient = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  try {
    const response = await fetch(`${getBaseUrl()}${path}`, options);
    const data = await parseResponse(response);

    if (!response.ok) {
      throw toApiError(response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "ApiError") {
      throw error;
    }

    throw toNetworkError();
  }
};
