const createStatsService = (api, getResponse) => {
  const getReceiptsByHour = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/hours-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getReceiptsByWeekday = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/weekdays-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getReceiptsByMonth = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/months-count/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByHour = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/hours-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByWeekday = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/weekdays-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getSpentByMonth = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/months-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}/`,
    );
    return getResponse(response, data);
  };

  const getTotalSpent = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/total-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  const getMostSpentInADay = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/most-spent-day/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  const getStatPlots = async (dateFrom, dateTo, limit) => {
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
