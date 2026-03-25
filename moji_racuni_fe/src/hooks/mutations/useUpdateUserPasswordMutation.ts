import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { userKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

type UpdateUserPasswordPayload = {
  id: number;
  passwordInfo: {
    password: string;
    passRepeat: string;
  };
};

const useUpdateUserPasswordMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, passwordInfo }: UpdateUserPasswordPayload) => {
      const response = await api.updateUserPassword(id, passwordInfo);

      if (response === 404) {
        throw new ApiError("User not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Password update conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to update password.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: (_updated, payload) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(payload.id),
      });
    },
  });
};

export default useUpdateUserPasswordMutation;
