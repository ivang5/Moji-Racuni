const createCompanyService = (api: any, getResponse: any) => {
  const getCompanyUnits = async (tin: string) => {
    const { response, data } = await api(`/api/company/units/?tin=${tin}`);
    return getResponse(response, data);
  };

  const getUnit = async (id: number) => {
    const { response, data } = await api(`/api/company/units/${id}/`);
    return getResponse(response, data);
  };

  const getCompany = async (tin: string) => {
    const { response, data } = await api(`/api/companies/${tin}/`);
    return getResponse(response, data);
  };

  const getCompanyTypes = async () => {
    const { response, data } = await api("/api/company/types/");
    return getResponse(response, data);
  };

  const getTypeForCompany = async (tin: string) => {
    const { response, data } = await api(
      `/api/company/types/company/?tin=${tin}`,
    );
    return getResponse(response, data);
  };

  const getCompanyVisits = async (tin: string) => {
    const { response, data } = await api(`/api/companies/${tin}/visits/`);
    return getResponse(response, data);
  };

  const getVisitedCompaniesInfo = async (dateFrom: string, dateTo: string) => {
    const { response, data } = await api(
      `/api/companies/visited/?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    return getResponse(response, data);
  };

  const getMostSpentCompaniesInfo = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/companies/most-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const getMostVisitedCompaniesInfo = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/companies/most-visited/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const getMostSpentTypesInfo = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/company/types/most-spent/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const getMostVisitedTypesInfo = async (
    dateFrom: string,
    dateTo: string,
    limit: number,
  ) => {
    const { response, data } = await api(
      `/api/company/types/most-visited/?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=${limit}`,
    );
    return getResponse(response, data);
  };

  const filterCompanies = async (
    name: string,
    tin: string,
    type: string,
    orderBy: string,
    ascendingOrder: "asc" | "desc",
    page: number,
  ) => {
    const { response, data } = await api(
      `/api/companies/filter/?name=${name}&tin=${tin}&type=${type}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
  };

  const createCompany = async (url: string) => {
    const { response, data } = await api("/api/companies/", {
      method: "POST",
      body: JSON.stringify({ url: url }),
    });
    return getResponse(response, data, 201);
  };

  const createCompanyUnit = async (url: string, company: string) => {
    const { response, data } = await api("/api/company/units/", {
      method: "POST",
      body: JSON.stringify({ url: url, company: company }),
    });
    return getResponse(response, data, 201);
  };

  const createCompanyType = async (type: any) => {
    const { response, data } = await api("/api/company/types/", {
      method: "POST",
      body: JSON.stringify(type),
    });
    return getResponse(response, data, 201);
  };

  const deleteCompanyType = async (id: number) => {
    const { response, data } = await api(`/api/company/types/${id}/`, {
      method: "DELETE",
    });
    return getResponse(response, data, 204);
  };

  const changeCompanyImage = async (tin: string, image: File) => {
    const formData = new FormData();
    formData.append("img", image);

    const { response, data } = await api(`/api/companies/${tin}/change-img/`, {
      method: "PUT",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return getResponse(response, data, 200);
  };

  const changeCompanyType = async (
    tin: string,
    typeInfo: { type: number | "none" },
  ) => {
    const { response, data } = await api(`/api/companies/${tin}/change-type/`, {
      method: "PUT",
      body: JSON.stringify(typeInfo),
    });
    return getResponse(response, data, 200);
  };

  const changeType = async (id: number, typeInfo: any) => {
    const { response, data } = await api(`/api/company/types/${id}/`, {
      method: "PUT",
      body: JSON.stringify(typeInfo),
    });
    return getResponse(response, data, 200);
  };

  return {
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
  };
};

export default createCompanyService;
