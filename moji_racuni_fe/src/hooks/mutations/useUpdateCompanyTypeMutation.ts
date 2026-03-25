import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

type UpdateCompanyTypePayload = {
  id: number;
  typeInfo: {
    name: string;
    description: string;
    user: number;
  };
};

const useUpdateCompanyTypeMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, typeInfo }: UpdateCompanyTypePayload) => {
      const response = await api.changeType(id, typeInfo);

      if (response === 404) {
        throw new ApiError("Company type not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company type update conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to update company type.", {
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

export default useUpdateCompanyTypeMutation;
