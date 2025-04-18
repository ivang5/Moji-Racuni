import React, { useContext, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
import {
  getTenYearsAgo,
  dateBEFormatter,
  getReportOrderCode,
  getPageNumberList,
  getTomorrow,
} from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ReportCard from "../components/ReportCard";
import Report from "../components/Report";

const Reports = () => {
  const { page } = useParams();
  const [pageNum, setPageNum] = useState(1);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReport, setModalReport] = useState({});
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseValidation, setResponseValidation] = useState("");
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(10000);
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(getTomorrow());
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Datum");
  const [sortType, setSortType] = useState("Opadajuće");
  const [searchObj, setSearchObj] = useState({
    dateFrom: dateBEFormatter(fromDate),
    dateTo: dateBEFormatter(toDate),
    id: "%",
    receipt: "%",
    user: "%",
    request: "%",
  });
  const sortByOptions = ["Datum", "Status"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
    setTimeout(() => {
      setDocumentHeight(
        window.document.body.offsetHeight >= window.innerHeight
          ? window.document.body.offsetHeight
          : window.innerHeight
      );
    }, 800);
  }, [reports]);

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
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let id = "%";
    let receipt = "%";
    let user = "%";
    let request = "%";
    let orderBy = getReportOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (e.target.id.value !== "") {
      id = e.target.id.value;
    }
    if (e.target.request.value.trim() !== "") {
      request = e.target.request.value.trim();
    }
    if (e.target.user && e.target.user.value.trim() !== "") {
      user = e.target.user.value.trim();
    }
    if (e.target.receipt.value.trim() !== "") {
      receipt = e.target.receipt.value.trim();
    }

    setReportsLoading(true);
    setSearchOpen(false);

    const reports = await api.filterReports(
      dateFrom,
      dateTo,
      id,
      receipt,
      user,
      request,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setSearchObj({
      dateFrom: dateFrom,
      dateTo: dateTo,
      id: id,
      receipt: receipt,
      user: user,
      request: request,
    });

    setReportsLoading(false);

    if (reports) {
      setPageCount(reports.pageCount);
      setReports(reports.reports);
    }
  };

  const applySortingFilters = async () => {
    let orderBy = getReportOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    setReportsLoading(true);

    const reports = await api.filterReports(
      searchObj.dateFrom,
      searchObj.dateTo,
      searchObj.id,
      searchObj.receipt,
      searchObj.user,
      searchObj.request,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setReportsLoading(false);

    if (reports) {
      setPageCount(reports.pageCount);
      setReports(reports.reports);
    }
  };

  const openModal = async (reportId) => {
    setModalOpen(true);

    let report = await api.getReport(reportId);

    if (report) {
      if (user.role === "REGULAR" && report.closed && !report.seen) {
        report = await api.setReportSeen(reportId);
        applySortingFilters();
      }
      setModalReport(report);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setModalReport({});
    setDeletionOpen(false);
  };

  const sendResponse = async (e) => {
    e.preventDefault();

    if (e.target.repmsg.value.trim() === "") {
      setResponseValidation("Polje ne sme biti prazno!");
      return;
    } else if (e.target.repmsg.value.trim().length < 10) {
      setResponseValidation("Polje mora sadržati bar 10 karaktera!");
      return;
    }

    const report = {
      date: modalReport.date,
      request: modalReport.request,
      response: e.target.repmsg.value.trim(),
      closed: true,
      seen: false,
      receipt: modalReport.receipt,
      user: modalReport.user,
    };

    await api.updateReport(modalReport.id, report);
    setResponseOpen(false);
    setModalOpen(false);
    setResponseValidation("");
    applySortingFilters();
    setToast({
      title: "Uspešno",
      text: "Odgovor na prijavu je uspešno poslat.",
    });
    openToast();
  };

  const deleteReport = async (id) => {
    await api.deleteReport(id);
    applySortingFilters();
    setDeletionOpen(false);
    setModalOpen(false);
    setToast({
      title: "Uspešno",
      text: "Prijava je uspešno obrisana.",
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
        <div className="reports">
          <TypeAnimation
            className="text-animator text-animator--fast pt-1 pb-3"
            sequence={[`Pregled prijava`]}
            wrapper="h1"
            speed={10}
            cursor={false}
          />
          <div className="reports__search mb-1">
            <div
              className={
                searchOpen
                  ? user.role !== "REGULAR"
                    ? "reports__search-wrapper reports__search-wrapper--open reports__search-wrapper--special"
                    : "reports__search-wrapper reports__search-wrapper--open"
                  : user.role !== "REGULAR"
                  ? "reports__search-wrapper reports__search-wrapper--special"
                  : "reports__search-wrapper"
              }
            >
              <h2
                className="reports__search-title pb-2"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                Pretraga <i className="arrow arrow--down"></i>
              </h2>
              <form className="reports__search-fields" onSubmit={applyFilters}>
                <div className="reports__search-fields-wrapper">
                  <FormGroup name="id" text="ID" type="number" inline={true} />
                  <FormGroup
                    name="request"
                    text="Tekst prijave"
                    type="text"
                    inline={true}
                  />
                  <FormGroup
                    name="receipt"
                    text="ID računa"
                    type="number"
                    inline={true}
                  />
                  {user.role !== "REGULAR" && (
                    <FormGroup
                      name="user"
                      text="Korisnik"
                      type="text"
                      inline={true}
                    />
                  )}
                  <div className="reports__search-date-wrapper">
                    <span className="reports__search-lbl">Datum od</span>
                    <DatePicker
                      selected={fromDate}
                      onChange={(date) => setFromDate(date)}
                      selectsStart
                      startDate={fromDate}
                      endDate={toDate}
                      dateFormat="d/MM/yyyy"
                    />
                  </div>
                  <div className="reports__search-date-wrapper">
                    <span className="reports__search-lbl">Datum do</span>
                    <DatePicker
                      selected={toDate}
                      onChange={(date) => setToDate(date)}
                      selectsEnd
                      startDate={fromDate}
                      endDate={toDate}
                      minDate={fromDate}
                      dateFormat="d/MM/yyyy"
                    />
                  </div>
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
          <div className="reports__sort mb-3">
            <h4 className="reports__sort-title">Sortiraj po: </h4>
            <div className="reports__sort-wrapper">
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
          {reportsLoading ? (
            <div className="reports__items-empty">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : reports.length === 0 ? (
            <div className="reports__items-no-results">
              <h4>Nije pronađena nijedna prijava.</h4>
            </div>
          ) : (
            <div className="reports__items">
              {reports &&
                reports.map((report) => {
                  return (
                    <ReportCard
                      key={report.id}
                      id={report.id}
                      date={report.date}
                      request={report.request}
                      closed={report.closed}
                      seen={report.seen}
                      receipt={report.receipt}
                      userId={report.user}
                      openModal={openModal}
                    />
                  );
                })}
            </div>
          )}
          {pageNumbers && !reportsLoading && pageCount > 1 && (
            <Paginator
              pageNumbers={pageNumbers}
              activePage={pageNum}
              path="/prijave"
            />
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="modal" style={{ minHeight: `${documentHeight}px` }}>
          {modalReport.request ? (
            <div className="modal__content">
              <Report reportInfo={modalReport} />
              {!modalReport.response && (
                <>
                  {user.role === "REGULAR" ? (
                    <div className="modal__options modal__options--single">
                      {!deletionOpen ? (
                        <button
                          className="btn btn-primary btn-primary--red btn-round"
                          onClick={() => setDeletionOpen(true)}
                        >
                          Obriši prijavu
                        </button>
                      ) : (
                        <div className="modal__deletion">
                          <h4 className="modal__deletion-title">
                            Brisanje prijave
                          </h4>
                          <p className="modal__deletion-text">
                            Da li ste sigurni da želite da obrišete prijavu?
                          </p>
                          <div className="modal__deletion-btn-group">
                            <button
                              className="btn btn-primary btn-primary--gray btn-round"
                              onClick={() => setDeletionOpen(false)}
                            >
                              Odustani
                            </button>
                            <button
                              className="btn btn-primary btn-primary--red btn-round"
                              onClick={() => deleteReport(modalReport.id)}
                            >
                              Obriši
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="modal__options modal__options--single">
                      {!responseOpen ? (
                        <button
                          className="btn btn-primary btn-primary--yellow btn-round"
                          onClick={() => setResponseOpen(true)}
                        >
                          Odgovori na prijavu
                        </button>
                      ) : (
                        <div className="modal__deletion">
                          <h4 className="modal__deletion-title">
                            Odgovor na prijavu
                          </h4>
                          <form
                            className="report__form"
                            onSubmit={sendResponse}
                          >
                            <textarea
                              className="report__form-field"
                              name="repmsg"
                              id="repmsg"
                              placeholder="Ukratko odgovorite na prijavu..."
                            ></textarea>
                            <span
                              className={
                                responseValidation === ""
                                  ? "d-none"
                                  : "form__error report__form-error"
                              }
                            >
                              {responseValidation}
                            </span>
                            <button
                              className="btn btn-primary btn-primary--gray btn-round report__form-btn"
                              onClick={() => {
                                setResponseOpen(false);
                                setResponseValidation("");
                              }}
                            >
                              Odustani
                            </button>
                            <button
                              className="btn btn-primary btn-primary--yellow btn-round report__form-btn"
                              type="submit"
                            >
                              Odgovori
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
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

export default Reports;
