import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { ExtendedStats, TimeSpan } from "../../types/viewModels";
import {
  getAllTime,
  getLastMonth,
  getLastYear,
  getThisMonth,
  getThisYear,
} from "../../utils/utils";
import useApi from "../../utils/useApi";

type HomeStatsQueryMode = "current" | "previous";

const getDateRange = (
  timeSpan: TimeSpan,
  mode: HomeStatsQueryMode,
): { dateFrom: string; dateTo: string } => {
  if (mode === "previous") {
    return timeSpan === "month" ? getLastMonth() : getLastYear();
  }

  if (timeSpan === "month") {
    return getThisMonth();
  }

  if (timeSpan === "year") {
    return getThisYear();
  }

  return getAllTime();
};

const useHomeBaseStatsQuery = (
  timeSpan: TimeSpan,
  mode: HomeStatsQueryMode,
) => {
  const api = useApi();
  const shouldFetch = mode === "current" || timeSpan !== "all";

  return useQuery<ExtendedStats>({
    queryKey: statsKeys.base({ timeSpan, mode }),
    enabled: shouldFetch,
    queryFn: async () => {
      const range = getDateRange(timeSpan, mode);
      const response = await api.getBaseStats(range.dateFrom, range.dateTo, 1);

      if (!response) {
        throw new ApiError("Failed to fetch stats.", {
          code: "UNKNOWN_ERROR",
          status: 500,
        });
      }

      return response as ExtendedStats;
    },
  });
};

export default useHomeBaseStatsQuery;
