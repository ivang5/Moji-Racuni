import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys } from "../../services/queryKeys";
import type { ReceiptListItemView } from "../../types/viewModels";
import useApi from "../../utils/useApi";

type ReceiptsListParams = {
  dateFrom: string;
  dateTo: string;
  id: string;
  unit: string;
  tin: string;
  priceFrom: number;
  priceTo: number;
  orderBy: string;
  ascendingOrder: "asc" | "desc";
  pageNum: number;
};

type ReceiptsListResponse = {
  pageCount: number;
  receipts: ReceiptListItemView[];
};

const useReceiptsListQuery = (params: ReceiptsListParams) => {
  const api = useApi();

  return useQuery<ReceiptsListResponse>({
    queryKey: receiptKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.filterReceipts(
        params.dateFrom,
        params.dateTo,
        params.id,
        params.unit,
        params.tin,
        params.priceFrom,
        params.priceTo,
        params.orderBy,
        params.ascendingOrder,
        params.pageNum,
      );

      if (response === 404) {
        throw new ApiError("Receipts were not found.", {
          code: "NOT_FOUND",
          status: 404,
        });
      }

      if (response === 409) {
        throw new ApiError("Receipts request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      if (!response) {
        throw new ApiError("Unable to load receipts.", {
          code: "UNKNOWN_ERROR",
        });
      }

      return response as ReceiptsListResponse;
    },
  });
};

export default useReceiptsListQuery;
