import React, { useContext, useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import ReceiptCard from "../components/ReceiptCard";
import useApi from "../utils/useApi";
import {
  getTenYearsAgo,
  dateBEFormatter,
  dateTimeBEFormatter,
  getReceiptOrderCode,
  getPageNumberList,
  getTomorrow,
} from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";
import Receipt from "../components/Receipt";
import Toast from "../components/Toast";
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Receipts = () => {
  const { page } = useParams();
  const [pageNum, setPageNum] = useState(1);
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReceipt, setModalReceipt] = useState({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportValidation, setReportValidation] = useState("");
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
    unit: "%",
    tin: "%",
    priceFrom: 0,
    priceTo: 9999999,
  });
  const sortByOptions = ["Datum", "Prodavnica", "PIB", "Cena", "PDV"];
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
  }, [receipts]);

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
    let unit = "%";
    let tin = "%";
    let priceFrom = 0;
    let priceTo = 9999999;
    let orderBy = getReceiptOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    if (e.target.id.value !== "") {
      id = e.target.id.value;
    }
    if (e.target.unit.value.trim() !== "") {
      unit = e.target.unit.value.trim();
    }
    if (e.target.tin.value.trim() !== "") {
      tin = e.target.tin.value.trim();
    }
    if (e.target.priceFrom.value !== "") {
      priceFrom = e.target.priceFrom.value;
    }
    if (e.target.priceTo.value !== "") {
      priceTo = e.target.priceTo.value;
    }

    setReceiptsLoading(true);
    setSearchOpen(false);

    const receipts = await api.filterReceipts(
      dateFrom,
      dateTo,
      id,
      unit,
      tin,
      priceFrom,
      priceTo,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setSearchObj({
      dateFrom: dateFrom,
      dateTo: dateTo,
      id: id,
      unit: unit,
      tin: tin,
      priceFrom: priceFrom,
      priceTo: priceTo,
    });

    setReceiptsLoading(false);

    if (receipts) {
      setPageCount(receipts.pageCount);
      setReceipts(receipts.receipts);
    }
  };

  const applySortingFilters = async () => {
    let orderBy = getReceiptOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

    setReceiptsLoading(true);

    const receipts = await api.filterReceipts(
      searchObj.dateFrom,
      searchObj.dateTo,
      searchObj.id,
      searchObj.unit,
      searchObj.tin,
      searchObj.priceFrom,
      searchObj.priceTo,
      orderBy,
      ascendingOrder,
      pageNum
    );

    setReceiptsLoading(false);

    if (receipts) {
      setPageCount(receipts.pageCount);
      setReceipts(receipts.receipts);
    }
  };

  const openModal = async (receiptId) => {
    setModalOpen(true);

    const receipt = await api.getFullReceiptInfo(receiptId);

    if (receipt) {
      setModalReceipt(receipt);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setModalReceipt({});
    setReportOpen(false);
    setDeletionOpen(false);
    setReportValidation("");
  };

  const sendReport = async (e) => {
    e.preventDefault();

    if (e.target.repmsg.value.trim() === "") {
      setReportValidation("Polje za opis ne sme biti prazno!");
      return;
    } else if (e.target.repmsg.value.trim().length < 10) {
      setReportValidation("Opis mora sadržati bar 10 karaktera!");
      return;
    }

    const date = new Date();
    const formattedDate = dateTimeBEFormatter(date);

    const report = {
      date: formattedDate,
      receipt: modalReceipt.receipt.id,
      request: e.target.repmsg.value.trim(),
    };

    await api.createReport(report);
    setReportOpen(false);
    setModalOpen(false);
    setReportValidation("");
    setToast({
      title: "Uspešno",
      text: "Prijava je uspešno poslata.",
    });
    openToast();
  };

  const deleteReceipt = async (id) => {
    await api.deleteReceipt(id);
    applySortingFilters();
    setDeletionOpen(false);
    setModalOpen(false);
    setToast({
      title: "Uspešno",
      text: "Račun je uspešno obrisan.",
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
                    text="Prodajno mesto"
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
                      onChange={(date) => setFromDate(date)}
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
                  className="btn btn-primary btn-primary--black btn-round mb-2"
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
              {receipts &&
                receipts.map((receipt) => {
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
        <div className="modal" style={{ minHeight: `${documentHeight}px` }}>
          {modalReceipt.receipt ? (
            <div className="modal__content">
              <Receipt receiptInfo={modalReceipt} />
              {user.role === "REGULAR" && (
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
                              onClick={() =>
                                deleteReceipt(modalReceipt.receipt.id)
                              }
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
