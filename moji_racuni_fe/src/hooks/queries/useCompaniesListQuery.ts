import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import type { CompanyListItemView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type CompaniesListParams = {
  name: string;
  tin: string;
  type: string;
  orderBy: string;
  ascendingOrder: "asc" | "desc";
  pageNum: number;
};

type CompaniesListResponse = {
  pageCount: number;
  companies: CompanyListItemView[];
};

const useCompaniesListQuery = (params: CompaniesListParams) => {
  const api = useApi();

  return useQuery<CompaniesListResponse>({
    queryKey: companyKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.filterCompanies(
        params.name,
        params.tin,
        params.type,
        params.orderBy,
        params.ascendingOrder,
        params.pageNum,
      );

      if (response === 404) {
        throw new ApiError("Companies were not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Companies request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load companies.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as CompaniesListResponse;
    },
  });
};

export default useCompaniesListQuery;
