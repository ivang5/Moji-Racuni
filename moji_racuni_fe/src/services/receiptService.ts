const createReceiptService = (api: any, getResponse: any) => {
  const getReceipts = async (page: number) => {
    const { response, data } = await api(`/api/receipts/?page=${page}/`);
    return getResponse(response, data);
  };

  const getReceipt = async (id: number) => {
    const { response, data } = await api(`/api/receipts/${id}/`);
    return getResponse(response, data);
  };

  const getLastReceipt = async () => {
    const { response, data } = await api("/api/receipts/last/");
    return getResponse(response, data);
  };

  const filterReceipts = async (
    dateFrom: string,
    dateTo: string,
    id: string,
    unitName: string,
    tin: string,
    priceFrom: number,
    priceTo: number,
    orderBy: string,
    ascendingOrder: "asc" | "desc",
    page: number,
  ) => {
    const { response, data } = await api(
      `/api/receipts/filter?dateFrom=${dateFrom}&dateTo=${dateTo}&id=${id}&unitName=${unitName}&tin=${tin}&priceFrom=${priceFrom}&priceTo=${priceTo}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
  };

  const createReceipt = async (url: string, companyUnit: number) => {
    const { response, data } = await api("/api/receipts/", {
      method: "POST",
      body: JSON.stringify({ url: url, companyUnit: companyUnit }),
    });
    return getResponse(response, data, 201);
  };

  const createItems = async (url: string, receipt: number) => {
    const { response, data } = await api("/api/items/", {
      method: "POST",
      body: JSON.stringify({ url: url, receipt: receipt }),
    });
    return getResponse(response, data, 201);
  };

  const deleteReceipt = async (id: number) => {
    const { response, data } = await api(`/api/receipts/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  return {
    getReceipts,
    getReceipt,
    getLastReceipt,
    filterReceipts,
    createReceipt,
    createItems,
    deleteReceipt,
  };
};

export default createReceiptService;
