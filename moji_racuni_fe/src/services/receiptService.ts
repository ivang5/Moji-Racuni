const createReceiptService = (api, getResponse) => {
  const getReceipts = async (page) => {
    const { response, data } = await api(`/api/receipts/?page=${page}/`);
    return getResponse(response, data);
  };

  const getReceipt = async (id) => {
    const { response, data } = await api(`/api/receipts/${id}/`);
    return getResponse(response, data);
  };

  const getLastReceipt = async () => {
    const { response, data } = await api("/api/receipts/last/");
    return getResponse(response, data);
  };

  const filterReceipts = async (
    dateFrom,
    dateTo,
    id,
    unitName,
    tin,
    priceFrom,
    priceTo,
    orderBy,
    ascendingOrder,
    page,
  ) => {
    const { response, data } = await api(
      `/api/receipts/filter?dateFrom=${dateFrom}&dateTo=${dateTo}&id=${id}&unitName=${unitName}&tin=${tin}&priceFrom=${priceFrom}&priceTo=${priceTo}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
  };

  const createReceipt = async (url, companyUnit) => {
    const { response, data } = await api("/api/receipts/", {
      method: "POST",
      body: JSON.stringify({ url: url, companyUnit: companyUnit }),
    });
    return getResponse(response, data, 201);
  };

  const createItems = async (url, receipt) => {
    const { response, data } = await api("/api/items/", {
      method: "POST",
      body: JSON.stringify({ url: url, receipt: receipt }),
    });
    return getResponse(response, data, 201);
  };

  const deleteReceipt = async (id) => {
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
