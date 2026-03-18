import useFetch from "./useFetch";
import createReceiptService from "../services/receiptService";
import createReportService from "../services/reportService";
import createCompanyService from "../services/companyService";
import createUserService from "../services/userService";
import createStatsService from "../services/statsService";
import createItemService from "../services/itemService";

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

  const {
    getReceipts,
    getReceipt,
    getLastReceipt,
    filterReceipts,
    createReceipt,
    createItems,
    deleteReceipt,
  } = createReceiptService(api, getResponse);

  const {
    getReport,
    getLastReport,
    filterReports,
    createReport,
    updateReport,
    setReportSeen,
    deleteReport,
  } = createReportService(api, getResponse);

  const {
    getCompanyUnits,
    getUnit,
    getCompany,
    getCompanyTypes,
    getTypeForCompany,
    getCompanyVisits,
    getVisitedCompaniesInfo,
    getMostSpentCompaniesInfo,
    getMostVisitedCompaniesInfo,
    getMostSpentTypesInfo,
    getMostVisitedTypesInfo,
    filterCompanies,
    createCompany,
    createCompanyUnit,
    createCompanyType,
    deleteCompanyType,
    changeCompanyImage,
    changeCompanyType,
    changeType,
  } = createCompanyService(api, getResponse);

  const { getUser, filterUsers, updateUser, updateUserPassword } =
    createUserService(api, getResponse);

  const {
    getReceiptsByHour,
    getReceiptsByWeekday,
    getReceiptsByMonth,
    getSpentByHour,
    getSpentByWeekday,
    getSpentByMonth,
    getTotalSpent,
    getMostSpentInADay,
    getStatPlots,
  } = createStatsService(api, getResponse);

  const { getItems, getValuableItems, getMostItems } = createItemService(
    api,
    getResponse,
  );

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
      dateTo,
    );
    const MostVisitedCompaniesInfo = await getMostVisitedCompaniesInfo(
      dateFrom,
      dateTo,
      limit,
    );
    const mostValuableItems = await getValuableItems(dateFrom, dateTo, limit);
    const mostItems = await getMostItems(dateFrom, dateTo);
    const mostSpentInADay = await getMostSpentInADay(dateFrom, dateTo);
    const baseStats = {
      totalSpent: totalSpent,
      visitedCompaniesInfo: visitedCompaniesInfo,
      MostVisitedCompaniesInfo: MostVisitedCompaniesInfo,
      mostValuableItems: mostValuableItems,
      mostItems: mostItems,
      mostSpentInADay: mostSpentInADay,
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
    getReceiptsByHour,
    getReceiptsByWeekday,
    getReceiptsByMonth,
    getSpentByHour,
    getSpentByWeekday,
    getSpentByMonth,
    getTotalSpent,
    getItems,
    getUnit,
    getCompany,
    getCompanyTypes,
    getTypeForCompany,
    getCompanyVisits,
    getMostSpentCompaniesInfo,
    getMostVisitedCompaniesInfo,
    getMostSpentTypesInfo,
    getMostVisitedTypesInfo,
    getValuableItems,
    getUser,
    getReport,
    getLastReport,
    getLastReceiptFull,
    getFullReceiptInfo,
    getFullCompanyInfo,
    getBaseStats,
    getStatPlots: getStatPlots,
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
