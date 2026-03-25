import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import type { CompanyTypeView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useCompanyTypesQuery = () => {
  const api = useApi();

  return useQuery<CompanyTypeView[]>({
    queryKey: companyKeys.types(),
    queryFn: async () => {
      const response = await api.getCompanyTypes();

      if (Array.isArray(response)) {
        return response;
      }

      if (response === 404) {
        throw new ApiError("Company types not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Company types request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      throw new ApiError("Unable to load company types.", {
        code: "UNKNOWN_ERROR",
      });
    },
  });
};

export default useCompanyTypesQuery;
