import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/errors";
import { companyKeys } from "../../services/queryKeys";
import type { CompanyTypeView } from "../../types/viewModels";
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

      if (type === 409 || visits === 409) {
        throw new ApiError("Company card meta request conflict.", {
          code: "CONFLICT",
          status: 409,
        });
      }

      return {
        companyType: type && type !== 404 ? (type as CompanyTypeView) : null,
        companyVisits:
          visits &&
          visits !== 404 &&
          typeof visits === "object" &&
          "visits" in visits
            ? Number((visits as { visits: number }).visits)
            : 0,
      };
    },
  });
};

export default useCompanyCardMetaQuery;
