import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useSetReportSeenMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.setReportSeen(id);

      if (response === 404) {
        throw new ApiError("Report not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Set seen conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to set report as seen.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: (updatedReport, id) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportKeys.last() });
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      if (updatedReport?.id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.detail(updatedReport.id),
        });
      }
    },
  });
};

export default useSetReportSeenMutation;
