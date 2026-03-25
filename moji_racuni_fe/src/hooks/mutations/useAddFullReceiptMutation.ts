import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys, reportKeys, statsKeys } from "../../services/queryKeys";
import useApi from "../../utils/useApi";

const useAddFullReceiptMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptLink: string) => {
      const response = await api.addFullReceipt(receiptLink);

      if (response === 409) {
        throw new ApiError("Receipt already exists.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (response === null) {
        throw new ApiError("Failed to add receipt.", {
          code: "UNKNOWN_ERROR",
          status: 500,
        });
      }

      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
        queryClient.invalidateQueries({ queryKey: receiptKeys.lastFull() }),
        queryClient.invalidateQueries({ queryKey: receiptKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: reportKeys.last() }),
      ]);
    },
  });
};

export default useAddFullReceiptMutation;
