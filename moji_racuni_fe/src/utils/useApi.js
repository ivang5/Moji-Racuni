import useFetch from "./useFetch";

const useApi = () => {
  const api = useFetch();

  const getResponse = (response, data, status) => {
    let toReturn;
    if (response.status === 409) {
      return 409;
    }
    response.status === status ? (toReturn = data) : (toReturn = null);
    return toReturn;
  };

  const getReceipt = async (url) => {
    const { response, data } = await api(url);
    return getResponse(response, data, 200);
  };

  const getLastReceipt = async () => {
    const { response, data } = await api("/api/receipts/last/");
    return getResponse(response, data, 200);
  };

  const getItems = async (receiptId) => {
    const { response, data } = await api(`/api/items/${receiptId}/receipt/`);
    return getResponse(response, data, 200);
  };

  const getUnit = async (id) => {
    const { response, data } = await api(`/api/company/units/${id}/`);
    return getResponse(response, data, 200);
  };

  const getCompany = async (tin) => {
    const { response, data } = await api(`/api/companies/${tin}/`);
    return getResponse(response, data, 200);
  };

  const getTotalSpent = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/receipts/total-spent?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return getResponse(response, data, 200);
  };

  const getVisitedCompaniesInfo = async (dateFrom, dateTo) => {
    const { response, data } = await api(
      `/api/companies/visited?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    return getResponse(response, data, 200);
  };

  const getValuableItems = async (dateFrom, dateTo, limit) => {
    const { response, data } = await api(
      `/api/items/most-valuable?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`
    );
    return getResponse(response, data, 200);
  };

  const getMostVisitedCompaniesInfo = async (dateFrom, dateTo, limit) => {
    const { response, data } = await api(
      `/api/companies/most-visited?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`
    );
    return getResponse(response, data, 200);
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

  const getLastReceiptFull = async () => {
    const receipt = await getLastReceipt();
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
    getReceipt,
    getLastReceipt,
    getItems,
    getUnit,
    getCompany,
    getLastReceiptFull,
    getBaseStats,
    addFullReceipt,
  };
};

export default useApi;
