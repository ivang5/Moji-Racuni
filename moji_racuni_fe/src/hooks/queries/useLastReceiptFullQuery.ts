import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys } from "../../services/queryKeys";
import type { ReceiptInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useLastReceiptFullQuery = (enabled: boolean) => {
  const api = useApi();

  return useQuery<ReceiptInfoView | null>({
    queryKey: receiptKeys.lastFull(),
    enabled,
    queryFn: async () => {
      const response = await api.getLastReceiptFull();

      if (response === 404) {
        return null;
      }

      if (response === 409) {
        throw new ApiError("Last receipt request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        return null;
      }

      return response as ReceiptInfoView;
    },
  });
};

export default useLastReceiptFullQuery;
