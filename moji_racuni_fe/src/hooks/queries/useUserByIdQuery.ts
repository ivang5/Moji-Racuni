import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { userKeys } from "../../services/queryKeys";
import type { User } from "../../types/models";
import useApi from "../../utils/useApi";

export type UserDetails = User & {
  first_name?: string;
  last_name?: string;
};

const useUserByIdQuery = (id: number | null | undefined) => {
  const api = useApi();

  return useQuery<UserDetails>({
    queryKey: userKeys.detail(id ?? -1),
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (typeof id !== "number" || id <= 0) {
        throw new ApiError("Invalid user id.", {
          code: "BAD_REQUEST",
          status: 400,
        });
      }

      const response = await api.getUser(id);

      if (response === 404) {
        throw new ApiError("User not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("User request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load user.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as UserDetails;
    },
  });
};

export default useUserByIdQuery;
