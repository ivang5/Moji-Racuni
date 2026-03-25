import { useQuery } from "@tanstack/react-query";
import { companyKeys } from "../../services/queryKeys";
import type { CompanyTypeView } from "../../types/viewModels";
import {
  ensureNoConflict,
  ensurePresent,
  isNotFoundResponse,
  parseNumberFieldOrThrow,
  parseObjectOrThrow,
} from "../../utils/queryResponse";
import useApi from "../../utils/useApi";

type CompanyCardMeta = {
  companyType: CompanyTypeView | null;
  companyVisits: number;
};

const useCompanyCardMetaQuery = (tin: string) => {
  const api = useApi();

  return useQuery<CompanyCardMeta>({
    queryKey: [...companyKeys.detail(tin), "card-meta"],
    enabled: Boolean(tin),
    queryFn: async () => {
      const [type, visits] = await Promise.all([
        api.getTypeForCompany(tin),
        api.getCompanyVisits(tin),
      ]);

      ensureNoConflict(type, "Company card meta request conflict.");
      ensureNoConflict(visits, "Company card meta request conflict.");
      ensurePresent(type, "Unable to load company card metadata.");
      ensurePresent(visits, "Unable to load company card metadata.");

      const companyType = isNotFoundResponse(type)
        ? null
        : parseObjectOrThrow<CompanyTypeView>(
            type,
            "Unable to parse company type metadata.",
          );

      const companyVisits = isNotFoundResponse(visits)
        ? 0
        : parseNumberFieldOrThrow(
            visits,
            "visits",
            "Unable to parse company visits metadata.",
          );

      return {
        companyType,
        companyVisits,
      };
    },
  });
};

export default useCompanyCardMetaQuery;
