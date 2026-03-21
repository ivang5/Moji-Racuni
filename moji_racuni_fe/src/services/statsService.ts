const createStatsService = (api: any, getResponse: any) => {
  const getReceiptsByHour = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/hours-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getReceiptsByWeekday = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/weekdays-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getReceiptsByMonth = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/months-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByHour = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/hours-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByWeekday = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/weekdays-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByMonth = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/months-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getTotalSpent = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/total-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  const getMostSpentInADay = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/receipts/most-spent-day/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  const getStatPlots = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/receipts/plot/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  return {
    getReceiptsByHour,
    getReceiptsByWeekday,
    getReceiptsByMonth,
    getSpentByHour,
    getSpentByWeekday,
    getSpentByMonth,
    getTotalSpent,
    getMostSpentInADay,
    getStatPlots,
  };
};

export default createStatsService;
