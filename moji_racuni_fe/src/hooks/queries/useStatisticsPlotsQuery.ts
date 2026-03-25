import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { StatPlotsView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsPlotsQuery = ({ dateFrom, dateTo }: DateRangeParams) => {
  const api = useApi();

  return useQuery<StatPlotsView>({
    queryKey: statsKeys.plots({ dateFrom, dateTo, limit: 10 }),
    queryFn: async () => {
      const response = await api.getStatPlots(dateFrom, dateTo, 10);

      if (response === 404) {
        return {};
      }

      if (response === 409) {
        throw new ApiError("Stat-plots request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load stat plots.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as StatPlotsView;
    },
  });
};

export default useStatisticsPlotsQuery;
