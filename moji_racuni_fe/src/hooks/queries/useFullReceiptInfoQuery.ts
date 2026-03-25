import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys } from "../../services/queryKeys";
import type { ReceiptInfoView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

const useFullReceiptInfoQuery = (id: number | null | undefined) => {
  const api = useApi();

  return useQuery<ReceiptInfoView>({
    queryKey: receiptKeys.detail(id ?? -1),
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (typeof id !== "number" || id <= 0) {
        throw new ApiError("Invalid receipt id.", {
          code: "BAD_REQUEST",
          status: 400,
        });
      }

      const response = await api.getFullReceiptInfo(id);

      if (response === 404) {
        throw new ApiError("Receipt not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load receipt details.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ReceiptInfoView;
    },
  });
};

export default useFullReceiptInfoQuery;
