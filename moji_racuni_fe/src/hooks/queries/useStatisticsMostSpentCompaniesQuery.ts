import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { StatsAggregationPoint } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsMostSpentCompaniesQuery = ({
  dateFrom,
  dateTo,
}: DateRangeParams) => {
  const api = useApi();

  return useQuery<StatsAggregationPoint[]>({
    queryKey: statsKeys.mostSpentCompanies({ dateFrom, dateTo, limit: 10 }),
    queryFn: async () => {
      const response = await api.getMostSpentCompaniesInfo(
        dateFrom,
        dateTo,
        10,
      );

      if (response === 404) {
        return [];
      }

      if (response === 409) {
        throw new ApiError("Most-spent-companies request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!Array.isArray(response)) {
        throw new ApiError("Unable to load most-spent-companies data.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as StatsAggregationPoint[];
    },
  });
};

export default useStatisticsMostSpentCompaniesQuery;
