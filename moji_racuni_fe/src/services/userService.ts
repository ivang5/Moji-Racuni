const createUserService = (api: any, getResponse: any) => {
  const getUser = async (id: number) => {
    const { response, data } = await api(`/api/users/${id}/`);
    return getResponse(response, data);
  };

  const filterUsers = async (
    id: string,
    username: string,
    email: string,
    orderBy: string,
    ascendingOrder: "asc" | "desc",
    page: number,
  ) => {
    const { response, data } = await api(
      `/api/users/filter/?id=${id}&username=${username}&email=${email}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
  };

  const updateUser = async (id: number, userInfo: any) => {
    const { response, data } = await api(`/api/users/${id}/`, {
      method: "PUT",
      body: JSON.stringify(userInfo),
    });
    return getResponse(response, data, 200);
  };

  const updateUserPassword = async (id: number, passInfo: any) => {
    const { response, data } = await api(`/api/users/update-password/${id}/`, {
      method: "PUT",
      body: JSON.stringify(passInfo),
    });
    return getResponse(response, data, 200);
  };

  return {
    getUser,
    filterUsers,
    updateUser,
    updateUserPassword,
  };
};

export default createUserService;
