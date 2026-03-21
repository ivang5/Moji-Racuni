const createItemService = (api, getResponse) => {
  const getItems = async (receiptId) => {
    const { response, data } = await api(`/api/items/${receiptId}/receipt/`);
    return getResponse(response, data);
  };

  const getValuableItems = async (dateFrom, dateTo, limit) => {
    const { response, data } = await api(
      `/api/items/most-valuable/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const getMostItems = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/items/most-items/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  return {
    getItems,
    getValuableItems,
    getMostItems,
  };
};

export default createItemService;
