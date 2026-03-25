import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { StatsAggregationPoint } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsMostVisitedTypesQuery = ({
  dateFrom,
  dateTo,
}: DateRangeParams) => {
  const api = useApi();

  return useQuery<StatsAggregationPoint[]>({
    queryKey: statsKeys.mostVisitedTypes({ dateFrom, dateTo, limit: 10 }),
    queryFn: async () => {
      const response = await api.getMostVisitedTypesInfo(dateFrom, dateTo, 10);

      if (response === 404) {
        return [];
      }

      if (response === 409) {
        throw new ApiError("Most-visited-types request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!Array.isArray(response)) {
        throw new ApiError("Unable to load most-visited-types data.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as StatsAggregationPoint[];
    },
  });
};

export default useStatisticsMostVisitedTypesQuery;
