import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import type { ReportInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type UpdateReportPayload = {
  id: number;
  reportInfo: {
    date: string;
    request: string;
    response: string;
    closed: boolean;
    seen: boolean;
    receipt: number;
    user: number;
  };
};

const useUpdateReportMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<ReportInfoView, ApiError, UpdateReportPayload>({
    mutationFn: async ({ id, reportInfo }) => {
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

      return response as ReportInfoView;
    },
    onSuccess: (updatedReport, payload) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(payload.id),
      });
      if (updatedReport.id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.detail(updatedReport.id),
        });
      }
    },
  });
};

export default useUpdateReportMutation;
