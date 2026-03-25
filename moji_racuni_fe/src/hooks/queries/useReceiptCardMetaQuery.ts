import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys } from "../../services/queryKeys";
import type { CompanyUnit } from "../../types/models";
import useApi from "../../utils/useApi";

type ReceiptCardMeta = {
  companyUnit: CompanyUnit | null;
  itemsCount: number;
};

const useReceiptCardMetaQuery = (companyUnitId: number, receiptId: number) => {
  const api = useApi();

  return useQuery<ReceiptCardMeta>({
    queryKey: [...receiptKeys.detail(receiptId), "card-meta", companyUnitId],
    enabled: companyUnitId > 0 && receiptId > 0,
    queryFn: async () => {
      const [unit, items] = await Promise.all([
        api.getUnit(companyUnitId),
        api.getItems(receiptId),
      ]);

      if (unit === 409 || items === 409) {
        throw new ApiError("Receipt card meta request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      return {
        companyUnit:
          unit && unit !== 404 && typeof unit === "object"
            ? (unit as CompanyUnit)
            : null,
        itemsCount: Array.isArray(items) ? items.length : 0,
      };
    },
  });
};

export default useReceiptCardMetaQuery;
