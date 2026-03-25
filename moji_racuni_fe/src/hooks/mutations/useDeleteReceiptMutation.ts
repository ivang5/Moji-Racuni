import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys, statsKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useDeleteReceiptMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.deleteReceipt(id);

      if (response === 404) {
        throw new ApiError("Receipt not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Receipt delete conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: receiptKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: receiptKeys.lastFull() });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
};

export default useDeleteReceiptMutation;
