import useFetch from "./useFetch";

const useApi = () => {
  const api = useFetch();

  const getResponse = (response, data, status = 200) => {
    let toReturn;
    if (response.status === 409) {
      return 409;
    }
    if (response.status === 404) {
      return 404;
    }
    response.status === status ? (toReturn = data) : (toReturn = null);
    return toReturn;
  };

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

  const getItems = async (receiptId) => {
    const { response, data } = await api(`/api/items/${receiptId}/receipt/`);
    return getResponse(response, data);
  };

  const getCompanyUnits = async (tin) => {
    const { response, data } = await api(`/api/company/units/?tin=${tin}`);
    return getResponse(response, data);
  };

  const getUnit = async (id) => {
    const { response, data } = await api(`/api/company/units/${id}/`);
    return getResponse(response, data);
  };

  const getCompany = async (tin) => {
    const { response, data } = await api(`/api/companies/${tin}/`);
    return getResponse(response, data);
  };

  const getCompanyTypes = async () => {
    const { response, data } = await api("/api/company/types/");
    return getResponse(response, data);
  };

  const getUser = async (id) => {
    const { response, data } = await api(`/api/users/${id}/`);
    return getResponse(response, data);
  };

  const getReport = async (id) => {
    const { response, data } = await api(`/api/reports/${id}/`);
    return getResponse(response, data);
  };

  const getLastReport = async () => {
    const { response, data } = await api("/api/reports/last/");
    return getResponse(response, data);
  };

  const getTypeForCompany = async (tin) => {
    const { response, data } = await api(
      `/api/company/types/company/?tin=${tin}`
    );
    return getResponse(response, data);
  };

  const getTotalSpent = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/total-spent?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return getResponse(response, data);
  };

  const getCompanyVisits = async (tin) => {
    const { response, data } = await api(`/api/companies/${tin}/visits/`);
    return getResponse(response, data);
  };

  const getVisitedCompaniesInfo = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/companies/visited?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return getResponse(response, data);
  };

  const getValuableItems = async (dateFrom, dateTo, limit) => {
    const { response, data } = await api(
      `/api/items/most-valuable?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`
    );
    return getResponse(response, data);
  };

  const getMostVisitedCompaniesInfo = async (dateFrom, dateTo, limit) => {
    const { response, data } = await api(
      `/api/companies/most-visited?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`
    );
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
    page
  ) => {
    const { response, data } = await api(
      `/api/receipts/filter?dateFrom=${dateFrom}&dateTo=${dateTo}&id=${id}&unitName=${unitName}&tin=${tin}&priceFrom=${priceFrom}&priceTo=${priceTo}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`
    );
    return getResponse(response, data);
  };

  const filterReports = async (
    dateFrom,
    dateTo,
    id,
    receipt,
    user,
    request,
    orderBy,
    ascendingOrder,
    page
  ) => {
    const { response, data } = await api(
      `/api/reports/filter?dateFrom=${dateFrom}&dateTo=${dateTo}&id=${id}&receipt=${receipt}&user=${user}&request=${request}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`
    );
    return getResponse(response, data);
  };

  const filterCompanies = async (
    name,
    tin,
    type,
    orderBy,
    ascendingOrder,
    page
  ) => {
    const { response, data } = await api(
      `/api/companies/filter/?name=${name}&tin=${tin}&type=${type}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`
    );
    return getResponse(response, data);
  };

  const filterUsers = async (
    id,
    username,
    firstname,
    lastname,
    email,
    orderBy,
    ascendingOrder,
    page
  ) => {
    const { response, data } = await api(
      `/api/users/filter/?id=${id}&username=${username}&firstname=${firstname}&lastname=${lastname}&email=${email}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`
    );
    return getResponse(response, data);
  };

  const createCompany = async (url) => {
    const { response, data } = await api("/api/companies/", {
      method: "POST",
      body: JSON.stringify({ url: url }),
    });
    return getResponse(response, data, 201);
  };

  const createCompanyUnit = async (url, company) => {
    const { response, data } = await api("/api/company/units/", {
      method: "POST",
      body: JSON.stringify({ url: url, company: company }),
    });
    return getResponse(response, data, 201);
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

  const createReport = async (report) => {
    const { response, data } = await api("/api/reports/", {
      method: "POST",
      body: JSON.stringify(report),
    });
    return getResponse(response, data, 201);
  };

  const createCompanyType = async (type) => {
    const { response, data } = await api("/api/company/types/", {
      method: "POST",
      body: JSON.stringify(type),
    });
    return getResponse(response, data, 201);
  };

  const updateUser = async (id, userInfo) => {
    const { response, data } = await api(`/api/users/${id}/`, {
      method: "PUT",
      body: JSON.stringify(userInfo),
    });
    return getResponse(response, data, 200);
  };

  const updateUserPassword = async (id, passInfo) => {
    const { response, data } = await api(`/api/users/update-password/${id}/`, {
      method: "PUT",
      body: JSON.stringify(passInfo),
    });
    return getResponse(response, data, 200);
  };

  const updateReport = async (id, reportInfo) => {
    const { response, data } = await api(`/api/reports/${id}/`, {
      method: "PUT",
      body: JSON.stringify(reportInfo),
    });
    return getResponse(response, data, 200);
  };

  const setReportSeen = async (id) => {
    const { response, data } = await api(`/api/reports/${id}/set-seen/`, {
      method: "PUT",
    });
    return getResponse(response, data, 200);
  };

  const deleteReceipt = async (id) => {
    const { response, data } = await api(`/api/receipts/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  const deleteReport = async (id) => {
    const { response, data } = await api(`/api/reports/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  const deleteCompanyType = async (id) => {
    const { response, data } = await api(`/api/company/types/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  const changeCompanyImage = async (tin, image) => {
    const formData = new FormData();
    formData.append("img", image);

    const { response, data } = await api(`/api/companies/${tin}/change-img/`, {
      method: "PUT",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return getResponse(response, data, 200);
  };

  const changeCompanyType = async (tin, typeInfo) => {
    const { response, data } = await api(`/api/companies/${tin}/change-type/`, {
      method: "PUT",
      body: JSON.stringify(typeInfo),
    });
    return getResponse(response, data, 200);
  };

  const changeType = async (id, typeInfo) => {
    const { response, data } = await api(`/api/company/types/${id}/`, {
      method: "PUT",
      body: JSON.stringify(typeInfo),
    });
    return getResponse(response, data, 200);
  };

  const getLastReceiptFull = async () => {
    const receipt = await getLastReceipt();
    if (receipt === 404) {
      return receipt;
    }
    const items = await getItems(receipt.id);
    const unit = await getUnit(receipt.companyUnit);
    const company = await getCompany(unit.company);
    const receiptFull = {
      receipt: receipt,
      items: items,
      unit: unit,
      company: company,
    };
    return receiptFull;
  };

  const getFullReceiptInfo = async (id) => {
    const receipt = await getReceipt(id);
    if (receipt === 404) {
      return receipt;
    }
    const items = await getItems(receipt.id);
    const unit = await getUnit(receipt.companyUnit);
    const company = await getCompany(unit.company);
    const receiptFull = {
      receipt: receipt,
      items: items,
      unit: unit,
      company: company,
    };
    return receiptFull;
  };

  const getFullCompanyInfo = async (tin) => {
    const company = await getCompany(tin);
    if (company === 404) {
      return company;
    }
    const units = await getCompanyUnits(tin);
    const type = await getTypeForCompany(tin);
    const visits = await getCompanyVisits(tin);
    const companyFull = {
      company: company,
      units: units,
      type: type,
      visits: visits,
    };
    return companyFull;
  };

  const getBaseStats = async (dateFrom, dateTo, limit) => {
    const totalSpent = await getTotalSpent(dateFrom, dateTo);
    const visitedCompaniesInfo = await getVisitedCompaniesInfo(
      dateFrom,
      dateTo
    );
    const MostVisitedCompaniesInfo = await getMostVisitedCompaniesInfo(
      dateFrom,
      dateTo,
      limit
    );
    const mostValuableItems = await getValuableItems(dateFrom, dateTo, limit);
    const baseStats = {
      totalSpent: totalSpent,
      visitedCompaniesInfo: visitedCompaniesInfo,
      MostVisitedCompaniesInfo: MostVisitedCompaniesInfo,
      mostValuableItems: mostValuableItems,
    };
    return baseStats;
  };

  const addFullReceipt = async (url) => {
    const company = await createCompany(url);
    if (company === null) {
      return null;
    }
    const companyUnit = await createCompanyUnit(url, company.tin);
    if (companyUnit === null) {
      return null;
    }
    const receipt = await createReceipt(url, companyUnit.id);
    if (receipt === null) {
      return null;
    } else if (receipt === 409) {
      return 409;
    }
    const items = await createItems(url, receipt.id);
    return items;
  };

  return {
    getReceipts,
    getReceipt,
    getLastReceipt,
    getItems,
    getUnit,
    getCompany,
    getCompanyTypes,
    getTypeForCompany,
    getCompanyVisits,
    getUser,
    getReport,
    getLastReport,
    getLastReceiptFull,
    getFullReceiptInfo,
    getFullCompanyInfo,
    getBaseStats,
    filterReceipts,
    filterReports,
    filterCompanies,
    filterUsers,
    addFullReceipt,
    createReport,
    createCompanyType,
    updateUser,
    updateUserPassword,
    updateReport,
    setReportSeen,
    deleteReceipt,
    deleteReport,
    deleteCompanyType,
    changeCompanyImage,
    changeCompanyType,
    changeType,
  };
};

export default useApi;
