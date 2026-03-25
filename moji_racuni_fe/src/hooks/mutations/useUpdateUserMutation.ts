import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { userKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

type UpdateUserPayload = {
  id: number;
  userInfo: {
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    is_active: boolean;
  };
};

const useUpdateUserMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userInfo }: UpdateUserPayload) => {
      const response = await api.updateUser(id, userInfo);

      if (response === 404) {
        throw new ApiError("User not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("User update conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to update user.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      if (updatedUser?.id) {
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(updatedUser.id),
        });
      }
    },
  });
};

export default useUpdateUserMutation;
