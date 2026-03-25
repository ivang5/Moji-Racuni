import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import type { ReportListItemView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useReportByIdQuery = (id: number | null | undefined) => {
  const api = useApi();

  return useQuery<ReportListItemView>({
    queryKey: reportKeys.detail(id ?? -1),
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (typeof id !== "number" || id <= 0) {
        throw new ApiError("Invalid report id.", {
          code: "BAD_REQUEST",
          status: 400,
        });
      }

      const response = await api.getReport(id);

      if (response === 404) {
        throw new ApiError("Report not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Report request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load report.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ReportListItemView;
    },
  });
};

export default useReportByIdQuery;
