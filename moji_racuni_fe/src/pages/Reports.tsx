import React, { useCallback, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
import {
  getTenYearsAgo,
  dateBEFormatter,
  getReportOrderCode,
  getTomorrow,
} from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import ReportCard from "../components/ReportCard";
import Report from "../components/Report";
import useToast from "../hooks/useToast";
import usePaginatedListState from "../hooks/usePaginatedListState";
import useModalDismiss from "../hooks/useModalDismiss";
import useRoutePageParam from "../hooks/useRoutePageParam";
import usePaginatedSortingFetch from "../hooks/usePaginatedSortingFetch";
import useAuthUser from "../hooks/useAuthUser";
import type { ReportInfoView, ReportListItemView } from "../types/viewModels";

type ReportSearch = {
  dateFrom: string;
  dateTo: string;
  id: string;
  receipt: string;
  user: string;
  request: string;
};

type ReportFilterForm = HTMLFormElement & {
  id: HTMLInputElement;
  request: HTMLInputElement;
  receipt: HTMLInputElement;
  user?: HTMLInputElement;
};

type ResponseForm = HTMLFormElement & {
  repmsg: HTMLTextAreaElement;
};

const Reports = () => {
  const { page } = useParams();
  const [reports, setReports] = useState<ReportListItemView[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReport, setModalReport] = useState<Partial<ReportListItemView>>(
    {},
  );
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseValidation, setResponseValidation] = useState("");
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(getTomorrow());

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
    initialSortBy: "Datum",
    initialSortType: "Opadajuće",
    initialSearchObj: {
      dateFrom: dateBEFormatter(getTenYearsAgo()),
      dateTo: dateBEFormatter(getTomorrow()),
      id: "%",
      receipt: "%",
      user: "%",
      request: "%",
    },
  });

  const { toast, toastOpen, showToast, closeToast } = useToast(7000);

  const sortByOptions = ["Datum", "Status"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();
  const { userRole } = useAuthUser();
  const navigate = useNavigate();

  const fetchSortedPage = useCallback(
    async ({ api, searchObj, orderBy, ascendingOrder, pageNum }) => {
      const filters = searchObj as ReportSearch;
      const reports = await api.filterReports(
        filters.dateFrom,
        filters.dateTo,
        filters.id,
        filters.receipt,
        filters.user,
        filters.request,
        orderBy,
        ascendingOrder,
        pageNum,
      );

      if (!reports) {
        return null;
      }

      return {
        pageCount: reports.pageCount,
        items: reports.reports,
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
    getOrderBy: getReportOrderCode,
    fetchSortedPage,
    setLoading: setReportsLoading,
    setPageCount,
    setItems: setReports,
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
    const form = e.currentTarget as ReportFilterForm;
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let id = "%";
    let receipt = "%";
    let user = "%";
    let request = "%";
    let orderBy = getReportOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (form.id.value !== "") {
      id = form.id.value;
    }
    if (form.request.value.trim() !== "") {
      request = form.request.value.trim();
    }
    if (form.user && form.user.value.trim() !== "") {
      user = form.user.value.trim();
    }
    if (form.receipt.value.trim() !== "") {
      receipt = form.receipt.value.trim();
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
      pageNum,
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

  const openModal = async (reportId: number) => {
    setModalOpen(true);

    let report = (await api.getReport(reportId)) as ReportListItemView | null;

    if (report) {
      if (userRole === "REGULAR" && report.closed && !report.seen) {
        report = await api.setReportSeen(reportId);
        applySortingFilters();
      }
      setModalReport(report);
      document.body.style.overflowY = "hidden";
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setModalReport({});
    setDeletionOpen(false);
    document.body.style.overflow = "auto";
  };

  const sendResponse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as ResponseForm;

    if (form.repmsg.value.trim() === "") {
      setResponseValidation("Polje ne sme biti prazno!");
      return;
    } else if (form.repmsg.value.trim().length < 10) {
      setResponseValidation("Polje mora sadržati bar 10 karaktera!");
      return;
    }

    if (!modalReport.id) {
      return;
    }

    const report = {
      date: modalReport.date,
      request: modalReport.request,
      response: form.repmsg.value.trim(),
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
    showToast({
      title: "Uspešno",
      text: "Odgovor na prijavu je uspešno poslat.",
    });
  };

  const deleteReport = async (id: number) => {
    await api.deleteReport(id);
    applySortingFilters();
    setDeletionOpen(false);
    setModalOpen(false);
    showToast({
      title: "Uspešno",
      text: "Prijava je uspešno obrisana.",
    });
  };

  useModalDismiss(resetModal);

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
                  ? userRole !== "REGULAR"
                    ? "reports__search-wrapper reports__search-wrapper--open reports__search-wrapper--special"
                    : "reports__search-wrapper reports__search-wrapper--open"
                  : userRole !== "REGULAR"
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
                  {userRole !== "REGULAR" && (
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
                      onChange={(date) => {
                        if (date) {
                          setFromDate(date);
                        }
                      }}
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
                      onChange={(date) => {
                        if (date) {
                          setToDate(date);
                        }
                      }}
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
              {reports.map((report) => {
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
        <div className="modal">
          {modalReport.request ? (
            <div className="modal__content">
              <Report reportInfo={modalReport as ReportInfoView} />
              {!modalReport.response && (
                <>
                  {userRole === "REGULAR" ? (
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
