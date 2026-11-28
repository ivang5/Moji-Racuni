import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    // Greške (404, 409, 400 sa porukama po poljima) baca api.updateUser kao ApiError
    mutationFn: async ({ id, userInfo }: UpdateUserPayload) =>
      await api.updateUser(id, userInfo),
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
