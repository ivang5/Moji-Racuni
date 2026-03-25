import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { receiptKeys } from "../../services/queryKeys";
import type { CompanyUnit } from "../../types/models";
import {
  ensureNoConflict,
  ensurePresent,
  isNotFoundResponse,
  parseArrayLengthOrThrow,
  parseObjectOrThrow,
} from "../../utils/queryResponse";
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

      ensureNoConflict(unit, "Receipt card meta request conflict.");
      ensureNoConflict(items, "Receipt card meta request conflict.");
      ensurePresent(unit, "Unable to load receipt card metadata.");
      ensurePresent(items, "Unable to load receipt card metadata.");

      const companyUnit = isNotFoundResponse(unit)
        ? null
        : parseObjectOrThrow<CompanyUnit>(
            unit,
            "Unable to parse receipt unit metadata.",
          );

      const itemsCount = isNotFoundResponse(items)
        ? 0
        : parseArrayLengthOrThrow(
            items,
            "Unable to parse receipt items metadata.",
          );

      return {
        companyUnit,
        itemsCount,
      };
    },
  });
};

export default useReceiptCardMetaQuery;
