import React, { useContext, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
import { getPageNumberList, getUserOrderCode } from "../utils/utils";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import User from "../components/User";
import UserCard from "../components/UserCard";

const Users = () => {
  const { page } = useParams();
  const [pageNum, setPageNum] = useState(1);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState({});
  const [blockingOpen, setBlockingOpen] = useState(false);
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(10000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("ID");
  const [sortType, setSortType] = useState("Rastuće");
  const [searchObj, setSearchObj] = useState({
    id: "%",
    username: "%",
    email: "%",
  });
  const sortByOptions = ["ID", "Status", "Kor. ime", "Ime", "Prezime", "Email"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    applySortingFilters();
  }, [sortBy, sortType]);

  useEffect(() => {
    if (user.role !== "ADMIN") {
      navigate("/not-found");
    } else if (parseInt(page)) {
      Math.sign(page) !== -1
        ? setPageNum(parseInt(page))
        : navigate("/not-found");
    } else {
      page === undefined ? setPageNum(1) : navigate("/not-found");
    }
  }, [page]);

  useEffect(() => {
    const pageNumbers = getPageNumberList(pageCount, pageNum);
    setPageNumbers(pageNumbers, pageNum);
    applySortingFilters();
    window.scrollTo(0, 0);
  }, [pageNum, pageCount]);

  useEffect(() => {
    setTimeout(() => {
      setDocumentHeight(
        window.document.body.offsetHeight >= window.innerHeight
          ? window.document.body.offsetHeight
          : window.innerHeight
      );
    }, 800);
  }, [users]);

  useEffect(() => {
    window.addEventListener("click", handleModalClick);
    window.addEventListener("keydown", handleModalKeydown);

    return () => {
      window.removeEventListener("click", handleModalClick);
      window.removeEventListener("keydown", handleModalKeydown);
    };
  }, []);

  const handleModalClick = (e) => {
    if (
      e.target.className === "modal" ||
      e.target.className === "modal__content"
    ) {
      resetModal();
    }
  };

  const handleModalKeydown = (e) => {
    if (e.key === "Escape") {
      resetModal();
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    let id = "%";
    let username = "%";
    let email = "%";
    let orderBy = getUserOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (e.target.id.value !== "") {
      id = e.target.id.value;
    }
    if (e.target.username.value.trim() !== "") {
      username = e.target.username.value.trim();
    }
    if (e.target.email.value.trim() !== "") {
      email = e.target.email.value.trim();
    }

    setUsersLoading(true);
    setSearchOpen(false);

    const users = await api.filterUsers(
      id,
      username,
      email,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setSearchObj({
      id: id,
      username: username,
      email: email,
    });

    setUsersLoading(false);

    if (users) {
      setPageCount(users.pageCount);
      setUsers(users.users);
    }
  };

  const applySortingFilters = async () => {
    let orderBy = getUserOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    setUsersLoading(true);

    const users = await api.filterUsers(
      searchObj.id,
      searchObj.username,
      searchObj.email,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setUsersLoading(false);

    if (users) {
      setPageCount(users.pageCount);
      setUsers(users.users);
    }
  };

  const openModal = async (userId) => {
    setModalOpen(true);

    let user = await api.getUser(userId);

    if (user) {
      setModalUser(user);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setModalUser({});
    setBlockingOpen(false);
  };

  const toggleUserBlock = async (id) => {
    const userInfo = {
      username: modalUser.username,
      first_name: modalUser.first_name,
      last_name: modalUser.last_name,
      email: modalUser.email,
      is_active: !modalUser.is_active,
    };
    const newUser = await api.updateUser(id, userInfo);
    applySortingFilters();
    setBlockingOpen(false);
    setModalOpen(false);
    setToast({
      title: "Uspešno",
      text: newUser.is_active
        ? "Korisnik više nije blokiran."
        : "Korisnik je uspešno blokiran.",
    });
    openToast();
  };

  const openToast = () => {
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 7000);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  return (
    <div>
      <div className="l-container">
        <div className="users">
          <TypeAnimation
            className="text-animator text-animator--fast pt-1 pb-3"
            sequence={[`Pregled korisnika`]}
            wrapper="h1"
            speed={10}
            cursor={false}
          />
          <div className="users__search mb-1">
            <div
              className={
                searchOpen
                  ? "users__search-wrapper users__search-wrapper--open"
                  : "users__search-wrapper"
              }
            >
              <h2
                className="users__search-title pb-2"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                Pretraga <i className="arrow arrow--down"></i>
              </h2>
              <form className="users__search-fields" onSubmit={applyFilters}>
                <div className="users__search-fields-wrapper">
                  <FormGroup name="id" text="ID" type="number" inline={true} />
                  <FormGroup
                    name="username"
                    text="Korisničko ime"
                    type="text"
                    inline={true}
                  />
                  <FormGroup
                    name="email"
                    text="Email"
                    type="text"
                    inline={true}
                  />
                </div>
                <button
                  className="btn btn-primary btn-round mb-2"
                  type="submit"
                >
                  Pretraži
                </button>
              </form>
            </div>
          </div>
          <div className="users__sort mb-3">
            <h4 className="users__sort-title">Sortiraj po: </h4>
            <div className="users__sort-wrapper">
              <Dropdown
                options={sortByOptions}
                onChange={(value) => setSortBy(value.value)}
                value={sortBy}
                placeholder="Izaberite opciju"
              />
              <Dropdown
                options={sortTypeOptions}
                onChange={(value) => setSortType(value.value)}
                value={sortType}
                placeholder="Izaberite opciju"
              />
            </div>
          </div>
          {usersLoading ? (
            <div className="users__items-empty">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="users__items-no-results">
              <h4>Nije pronađen nijedan korisnik.</h4>
            </div>
          ) : (
            <div className="users__items">
              {users &&
                users.map((user) => {
                  return (
                    <UserCard
                      key={user.id}
                      id={user.id}
                      username={user.username}
                      email={user.email}
                      active={user.is_active}
                      openModal={openModal}
                    />
                  );
                })}
            </div>
          )}
          {pageNumbers && !usersLoading && pageCount > 1 && (
            <Paginator
              pageNumbers={pageNumbers}
              activePage={pageNum}
              path="/korisnici"
            />
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="modal" style={{ minHeight: `${documentHeight}px` }}>
          {modalUser.id ? (
            <div className="modal__content">
              <User userInfo={modalUser} />
              <div className="modal__options modal__options--single">
                {!blockingOpen ? (
                  <button
                    className="btn btn-primary btn-primary--red btn-round"
                    onClick={() => setBlockingOpen(true)}
                  >
                    {modalUser.is_active
                      ? "Blokiraj korisnika"
                      : "Odblokiraj korisnika"}
                  </button>
                ) : (
                  <div className="modal__deletion">
                    <h4 className="modal__deletion-title">
                      {modalUser.is_active
                        ? "Blokiranje korisnika"
                        : "Uklanjanje bloka"}
                    </h4>
                    <p className="modal__deletion-text">
                      {modalUser.is_active
                        ? "Da li ste sigurni da želite da blokirate korisnika?"
                        : "Da li ste sigurni da želite da uklonite blok korisniku?"}
                    </p>
                    <div className="modal__deletion-btn-group">
                      <button
                        className="btn btn-primary btn-primary--gray btn-round"
                        onClick={() => setBlockingOpen(false)}
                      >
                        Odustani
                      </button>
                      <button
                        className="btn btn-primary btn-primary--red btn-round"
                        onClick={() => toggleUserBlock(modalUser.id)}
                      >
                        Potvrdi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="modal-empty">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
          <span
            className="close"
            onClick={() => {
              resetModal();
            }}
          ></span>
        </div>
      )}
      {toastOpen && (
        <Toast title={toast.title} text={toast.text} close={closeToast} />
      )}
    </div>
  );
};

export default Users;
