const createUserService = (api, getResponse) => {
  const getUser = async (id) => {
    const { response, data } = await api(`/api/users/${id}/`);
    return getResponse(response, data);
  };

  const filterUsers = async (
    id,
    username,
    email,
    orderBy,
    ascendingOrder,
    page,
  ) => {
    const { response, data } = await api(
      `/api/users/filter/?id=${id}&username=${username}&email=${email}&orderBy=${orderBy}&ascendingOrder=${ascendingOrder}&page=${page}`,
    );
    return getResponse(response, data);
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

  return {
    getUser,
    filterUsers,
    updateUser,
    updateUserPassword,
  };
};

export default createUserService;
