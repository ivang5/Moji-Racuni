import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useUpdateReportMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reportInfo,
    }: {
      id: number;
      reportInfo: unknown;
    }) => {
      const response = await api.updateReport(id, reportInfo);

      if (response === 404) {
        throw new ApiError("Report not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Report update conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to update report.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response;
    },
    onSuccess: (updatedReport, payload) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(payload.id),
      });
      if ((updatedReport as { id?: number })?.id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.detail((updatedReport as { id: number }).id),
        });
      }
    },
  });
};

export default useUpdateReportMutation;
