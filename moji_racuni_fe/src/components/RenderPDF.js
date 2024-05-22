import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import Review from "./Review";

export const RenderPDF = async ({
  statPlots,
  baseStats,
  fromDate,
  toDate,
  mostSpentTypes,
}) => {
  return pdf(
    createElement(Review, {
      statPlots,
      baseStats,
      fromDate,
      toDate,
      mostSpentTypes,
    })
  ).toBlob();
};
