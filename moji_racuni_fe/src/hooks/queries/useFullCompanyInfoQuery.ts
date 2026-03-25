import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import type { CompanyInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useFullCompanyInfoQuery = (tin: string | null | undefined) => {
  const api = useApi();

  return useQuery<CompanyInfoView>({
    queryKey: companyKeys.detail(tin || ""),
    enabled: Boolean(tin),
    queryFn: async () => {
      if (!tin) {
        throw new ApiError("Invalid company id.", {
          code: "BAD_REQUEST",
          status: 400,
        });
      }

      const response = await api.getFullCompanyInfo(tin);

      if (response === 404) {
        throw new ApiError("Company not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load company details.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as CompanyInfoView;
    },
  });
};

export default useFullCompanyInfoQuery;
