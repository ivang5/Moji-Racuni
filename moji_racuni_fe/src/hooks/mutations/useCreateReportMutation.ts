import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useCreateReportMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: {
      date: string;
      receipt: number;
      request: string;
    }) => {
      const response = await api.createReport(report);

      if (response === 404) {
        throw new ApiError("Report target not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Report creation conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to create report.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
};

export default useCreateReportMutation;
