import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
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
import useAuthUser from "../hooks/useAuthUser";
import useReportsListQuery from "../hooks/queries/useReportsListQuery";
import useReportByIdQuery from "../hooks/queries/useReportByIdQuery";
import useSetReportSeenMutation from "../hooks/mutations/useSetReportSeenMutation";
import useUpdateReportMutation from "../hooks/mutations/useUpdateReportMutation";
import useDeleteReportMutation from "../hooks/mutations/useDeleteReportMutation";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseValidation, setResponseValidation] = useState("");
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [seenMarkedReportId, setSeenMarkedReportId] = useState<number | null>(
    null,
  );
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
  const { userRole } = useAuthUser();
  const navigate = useNavigate();
  const orderBy = getReportOrderCode(sortBy);
  const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

  const { data, isFetching } = useReportsListQuery({
    dateFrom: searchObj.dateFrom,
    dateTo: searchObj.dateTo,
    id: searchObj.id,
    receipt: searchObj.receipt,
    user: searchObj.user,
    request: searchObj.request,
    orderBy,
    ascendingOrder,
    pageNum,
  });
  const { mutateAsync: setReportSeenMutation } = useSetReportSeenMutation();
  const { mutateAsync: updateReportMutation } = useUpdateReportMutation();
  const { mutateAsync: deleteReportMutation } = useDeleteReportMutation();
  const { data: modalReport } = useReportByIdQuery(selectedReportId);

  const reports = data?.reports || [];
  const reportsLoading = isFetching;

  useEffect(() => {
    if (data?.pageCount) {
      setPageCount(data.pageCount);
    }
  }, [data?.pageCount, setPageCount]);

  useRoutePageParam({
    page,
    setPageNum,
    navigate,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageNum]);

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as ReportFilterForm;
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let id = "%";
    let receipt = "%";
    let user = "%";
    let request = "%";

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

    setSearchOpen(false);

    setSearchObj({
      dateFrom: dateFrom,
      dateTo: dateTo,
      id: id,
      receipt: receipt,
      user: user,
      request: request,
    });
  };

  useEffect(() => {
    if (
      !modalOpen ||
      !modalReport ||
      userRole !== "REGULAR" ||
      !modalReport.closed ||
      modalReport.seen ||
      seenMarkedReportId === modalReport.id
    ) {
      return;
    }

    setSeenMarkedReportId(modalReport.id);
    void setReportSeenMutation(modalReport.id);
  }, [
    modalOpen,
    modalReport,
    seenMarkedReportId,
    setReportSeenMutation,
    userRole,
  ]);

  const openModal = (reportId: number) => {
    setModalOpen(true);
    setSelectedReportId(reportId);
    setSeenMarkedReportId(null);
    document.body.style.overflowY = "hidden";
  };

  const resetModal = () => {
    setModalOpen(false);
    setSelectedReportId(null);
    setDeletionOpen(false);
    setSeenMarkedReportId(null);
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

    if (!modalReport?.id) {
      return;
    }

    const currentReport = modalReport;

    const report = {
      date: currentReport.date,
      request: currentReport.request,
      response: form.repmsg.value.trim(),
      closed: true,
      seen: false,
      receipt: currentReport.receipt,
      user: currentReport.user,
    };

    await updateReportMutation({ id: currentReport.id, reportInfo: report });
    setResponseOpen(false);
    setModalOpen(false);
    setResponseValidation("");
    showToast({
      title: "Uspešno",
      text: "Odgovor na prijavu je uspešno poslat.",
    });
  };

  const deleteReport = async (id: number) => {
    await deleteReportMutation(id);
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
          {modalReport?.request ? (
            <div className="modal__content">
              <Report reportInfo={modalReport} />
              {!modalReport?.response && (
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
                              onClick={() => {
                                if (modalReport?.id !== undefined) {
                                  deleteReport(modalReport.id);
                                }
                              }}
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
