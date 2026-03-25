import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useDeleteCompanyTypeMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.deleteCompanyType(id);

      if (response === 404) {
        throw new ApiError("Company type not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company type delete conflict.", {
          code: "CONFLICT",
          status: 409,
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

export default useDeleteCompanyTypeMutation;
