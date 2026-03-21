import type { Company, CompanyUnit, Item, Receipt, User } from "./models";

export type TimeSpan = "month" | "year" | "all";

export type ReceiptItemView = Pick<
  Item,
  "id" | "name" | "measurementUnit" | "vatType" | "price" | "quantity"
>;

export type ReceiptSummaryView = Pick<
  Receipt,
  "id" | "date" | "totalPrice" | "totalVat" | "link"
>;

export type ReceiptListItemView = Pick<
  Receipt,
  "id" | "date" | "totalPrice" | "totalVat" | "companyUnit"
>;

export type ReceiptInfoView = {
  receipt: ReceiptSummaryView;
  company: {
    name: string;
    tin: string;
  };
  items: ReceiptItemView[];
};

export type ReportInfoView = {
  id: number;
  date: string;
  receipt: number;
  request: string;
  response?: string;
  closed: boolean;
  user: number;
};

export type ReportListItemView = ReportInfoView & {
  seen: boolean;
};

export type ReportUserView = Pick<User, "id" | "username">;

export type CompanyTypeView = {
  id: number;
  name: string;
  description: string;
};

export type CompanyUnitDetailView = Omit<CompanyUnit, "company"> & {
  company: string;
  place: string;
  municipality: string;
  category: string;
};

export type CompanyListItemView = Pick<Company, "tin" | "name" | "image">;

export type CompanyInfoView = {
  company: CompanyListItemView;
  type?: CompanyTypeView;
  units: CompanyUnitDetailView[];
  visits: {
    visits: number;
    spent: number;
  };
};

export type PercentageChanges = {
  totalSpent: number | null;
  unitCount: number | null;
  mostVisitedCompanyReceiptCount: number | null;
  mostVisitedCompanyPriceSum: number | null;
  mostValuableItemPrice: number | null;
};

export type StatSummary = {
  totalSpent: {
    totalSpent: number;
  };
  visitedCompaniesInfo: {
    unitCount: number;
  };
  MostVisitedCompaniesInfo: Array<{
    companyName: string;
    receiptCount: number;
    priceSum: number;
  }>;
  mostValuableItems?: Array<{
    name: string;
    price: number;
  }>;
};

export type ExtendedStats = Omit<StatSummary, "totalSpent"> & {
  totalSpent: StatSummary["totalSpent"] & {
    mostSpentReceipt?: number;
  };
};

export type StatsTotalSpentView = {
  totalSpent: number;
  totalSpentVat?: number;
  receiptsCount?: number;
  mostSpentReceipt?: number;
  avgSpentReceipt?: number;
};

export type BaseStatsView = {
  totalSpent?: StatsTotalSpentView;
  mostSpentInADay?: {
    mostSpent?: number;
  };
  MostVisitedCompaniesInfo?: Array<{
    companyName: string;
    receiptCount: number;
    priceSum: number;
  }>;
  visitedCompaniesInfo?: {
    companyCount: number;
    unitCount: number;
  };
  mostValuableItems?: Array<{
    name: string;
    price: number;
  }>;
  mostItems?: {
    mostItems: number;
    avgItems: number;
  };
};

export type ReceiptsInfoView = {
  totalSpent?: number;
  receiptsCount?: number;
};

export type StatPlotsView = {
  receipts?: string;
  spending?: string;
  companies?: string;
  types?: string;
  items?: string;
};

export type ChartBarPoint = {
  [key: string]: string | number;
};

export type ChartPiePoint = {
  id: string;
  value: number;
};
