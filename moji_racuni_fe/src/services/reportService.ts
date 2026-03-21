const createReportService = (api: any, getResponse: any) => {
  const getReport = async (id: number) => {
    const { response, data } = await api(`/api/reports/${id}/`);
    return getResponse(response, data);
  };

  const getLastReport = async () => {
    const { response, data } = await api("/api/reports/last/");
    return getResponse(response, data);
  };

  const filterReports = async (
    dateFrom: string,
    dateTo: string,
    id: string,
    receipt: string,
    user: string,
    request: string,
    orderBy: string,
    ascendingOrder: "asc" | "desc",
    page: number,
  ) => {
    const { response, data } = await api(
      `/api/reports/filter?dateFrom=${dateFrom}&dateTo=${dateTo}&id=${id}&receipt=${receipt}&user=${user}&request=${request}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
  };

  const createReport = async (report: any) => {
    const { response, data } = await api("/api/reports/", {
      method: "POST",
      body: JSON.stringify(report),
    });
    return getResponse(response, data, 201);
  };

  const updateReport = async (id: number, reportInfo: any) => {
    const { response, data } = await api(`/api/reports/${id}/`, {
      method: "PUT",
      body: JSON.stringify(reportInfo),
    });
    return getResponse(response, data, 200);
  };

  const setReportSeen = async (id: number) => {
    const { response, data } = await api(`/api/reports/${id}/set-seen/`, {
      method: "PUT",
    });
    return getResponse(response, data, 200);
  };

  const deleteReport = async (id: number) => {
    const { response, data } = await api(`/api/reports/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  return {
    getReport,
    getLastReport,
    filterReports,
    createReport,
    updateReport,
    setReportSeen,
    deleteReport,
  };
};

export default createReportService;
