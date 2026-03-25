import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import ReceiptCard from "../components/ReceiptCard";
import {
  getTenYearsAgo,
  dateBEFormatter,
  dateTimeBEFormatter,
  getReceiptOrderCode,
  getTomorrow,
} from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Receipt from "../components/Receipt";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import usePaginatedListState from "../hooks/usePaginatedListState";
import useModalDismiss from "../hooks/useModalDismiss";
import useRoutePageParam from "../hooks/useRoutePageParam";
import useAuthUser from "../hooks/useAuthUser";
import useReceiptsListQuery from "../hooks/queries/useReceiptsListQuery";
import useFullReceiptInfoQuery from "../hooks/queries/useFullReceiptInfoQuery";
import useDeleteReceiptMutation from "../hooks/mutations/useDeleteReceiptMutation";
import useCreateReportMutation from "../hooks/mutations/useCreateReportMutation";

type ReceiptFilterForm = HTMLFormElement & {
  id: HTMLInputElement;
  unit: HTMLInputElement;
  tin: HTMLInputElement;
  priceFrom: HTMLInputElement;
  priceTo: HTMLInputElement;
};

type ReportForm = HTMLFormElement & {
  repmsg: HTMLTextAreaElement;
};

const Receipts = () => {
  const { page } = useParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportValidation, setReportValidation] = useState("");
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
      unit: "%",
      tin: "%",
      priceFrom: 0,
      priceTo: 9999999,
    },
  });

  const { toast, toastOpen, showToast, closeToast } = useToast(7000);

  const sortByOptions = ["Datum", "Prodavnica", "PIB", "Cena", "PDV"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const { userRole } = useAuthUser();
  const navigate = useNavigate();
  const orderBy = getReceiptOrderCode(sortBy);
  const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

  const { data, isFetching } = useReceiptsListQuery({
    dateFrom: searchObj.dateFrom,
    dateTo: searchObj.dateTo,
    id: searchObj.id,
    unit: searchObj.unit,
    tin: searchObj.tin,
    priceFrom: searchObj.priceFrom,
    priceTo: searchObj.priceTo,
    orderBy,
    ascendingOrder,
    pageNum,
  });
  const { mutateAsync: deleteReceiptMutation } = useDeleteReceiptMutation();
  const { mutateAsync: createReportMutation } = useCreateReportMutation();

  const receipts = data?.receipts || [];
  const receiptsLoading = isFetching;
  const { data: modalReceipt } = useFullReceiptInfoQuery(selectedReceiptId);

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
    const form = e.currentTarget as ReceiptFilterForm;
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let id = "%";
    let unit = "%";
    let tin = "%";
    let priceFrom = 0;
    let priceTo = 9999999;

    if (form.id.value !== "") {
      id = form.id.value;
    }
    if (form.unit.value.trim() !== "") {
      unit = form.unit.value.trim();
    }
    if (form.tin.value.trim() !== "") {
      tin = form.tin.value.trim();
    }
    if (form.priceFrom.value !== "") {
      priceFrom = Number(form.priceFrom.value);
    }
    if (form.priceTo.value !== "") {
      priceTo = Number(form.priceTo.value);
    }

    setSearchOpen(false);

    setSearchObj({
      dateFrom: dateFrom,
      dateTo: dateTo,
      id: id,
      unit: unit,
      tin: tin,
      priceFrom: priceFrom,
      priceTo: priceTo,
    });
  };

  const openModal = (receiptId: number) => {
    setModalOpen(true);
    setSelectedReceiptId(receiptId);
    document.body.style.overflowY = "hidden";
  };

  const resetModal = () => {
    setModalOpen(false);
    setSelectedReceiptId(null);
    setReportOpen(false);
    setDeletionOpen(false);
    setReportValidation("");
    document.body.style.overflow = "auto";
  };

  const sendReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as ReportForm;

    if (form.repmsg.value.trim() === "") {
      setReportValidation("Polje za opis ne sme biti prazno!");
      return;
    } else if (form.repmsg.value.trim().length < 10) {
      setReportValidation("Opis mora sadržati bar 10 karaktera!");
      return;
    }

    if (!modalReceipt?.receipt) {
      return;
    }

    const currentReceipt = modalReceipt.receipt;

    const date = new Date();
    const formattedDate = dateTimeBEFormatter(date);

    const report = {
      date: formattedDate,
      receipt: currentReceipt.id,
      request: form.repmsg.value.trim(),
    };

    await createReportMutation(report);
    setReportOpen(false);
    setModalOpen(false);
    setReportValidation("");
    showToast({
      title: "Uspešno",
      text: "Prijava je uspešno poslata.",
    });
  };

  const deleteReceipt = async (id: number) => {
    await deleteReceiptMutation(id);
    setDeletionOpen(false);
    setModalOpen(false);
    showToast({
      title: "Uspešno",
      text: "Račun je uspešno obrisan.",
    });
  };

  useModalDismiss(resetModal);

  return (
    <div>
      <div className="l-container">
        <div className="receipts">
          <TypeAnimation
            className="text-animator text-animator--fast pt-1 pb-3"
            sequence={[`Pregled računa`]}
            wrapper="h1"
            speed={10}
            cursor={false}
          />
          <div className="receipts__search mb-1">
            <div
              className={
                searchOpen
                  ? "receipts__search-wrapper receipts__search-wrapper--open"
                  : "receipts__search-wrapper"
              }
            >
              <h2
                className="receipts__search-title pb-2"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                Pretraga <i className="arrow arrow--down"></i>
              </h2>
              <form className="receipts__search-fields" onSubmit={applyFilters}>
                <div className="receipts__search-fields-wrapper">
                  <FormGroup name="id" text="ID" type="number" inline={true} />
                  <FormGroup
                    name="unit"
                    text="Preduzeće/Prodajno mesto"
                    type="text"
                    inline={true}
                  />
                  <FormGroup name="tin" text="PIB" type="text" inline={true} />
                  <FormGroup
                    name="priceFrom"
                    text="Cena od"
                    type="number"
                    inline={true}
                  />
                  <FormGroup
                    name="priceTo"
                    text="Cena do"
                    type="number"
                    inline={true}
                  />
                  <div className="receipts__search-date-wrapper">
                    <span className="receipts__search-lbl">Datum od</span>
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
                  <div className="receipts__search-date-wrapper">
                    <span className="receipts__search-lbl">Datum do</span>
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
          <div className="receipts__sort mb-3">
            <h4 className="receipts__sort-title">Sortiraj po: </h4>
            <div className="receipts__sort-wrapper">
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
          {receiptsLoading ? (
            <div className="receipts__items-empty">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="receipts__items-no-results">
              <h4>Nije pronađen nijedan račun.</h4>
            </div>
          ) : (
            <div className="receipts__items">
              {receipts.map((receipt) => {
                return (
                  <ReceiptCard
                    key={receipt.id}
                    id={receipt.id}
                    date={receipt.date}
                    totalPrice={receipt.totalPrice}
                    totalVat={receipt.totalVat}
                    companyUnitId={receipt.companyUnit}
                    openModal={openModal}
                  />
                );
              })}
            </div>
          )}
          {pageNumbers && !receiptsLoading && pageCount > 1 && (
            <Paginator
              pageNumbers={pageNumbers}
              activePage={pageNum}
              path="/racuni"
            />
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="modal">
          {modalReceipt?.receipt ? (
            <div className="modal__content">
              <Receipt receiptInfo={modalReceipt} />
              {userRole === "REGULAR" && (
                <div className="modal__options">
                  {!reportOpen && !deletionOpen ? (
                    <>
                      <button
                        className="btn btn-primary btn-primary--yellow btn-round"
                        onClick={() => setReportOpen(true)}
                      >
                        Prijavi nepravilnost
                      </button>
                      <button
                        className="btn btn-primary btn-primary--red btn-round"
                        onClick={() => setDeletionOpen(true)}
                      >
                        Obriši račun
                      </button>
                    </>
                  ) : (
                    <>
                      {reportOpen && (
                        <div className="report">
                          <h4 className="report__title">Prijava računa</h4>
                          <form className="report__form" onSubmit={sendReport}>
                            <textarea
                              className="report__form-field"
                              name="repmsg"
                              id="repmsg"
                              placeholder="Ukratko opišite nepravilnost na računu..."
                            ></textarea>
                            <span
                              className={
                                reportValidation === ""
                                  ? "d-none"
                                  : "form__error report__form-error"
                              }
                            >
                              {reportValidation}
                            </span>
                            <button
                              className="btn btn-primary btn-primary--gray btn-round report__form-btn"
                              onClick={() => {
                                setReportOpen(false);
                                setReportValidation("");
                              }}
                            >
                              Odustani
                            </button>
                            <button
                              className="btn btn-primary btn-primary--yellow btn-round report__form-btn"
                              type="submit"
                            >
                              Prijavi
                            </button>
                          </form>
                        </div>
                      )}
                      {deletionOpen && (
                        <div className="modal__deletion">
                          <h4 className="modal__deletion-title">
                            Brisanje računa
                          </h4>
                          <p className="modal__deletion-text">
                            Da li ste sigurni da želite da obrišete račun?
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
                                if (modalReceipt?.receipt) {
                                  deleteReceipt(modalReceipt.receipt.id);
                                }
                              }}
                            >
                              Obriši
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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

export default Receipts;
