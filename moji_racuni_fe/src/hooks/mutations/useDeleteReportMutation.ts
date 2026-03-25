import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { reportKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useDeleteReportMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.deleteReport(id);

      if (response === 404) {
        throw new ApiError("Report not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Report delete conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportKeys.last() });
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
    },
  });
};

export default useDeleteReportMutation;
