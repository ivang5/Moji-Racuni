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
    mutationFn: async ({ tin, image }) => {
      const response = await api.changeCompanyImage(tin, image);

      if (response === 404) {
        throw new ApiError("Company not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company image change conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to change company image.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(payload.tin),
      });
    },
  });
};

export default useChangeCompanyImageMutation;
