onmessage = async function (e) {
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
}) => {
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
