import type {
  BaseStatsView,
  ChartPiePoint,
  StatPlotsView,
} from "../types/viewModels";

type PdfWorkerPayload = {
  statPlots: StatPlotsView;
  baseStats: BaseStatsView;
  fromDate: Date;
  toDate: Date;
  mostSpentTypes: ChartPiePoint[];
};

onmessage = async function (e: MessageEvent<PdfWorkerPayload>) {
  const data = e.data;
  const PDFData = await renderPDFInWorker(data);

  postMessage(PDFData);
};

const renderPDFInWorker = async ({
  statPlots,
  baseStats,
  fromDate,
  toDate,
  mostSpentTypes,
}: PdfWorkerPayload) => {
  const { RenderPDF } = await import("../components/RenderPDF");
  const PDFBlob = await RenderPDF({
    statPlots,
    baseStats,
    fromDate,
    toDate,
    mostSpentTypes,
  });

  return PDFBlob;
};

export {};
