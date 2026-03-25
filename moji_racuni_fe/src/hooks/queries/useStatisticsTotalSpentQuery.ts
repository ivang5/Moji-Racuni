import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { statsKeys } from "../../services/queryKeys";
import type { ReceiptsInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type DateRangeParams = {
  dateFrom: string;
  dateTo: string;
};

const useStatisticsTotalSpentQuery = ({
  dateFrom,
  dateTo,
}: DateRangeParams) => {
  const api = useApi();

  return useQuery<ReceiptsInfoView>({
    queryKey: statsKeys.totalSpent({ dateFrom, dateTo }),
    queryFn: async () => {
      const response = await api.getTotalSpent(dateFrom, dateTo);

      if (response === 404) {
        return {};
      }

      if (response === 409) {
        throw new ApiError("Total spent request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load total spent.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ReceiptsInfoView;
    },
  });
};

export default useStatisticsTotalSpentQuery;
