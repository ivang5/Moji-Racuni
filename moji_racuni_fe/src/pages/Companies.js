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
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCompany, setModalCompany] = useState({});
  const [modalOpenType, setModalOpenType] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState("creation");
  const [typeValidation, setTypeValidation] = useState({
    name: "",
    description: "",
  });
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(10000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Naziv");
  const [sortType, setSortType] = useState("Opadajuće");
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
      page === undefined ? navigate("/preduzeca") : navigate("/not-found");
    }
  }, [page]);

  useEffect(() => {
    const pageNumbers = getPageNumberList(pageCount, pageNum);
    setPageNumbers(pageNumbers, pageNum);
    applySortingFilters();
    window.scrollTo(0, 0);
  }, [pageNum, pageCount]);

  useEffect(() => {
    const pageNumbers = getPageNumberList(pageCount, pageNum);
    setPageNumbers(pageNumbers, pageNum);
  }, [pageCount]);

  useEffect(() => {
    setTimeout(() => {
      setDocumentHeight(
        window.document.body.offsetHeight >= window.innerHeight
          ? window.document.body.offsetHeight
          : window.innerHeight
      );
    }, 800);
  }, [companies]);

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
    }
  };

  const createCompanyType = async (e) => {
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
      setTypeValidation(validationObj);
      return;
    }

    const companyTypeInfo = {
      name: e.target.name.value.trim(),
      description: e.target.description.value.trim(),
      user: user.id,
    };

    const companyType = await api.createCompanyType(companyTypeInfo);
  };

  const deleteCompanyType = async (id) => {
    await api.deleteCompanyType(id);
    getCompanyTypes();
    setToast({
      title: "Uspešno",
      text: "Tip preduzeća je uspešno obrisan.",
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
      text: "Slika kompanije uspešno promenjena.",
    });
    openToast();
  };

  //   const sendReport = async (e) => {
  //     e.preventDefault();

  //     if (e.target.repmsg.value.trim() === "") {
  //       setReportValidation("Polje za opis ne sme biti prazno!");
  //       return;
  //     } else if (e.target.repmsg.value.trim().length < 10) {
  //       setReportValidation("Opis mora sadržati bar 10 karaktera!");
  //       return;
  //     }

  //     const date = new Date();
  //     const formattedDate = dateTimeBEFormatter(date);

  //     const report = {
  //       date: formattedDate,
  //       receipt: modalReceipt.receipt.id,
  //       request: e.target.repmsg.value.trim(),
  //     };

  //     await api.createReport(report);
  //     setReportOpen(false);
  //     setModalOpen(false);
  //     setReportValidation("");
  //     setToast({
  //       title: "Uspešno",
  //       text: "Prijava je uspešno poslata.",
  //     });
  //     openToast();
  //   };

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
                  className="btn btn-primary btn-primary--black btn-round mb-2"
                  type="submit"
                >
                  Pretraži
                </button>
              </form>
            </div>
          </div>
          <div className="companies__sort mb-3">
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
        <div className="modal" style={{ minHeight: `${documentHeight}px` }}>
          {modalCompany.company ? (
            <div className="modal__content">
              <Company
                companyInfo={modalCompany}
                changeCompanyImg={changeCompanyImg}
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
              setModalOpen(false);
              setModalCompany({});
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
