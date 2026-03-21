import { pdf } from "@react-pdf/renderer";
import Review from "./Review";
import type {
  BaseStatsView,
  ChartPiePoint,
  StatPlotsView,
} from "../types/viewModels";

type RenderPdfParams = {
  statPlots: StatPlotsView;
  baseStats: BaseStatsView;
  fromDate: Date | string;
  toDate: Date | string;
  mostSpentTypes: ChartPiePoint[];
};

export const RenderPDF = async ({
  statPlots,
  baseStats,
  fromDate,
  toDate,
  mostSpentTypes,
}: RenderPdfParams) => {
  const showCompanyTypes =
    Array.isArray(mostSpentTypes) && mostSpentTypes.length > 0;

  return pdf(
    <Review
      statPlots={statPlots as Required<StatPlotsView>}
      baseStats={baseStats as React.ComponentProps<typeof Review>["baseStats"]}
      fromDate={fromDate}
      toDate={toDate}
      showCompanyTypes={showCompanyTypes}
    />,
  ).toBlob();
};
