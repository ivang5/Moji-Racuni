import React, { useContext, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
import { getPageNumberList, getCompanyOrderCode } from "../utils/utils";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import CompanyCard from "../components/CompanyCard";
import Company from "../components/Company";

const Companies = () => {
  const { page } = useParams();
  const [pageNum, setPageNum] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [selectedType, setSelectedType] = useState({});
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompany, setModalCompany] = useState({});
  const [modalOpenType, setModalOpenType] = useState(false);
  const [typeModalMain, setTypeModalMain] = useState(true);
  const [typeValidation, setTypeValidation] = useState({
    name: "",
    description: "",
  });
  const [typeValidationSecondary, setTypeValidationSecondary] = useState({
    name: "",
    description: "",
  });
  const [typeCreationOpen, setTypeCreationOpen] = useState(false);
  const [typeDeletionOpen, setTypeDeletionOpen] = useState(false);
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(10000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Naziv");
  const [sortType, setSortType] = useState("Rastuće");
  const [searchObj, setSearchObj] = useState({
    name: "%",
    tin: "%",
    type: "%",
  });
  const sortByOptions = ["Naziv", "PIB", "Tip"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    getCompanyTypes();
  }, []);

  useEffect(() => {
    applySortingFilters();
  }, [sortBy, sortType]);

  useEffect(() => {
    if (parseInt(page)) {
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
    let name = "%";
    let tin = "%";
    let type = "%";
    let orderBy = getCompanyOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (e.target.name.value.trim() !== "") {
      name = e.target.name.value.trim();
    }
    if (e.target.tin.value.trim() !== "") {
      tin = e.target.tin.value.trim();
    }
    if (e.target.type.value !== "") {
      type = e.target.type.value;
    }

    setCompaniesLoading(true);
    setSearchOpen(false);

    const companies = await api.filterCompanies(
      name,
      tin,
      type,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setSearchObj({
      name: name,
      tin: tin,
      type: type,
    });

    setCompaniesLoading(false);

    if (companies) {
      setPageCount(companies.pageCount);
      setCompanies(companies.companies);
    }
  };

  const applySortingFilters = async () => {
    let orderBy = getCompanyOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    setCompaniesLoading(true);

    const companies = await api.filterCompanies(
      searchObj.name,
      searchObj.tin,
      searchObj.type,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setCompaniesLoading(false);

    if (companies) {
      setPageCount(companies.pageCount);
      setCompanies(companies.companies);
    }
  };

  const getCompanyTypes = async () => {
    const companyTypes = await api.getCompanyTypes();
    setCompanyTypes(companyTypes);
  };

  const openModal = async (companyId) => {
    setModalOpen(true);

    const company = await api.getFullCompanyInfo(companyId);

    if (company) {
      setModalCompany(company);
      document.body.style.overflowY = "hidden";
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setModalCompany({});
    setTypeModalMain(true);
    setModalOpenType(false);
    setTypeCreationOpen(false);
    setTypeDeletionOpen(false);
    document.body.style.overflow = "auto";
  };

  const createCompanyType = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = { name: "", description: "" };

    if (e.target.name.value.trim() === "") {
      validationObj.name = "Naziv tipa ne sme biti prazan!";
      valid = false;
    } else if (e.target.name.value.trim().length > 11) {
      validationObj.name = "Naziv tipa ne sme sadržati više od 11 karaktera!";
      valid = false;
    }
    if (e.target.description.value.trim() === "") {
      validationObj.description = "Opis tipa ne sme biti prazan!";
      valid = false;
    }

    if (!valid) {
      setTypeValidation(validationObj);
      return;
    }

    const companyTypeInfo = {
      name: e.target.name.value.trim(),
      description: e.target.description.value.trim(),
      user: user.user_id,
    };

    const companyType = await api.createCompanyType(companyTypeInfo);
    if (companyType === 409) {
      validationObj.name = "Naziv tipa već postoji!";
      setTypeValidation(validationObj);
      return;
    }

    getCompanyTypes();
    setTypeValidation(validationObj);
    setTypeCreationOpen(false);
    setToast({
      title: "Uspešno",
      text: "Tip preduzeća je uspešno kreiran.",
    });
    openToast();
  };

  const changeType = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = { name: "", description: "" };

    if (e.target.name.value.trim() === "") {
      validationObj.name = "Naziv tipa ne sme biti prazan!";
      valid = false;
    }

    if (e.target.description.value.trim() === "") {
      validationObj.description = "Opis tipa ne sme biti prazan!";
      valid = false;
    }

    if (!valid) {
      setTypeValidationSecondary(validationObj);
      return;
    }

    const typeInfo = {
      name: e.target.name.value.trim(),
      description: e.target.description.value.trim(),
      user: user.user_id,
    };

    const companyType = await api.changeType(selectedType.id, typeInfo);
    if (companyType) {
      getCompanyTypes();
      applySortingFilters();
      setTypeModalMain(true);
      setToast({
        title: "Uspešno",
        text: "Tip preduzeća je uspešno promenjen.",
      });
      openToast();
    }
  };

  const deleteCompanyType = async () => {
    if (!selectedType.id) {
      return;
    }
    await api.deleteCompanyType(selectedType.id);
    getCompanyTypes();
    applySortingFilters();
    setTypeModalMain(true);
    setToast({
      title: "Uspešno",
      text: "Tip preduzeća je uspešno obrisan.",
    });
    openToast();
  };

  const changeCompanyType = async (id) => {
    const typeInfo = {
      type: id,
    };
    await api.changeCompanyType(modalCompany.company.tin, typeInfo);
    applySortingFilters();
    setToast({
      title: "Uspešno",
      text: "Tip preduzeća uspešno promenjen.",
    });
    openToast();
  };

  const changeCompanyImg = async (e) => {
    const image = e.target.files[0];
    const company = await api.changeCompanyImage(
      modalCompany.company.tin,
      image
    );
    await applySortingFilters();

    if (modalOpen) {
      setModalCompany((prevState) => {
        return { ...prevState, company: company };
      });
    }

    setToast({
      title: "Uspešno",
      text: "Slika preduzeća uspešno promenjena.",
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
        <div className="companies">
          <TypeAnimation
            className="text-animator text-animator--fast pt-1 pb-3"
            sequence={[`Pregled preduzeća`]}
            wrapper="h1"
            speed={10}
            cursor={false}
          />
          <div className="companies__search mb-1">
            <div
              className={
                searchOpen
                  ? "companies__search-wrapper companies__search-wrapper--open"
                  : "companies__search-wrapper"
              }
            >
              <h2
                className="companies__search-title pb-2"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                Pretraga <i className="arrow arrow--down"></i>
              </h2>
              <form
                className="companies__search-fields"
                onSubmit={applyFilters}
              >
                <div className="companies__search-fields-wrapper">
                  <FormGroup name="tin" text="PIB" type="text" inline={true} />
                  <FormGroup
                    name="name"
                    text="Naziv"
                    type="text"
                    inline={true}
                  />
                  <FormGroup name="type" text="Tip" type="text" inline={true} />
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
          <div className="companies__sort mb-2">
            <h4 className="companies__sort-title">Sortiraj po: </h4>
            <div className="companies__sort-wrapper">
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
          <button
            className="btn btn-primary btn-round mb-2"
            onClick={() => {
              setModalOpenType(true);
              document.body.style.overflowY = "hidden";
            }}
          >
            Upravljaj tipovima preduzeća{" "}
            <i className="arrow arrow--right arrow--btn"></i>
          </button>
          {companiesLoading ? (
            <div className="companies__items-empty">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : companies.length === 0 ? (
            <div className="companies__items-no-results">
              <h4>Nije pronađeno nijedno preduzeće.</h4>
            </div>
          ) : (
            <div className="companies__items">
              {companies &&
                companies.map((company) => {
                  return (
                    <CompanyCard
                      key={company.tin}
                      tin={company.tin}
                      name={company.name}
                      image={company.image}
                      openModal={openModal}
                    />
                  );
                })}
            </div>
          )}
          {pageNumbers && !companiesLoading && pageCount > 1 && (
            <Paginator
              pageNumbers={pageNumbers}
              activePage={pageNum}
              path="/preduzeca"
            />
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="modal">
          {modalCompany.company ? (
            <div className="modal__content">
              <Company
                companyInfo={modalCompany}
                changeCompanyImg={changeCompanyImg}
                companyTypes={companyTypes}
                changeCompanyType={changeCompanyType}
              />
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
      {modalOpenType && (
        <div className="modal">
          <div className="modal__content">
            {typeModalMain ? (
              <div className="company-type">
                <div className="company-type__overview">
                  <h3 className="t-center">Pregled tipova preduzeća</h3>
                  {companyTypes.length > 0 ? (
                    <div className="company-type__tag-wrapper">
                      {companyTypes.map((type) => (
                        <div
                          className="company-type__tag"
                          key={type.id}
                          onClick={() => {
                            setSelectedType(type);
                            setTypeModalMain(false);
                          }}
                        >
                          {type.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="company-type__empty t-center">
                      Trenutno ne postoji nijedan tip preduzeća.
                    </p>
                  )}
                </div>
                <div className="modal__options modal__options--single">
                  {!typeCreationOpen ? (
                    <button
                      className="btn btn-primary btn-round"
                      onClick={() => setTypeCreationOpen(true)}
                    >
                      Dodaj tip preduzeća
                    </button>
                  ) : (
                    <div className="modal__deletion">
                      <h4 className="modal__deletion-title">
                        Dodavanje tipa preduzeća
                      </h4>
                      <form
                        className="company-type__form"
                        onSubmit={createCompanyType}
                      >
                        <FormGroup
                          name="name"
                          text="Naziv"
                          type="text"
                          inline={true}
                          error={typeValidation.name}
                        />
                        <textarea
                          className="company-type__form-field"
                          name="description"
                          id="description"
                          placeholder="Kratak opis tipa..."
                        ></textarea>
                        <span
                          className={
                            typeValidation.description === ""
                              ? "d-none"
                              : "form__error company-type__form-error"
                          }
                        >
                          {typeValidation.description}
                        </span>
                        <button
                          className="btn btn-primary btn-primary--gray btn-round company-type__form-btn"
                          type="button"
                          onClick={() => {
                            setTypeCreationOpen(false);
                            setTypeValidation({
                              name: "",
                              description: "",
                            });
                          }}
                        >
                          Odustani
                        </button>
                        <button
                          className="btn btn-primary btn-round company-type__form-btn"
                          type="submit"
                        >
                          Dodaj
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="modal__options">
                  <div className="modal__deletion">
                    <div className="company-type__back-btn-wrapper">
                      <button
                        className="company-type__back-btn"
                        onClick={() => {
                          setTypeModalMain(true);
                          setTypeValidationSecondary({
                            name: "",
                            description: "",
                          });
                        }}
                      >
                        <i className="arrow arrow--left"></i> Nazad
                      </button>
                    </div>
                    <h4 className="modal__deletion-title">
                      Upravljanje tipom preduzeća
                    </h4>
                    {selectedType.id && (
                      <form
                        className="company-type__form"
                        onSubmit={changeType}
                      >
                        <FormGroup
                          name="name"
                          text="Naziv"
                          type="text"
                          inline={true}
                          error={typeValidationSecondary.name}
                          defaultVal={selectedType.name}
                        />
                        <textarea
                          className="company-type__form-field"
                          name="description"
                          id="description"
                          placeholder="Kratak opis tipa..."
                          defaultValue={selectedType.description}
                        ></textarea>
                        <span
                          className={
                            typeValidationSecondary.description === ""
                              ? "d-none"
                              : "form__error company-type__form-error"
                          }
                        >
                          {typeValidationSecondary.description}
                        </span>
                        <button
                          className="btn btn-primary btn-primary--yellow btn-round company-type__form-btn"
                          type="submit"
                        >
                          Sačuvaj
                        </button>
                        <button
                          className="btn btn-primary btn-primary--red btn-round company-type__form-btn"
                          type="button"
                          onClick={() => {
                            setTypeDeletionOpen((prevState) => !prevState);
                          }}
                        >
                          Obriši
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                {typeDeletionOpen && (
                  <div className="modal__options">
                    <div className="modal__deletion">
                      <h4 className="modal__deletion-title">
                        Brisanje tipa preduzeća
                      </h4>
                      <p className="modal__deletion-text">
                        Da li ste sigurni da želite da obrišete tip?
                      </p>
                      <div className="modal__deletion-btn-group">
                        <button
                          className="btn btn-primary btn-primary--gray btn-round"
                          onClick={() => setTypeDeletionOpen(false)}
                        >
                          Odustani
                        </button>
                        <button
                          className="btn btn-primary btn-primary--red btn-round"
                          onClick={() => {
                            deleteCompanyType();
                            setTypeDeletionOpen(false);
                          }}
                        >
                          Potvrdi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <span
            className="close"
            onClick={() => {
              setModalOpenType(false);
              setTypeCreationOpen(false);
              setTypeDeletionOpen(false);
              setTypeModalMain(true);
              setTypeValidation({
                name: "",
                description: "",
              });
              setTypeValidationSecondary({
                name: "",
                description: "",
              });
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

export default Companies;
