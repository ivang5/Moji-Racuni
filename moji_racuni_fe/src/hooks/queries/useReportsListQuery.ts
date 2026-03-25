import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import type { ReportListItemView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type ReportsListParams = {
  dateFrom: string;
  dateTo: string;
  id: string;
  receipt: string;
  user: string;
  request: string;
  orderBy: string;
  ascendingOrder: "asc" | "desc";
  pageNum: number;
};

type ReportsListResponse = {
  pageCount: number;
  reports: ReportListItemView[];
};

const useReportsListQuery = (params: ReportsListParams) => {
  const api = useApi();

  return useQuery<ReportsListResponse>({
    queryKey: reportKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.filterReports(
        params.dateFrom,
        params.dateTo,
        params.id,
        params.receipt,
        params.user,
        params.request,
        params.orderBy,
        params.ascendingOrder,
        params.pageNum,
      );

      if (response === 404) {
        throw new ApiError("Reports were not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Reports request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load reports.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ReportsListResponse;
    },
  });
};

export default useReportsListQuery;
