import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { userKeys } from "../../services/queryKeys";
import type { User } from "../../types/models";
import useApi from "../../utils/useApi";

type UsersListParams = {
  id: string;
  username: string;
  email: string;
  orderBy: string;
  ascendingOrder: "asc" | "desc";
  pageNum: number;
};

type UsersListResponse = {
  pageCount: number;
  users: User[];
};

const useUsersListQuery = (params: UsersListParams) => {
  const api = useApi();

  return useQuery<UsersListResponse>({
    queryKey: userKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.filterUsers(
        params.id,
        params.username,
        params.email,
        params.orderBy,
        params.ascendingOrder,
        params.pageNum,
      );

      if (response === 404) {
        throw new ApiError("Users were not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Users request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load users.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as UsersListResponse;
    },
  });
};

export default useUsersListQuery;
