export const receiptKeys = {
  all: ["receipts"] as const,
  lists: () => [...receiptKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...receiptKeys.lists(), params] as const,
  details: () => [...receiptKeys.all, "detail"] as const,
  detail: (id: number) => [...receiptKeys.details(), id] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
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
};
