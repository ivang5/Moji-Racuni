import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { BaseStatsView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsBaseStatsQuery = ({ dateFrom, dateTo }: DateRangeParams) => {
  const api = useApi();

  return useQuery<BaseStatsView>({
    queryKey: statsKeys.base({ dateFrom, dateTo, limit: 1 }),
    queryFn: async () => {
      const response = await api.getBaseStats(dateFrom, dateTo, 1);

      if (!response) {
        throw new ApiError("Unable to load statistics.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as BaseStatsView;
    },
  });
};

export default useStatisticsBaseStatsQuery;
