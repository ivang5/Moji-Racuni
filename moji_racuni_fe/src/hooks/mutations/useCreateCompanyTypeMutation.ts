import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useCreateCompanyTypeMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeInfo: {
      name: string;
      description: string;
      user: number;
    }) => {
      const response = await api.createCompanyType(typeInfo);

      if (response === 404) {
        throw new ApiError("Company type target not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company type already exists.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to create company type.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.types() });
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
};

export default useCreateCompanyTypeMutation;
