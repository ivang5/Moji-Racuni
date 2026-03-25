import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import type { ReportInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useLastReportQuery = (enabled: boolean) => {
  const api = useApi();

  return useQuery<ReportInfoView | null>({
    queryKey: reportKeys.last(),
    enabled,
    queryFn: async () => {
      const response = await api.getLastReport();

      if (response === 404) {
        return null;
      }

      if (response === 409) {
        throw new ApiError("Last report request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        return null;
      }

      return response as ReportInfoView;
    },
  });
};

export default useLastReportQuery;
