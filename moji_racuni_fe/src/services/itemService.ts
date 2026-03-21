const createItemService = (api: any, getResponse: any) => {
  const getItems = async (receiptId: number) => {
    const { response, data } = await api(`/api/items/${receiptId}/receipt/`);
    return getResponse(response, data);
  };

  const getValuableItems = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/items/most-valuable/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const getMostItems = async (dateFrom: string, dateTo: string) => {
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
