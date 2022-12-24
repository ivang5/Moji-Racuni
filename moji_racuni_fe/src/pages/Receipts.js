import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import ReceiptCard from "../components/ReceiptCard";
import useApi from "../utils/useApi";
import {
  getTenYearsAgo,
  dateBEFormatter,
  getReceiptOrderCode,
  getPageNumberList,
} from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";
import Paginator from "../components/Paginator";

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Datum");
  const [sortType, setSortType] = useState("Opadajuće");
  const [searchObj, setSearchObj] = useState({
    dateFrom: dateBEFormatter(fromDate),
    dateTo: dateBEFormatter(toDate),
    unit: "%",
    tin: "%",
    priceFrom: 0,
    priceTo: 9999999,
  });
  const sortByOptions = ["Datum", "Prodavnica", "PIB", "Cena", "PDV"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();

  useEffect(() => {
    applySortingFilters();
  }, [sortBy, sortType]);

  useEffect(() => {
    const pageNumbers = getPageNumberList(pageCount, activePage);
    setPageNumbers(pageNumbers, activePage);
    applySortingFilters();
    window.scrollTo(0, 0);
  }, [activePage]);

  useEffect(() => {
    const pageNumbers = getPageNumberList(pageCount, activePage);
    setPageNumbers(pageNumbers, activePage);
  }, [pageCount]);

  const applyFilters = async (e) => {
    e.preventDefault();
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let unit = "%";
    let tin = "%";
    let priceFrom = 0;
    let priceTo = 9999999;
    let orderBy = getReceiptOrderCode(sortBy);
    const ascendingOrder = sortType === "Opadajuće" ? "desc" : "asc";

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
      unit,
      tin,
      priceFrom,
      priceTo,
      orderBy,
      ascendingOrder,
      activePage
    );

    setSearchObj({
      dateFrom: dateFrom,
      dateTo: dateTo,
      unit: unit,
      tin: tin,
      priceFrom: priceFrom,
      priceTo: priceTo,
    });

    setReceiptsLoading(false);

    if (receipts) {
      setPageCount(receipts.pageCount);
      setActivePage(receipts.pageNum);
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
      searchObj.unit,
      searchObj.tin,
      searchObj.priceFrom,
      searchObj.priceTo,
      orderBy,
      ascendingOrder,
      activePage
    );

    setReceiptsLoading(false);

    if (receipts) {
      setPageCount(receipts.pageCount);
      setActivePage(receipts.pageNum);
      setReceipts(receipts.receipts);
    }
  };

  return (
    <div className="l-container">
      <div className="receipts">
        <TypeAnimation
          className="text-animator text-animator--fast pt-1 pb-3"
          sequence={[`Pregled računa:`]}
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
                    link={receipt.link}
                    totalPrice={receipt.totalPrice}
                    totalVat={receipt.totalVat}
                    companyUnitId={receipt.companyUnit}
                  />
                );
              })}
          </div>
        )}
        {pageNumbers && !receiptsLoading && pageCount > 1 && (
          <Paginator
            pageNumbers={pageNumbers}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        )}
      </div>
    </div>
  );
};

export default Receipts;
