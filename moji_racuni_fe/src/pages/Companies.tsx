import React, { useCallback, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
import { getCompanyOrderCode } from "../utils/utils";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import Company from "../components/Company";
import useToast from "../hooks/useToast";
import usePaginatedListState from "../hooks/usePaginatedListState";
import useModalDismiss from "../hooks/useModalDismiss";
import useRoutePageParam from "../hooks/useRoutePageParam";
import usePaginatedSortingFetch from "../hooks/usePaginatedSortingFetch";
import useAuthUser from "../hooks/useAuthUser";
import useCompanyTypesQuery from "../hooks/queries/useCompanyTypesQuery";
import type {
  CompanyInfoView,
  CompanyListItemView,
  CompanyTypeView,
} from "../types/viewModels";

type TypeValidation = {
  name: string;
  description: string;
};

type CompanySearch = {
  name: string;
  tin: string;
  type: string;
};

type CompanyFilterForm = HTMLFormElement & {
  name: HTMLInputElement;
  tin: HTMLInputElement;
  type: HTMLInputElement;
};

type CompanyTypeForm = HTMLFormElement & {
  name: HTMLInputElement;
  description: HTMLTextAreaElement;
};

const Companies = () => {
  const { page } = useParams();
  const [companies, setCompanies] = useState<CompanyListItemView[]>([]);
  const [selectedType, setSelectedType] = useState<Partial<CompanyTypeView>>(
    {},
  );
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompany, setModalCompany] = useState<Partial<CompanyInfoView>>(
    {},
  );
  const [modalOpenType, setModalOpenType] = useState(false);
  const [typeModalMain, setTypeModalMain] = useState(true);
  const [typeValidation, setTypeValidation] = useState<TypeValidation>({
    name: "",
    description: "",
  });
  const [typeValidationSecondary, setTypeValidationSecondary] =
    useState<TypeValidation>({
      name: "",
      description: "",
    });
  const [typeCreationOpen, setTypeCreationOpen] = useState(false);
  const [typeDeletionOpen, setTypeDeletionOpen] = useState(false);

  const {
    pageNum,
    setPageNum,
    pageNumbers,
    pageCount,
    setPageCount,
    searchOpen,
    setSearchOpen,
    sortBy,
    setSortBy,
    sortType,
    setSortType,
    searchObj,
    setSearchObj,
  } = usePaginatedListState({
    initialSortBy: "Naziv",
    initialSortType: "Rastuće",
    initialSearchObj: {
      name: "%",
      tin: "%",
      type: "%",
    },
  });

  const { toast, toastOpen, showToast, closeToast } = useToast(7000);

  const sortByOptions = ["Naziv", "PIB", "Tip"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();
  const { data: companyTypes = [], refetch: refetchCompanyTypes } =
    useCompanyTypesQuery();
  const { userId } = useAuthUser();
  const navigate = useNavigate();

  const fetchSortedPage = useCallback(
    async ({ api, searchObj, orderBy, ascendingOrder, pageNum }: any) => {
      const filters = searchObj as CompanySearch;
      const companies = await api.filterCompanies(
        filters.name,
        filters.tin,
        filters.type,
        orderBy,
        ascendingOrder,
        pageNum,
      );

      if (!companies) {
        return null;
      }

      return {
        pageCount: companies.pageCount,
        items: companies.companies,
      };
    },
    [],
  );

  const applySortingFilters = usePaginatedSortingFetch({
    api,
    sortBy,
    sortType,
    searchObj,
    pageNum,
    getOrderBy: getCompanyOrderCode,
    fetchSortedPage,
    setLoading: setCompaniesLoading,
    setPageCount,
    setItems: setCompanies,
  });

  useEffect(() => {
    applySortingFilters();
  }, [sortBy, sortType, applySortingFilters]);

  useRoutePageParam({
    page,
    setPageNum,
    navigate,
  });

  useEffect(() => {
    applySortingFilters();
    window.scrollTo(0, 0);
  }, [pageNum, applySortingFilters]);

  const applyFilters = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as CompanyFilterForm;
    let name = "%";
    let tin = "%";
    let type = "%";
    let orderBy = getCompanyOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (form.name.value.trim() !== "") {
      name = form.name.value.trim();
    }
    if (form.tin.value.trim() !== "") {
      tin = form.tin.value.trim();
    }
    if (form.type.value !== "") {
      type = form.type.value;
    }

    setCompaniesLoading(true);
    setSearchOpen(false);

    const companies = await api.filterCompanies(
      name,
      tin,
      type,
      orderBy,
      ascendingOrder,
      pageNum,
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

  const openModal = async (companyTin: string) => {
    setModalOpen(true);

    const company = (await api.getFullCompanyInfo(
      companyTin,
    )) as CompanyInfoView | null;

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

  const createCompanyType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as CompanyTypeForm;
    if (!userId) {
      return;
    }

    let valid = true;
    const validationObj: TypeValidation = { name: "", description: "" };

    if (form.name.value.trim() === "") {
      validationObj.name = "Naziv tipa ne sme biti prazan!";
      valid = false;
    } else if (form.name.value.trim().length > 11) {
      validationObj.name = "Naziv tipa ne sme sadržati više od 11 karaktera!";
      valid = false;
    }
    if (form.description.value.trim() === "") {
      validationObj.description = "Opis tipa ne sme biti prazan!";
      valid = false;
    }

    if (!valid) {
      setTypeValidation(validationObj);
      return;
    }

    const companyTypeInfo = {
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      user: userId,
    };

    const companyType = await api.createCompanyType(companyTypeInfo);
    if (companyType === 409) {
      validationObj.name = "Naziv tipa već postoji!";
      setTypeValidation(validationObj);
      return;
    }

    refetchCompanyTypes();
    setTypeValidation(validationObj);
    setTypeCreationOpen(false);
    showToast({
      title: "Uspešno",
      text: "Tip preduzeća je uspešno kreiran.",
    });
  };

  const changeType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as CompanyTypeForm;
    if (!userId) {
      return;
    }

    let valid = true;
    const validationObj: TypeValidation = { name: "", description: "" };

    if (form.name.value.trim() === "") {
      validationObj.name = "Naziv tipa ne sme biti prazan!";
      valid = false;
    }

    if (form.description.value.trim() === "") {
      validationObj.description = "Opis tipa ne sme biti prazan!";
      valid = false;
    }

    if (!valid) {
      setTypeValidationSecondary(validationObj);
      return;
    }

    const typeInfo = {
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      user: userId,
    };

    if (!selectedType.id) {
      return;
    }

    const companyType = await api.changeType(selectedType.id, typeInfo);
    if (companyType) {
      refetchCompanyTypes();
      applySortingFilters();
      setTypeModalMain(true);
      showToast({
        title: "Uspešno",
        text: "Tip preduzeća je uspešno promenjen.",
      });
    }
  };

  const deleteCompanyType = async () => {
    if (!selectedType.id) {
      return;
    }
    await api.deleteCompanyType(selectedType.id);
    refetchCompanyTypes();
    applySortingFilters();
    setTypeModalMain(true);
    showToast({
      title: "Uspešno",
      text: "Tip preduzeća je uspešno obrisan.",
    });
  };

  const changeCompanyType = async (id: number | "none") => {
    if (!modalCompany.company) {
      return;
    }

    const typeInfo = {
      type: id,
    };
    await api.changeCompanyType(modalCompany.company.tin, typeInfo);
    applySortingFilters();
    showToast({
      title: "Uspešno",
      text: "Tip preduzeća uspešno promenjen.",
    });
  };

  const changeCompanyImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image || !modalCompany.company) {
      return;
    }

    const company = await api.changeCompanyImage(
      modalCompany.company.tin,
      image,
    );
    await applySortingFilters();

    if (modalOpen) {
      setModalCompany((prevState) => {
        return { ...prevState, company: company };
      });
    }

    showToast({
      title: "Uspešno",
      text: "Slika preduzeća uspešno promenjena.",
    });
  };

  useModalDismiss(resetModal);

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
              {companies.map((company) => {
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
                companyInfo={modalCompany as CompanyInfoView}
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
