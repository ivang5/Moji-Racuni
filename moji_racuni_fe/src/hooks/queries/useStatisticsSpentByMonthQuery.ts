import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { ChartBarPoint } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsSpentByMonthQuery = ({
  dateFrom,
  dateTo,
}: DateRangeParams) => {
  const api = useApi();

  return useQuery<ChartBarPoint[]>({
    queryKey: statsKeys.spentByMonth({ dateFrom, dateTo }),
    queryFn: async () => {
      const response = await api.getSpentByMonth(dateFrom, dateTo);

      if (response === 404) {
        return [];
      }

      if (response === 409) {
        throw new ApiError("Spent-by-month request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!Array.isArray(response)) {
        throw new ApiError("Unable to load spent-by-month data.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ChartBarPoint[];
    },
  });
};

export default useStatisticsSpentByMonthQuery;
