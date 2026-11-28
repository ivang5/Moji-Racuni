import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

type ChangeCompanyImagePayload = {
  tin: string;
  image: File;
};

const useChangeCompanyImageMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, ChangeCompanyImagePayload>({
    // Greške (npr. 400 za nedozvoljen format ili veličinu slike) baca api.changeCompanyImage
    mutationFn: async ({ tin, image }) =>
      await api.changeCompanyImage(tin, image),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(payload.tin),
      });
    },
  });
};

export default useChangeCompanyImageMutation;
