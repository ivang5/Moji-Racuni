import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../../services/queryKeys";
import type { AuthTokens } from "../../types/models";
import useApi from "../../utils/useApi";

type UpdateUserPasswordPayload = {
  id: number;
  passwordInfo: {
    currentPassword: string;
    password: string;
    passRepeat: string;
  };
};

const useUpdateUserPasswordMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    // Uspešna promena vraća nov par tokena (BE poništava sve dotadašnje refresh tokene);
    // greške (400 sa porukama po poljima, 429) baca api.updateUserPassword kao ApiError
    mutationFn: async ({
      id,
      passwordInfo,
    }: UpdateUserPasswordPayload): Promise<AuthTokens> =>
      await api.updateUserPassword(id, passwordInfo),
    onSuccess: (_updated, payload) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(payload.id),
      });
    },
  });
};

export default useUpdateUserPasswordMutation;
