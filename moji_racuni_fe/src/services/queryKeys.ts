export const receiptKeys = {
  all: ["receipts"] as const,
  lists: () => [...receiptKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...receiptKeys.lists(), params] as const,
  details: () => [...receiptKeys.all, "detail"] as const,
  detail: (id: number) => [...receiptKeys.details(), id] as const,
  lastFull: () => [...receiptKeys.all, "last-full"] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
  last: () => [...reportKeys.all, "last"] as const,
};

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...companyKeys.lists(), params] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (tin: string) => [...companyKeys.details(), tin] as const,
  types: () => [...companyKeys.all, "types"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const statsKeys = {
  all: ["stats"] as const,
  base: (params: Record<string, unknown>) =>
    [...statsKeys.all, "base", params] as const,
  plots: (params: Record<string, unknown>) =>
    [...statsKeys.all, "plots", params] as const,
  totalSpent: (params: Record<string, unknown>) =>
    [...statsKeys.all, "total-spent", params] as const,
  receiptsByHour: (params: Record<string, unknown>) =>
    [...statsKeys.all, "receipts-by-hour", params] as const,
  receiptsByWeekday: (params: Record<string, unknown>) =>
    [...statsKeys.all, "receipts-by-weekday", params] as const,
  receiptsByMonth: (params: Record<string, unknown>) =>
    [...statsKeys.all, "receipts-by-month", params] as const,
  spentByHour: (params: Record<string, unknown>) =>
    [...statsKeys.all, "spent-by-hour", params] as const,
  spentByWeekday: (params: Record<string, unknown>) =>
    [...statsKeys.all, "spent-by-weekday", params] as const,
  spentByMonth: (params: Record<string, unknown>) =>
    [...statsKeys.all, "spent-by-month", params] as const,
  mostSpentCompanies: (params: Record<string, unknown>) =>
    [...statsKeys.all, "most-spent-companies", params] as const,
  mostVisitedCompanies: (params: Record<string, unknown>) =>
    [...statsKeys.all, "most-visited-companies", params] as const,
  mostSpentTypes: (params: Record<string, unknown>) =>
    [...statsKeys.all, "most-spent-types", params] as const,
  mostVisitedTypes: (params: Record<string, unknown>) =>
    [...statsKeys.all, "most-visited-types", params] as const,
  mostValuableItems: (params: Record<string, unknown>) =>
    [...statsKeys.all, "most-valuable-items", params] as const,
};
