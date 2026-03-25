import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useChangeCompanyTypeMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tin,
      typeInfo,
    }: {
      tin: string;
      typeInfo: { type: number | "none" };
    }) => {
      const response = await api.changeCompanyType(tin, typeInfo);

      if (response === 404) {
        throw new ApiError("Company not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company type change conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to change company type.", {
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
      queryClient.invalidateQueries({ queryKey: companyKeys.types() });
    },
  });
};

export default useChangeCompanyTypeMutation;
