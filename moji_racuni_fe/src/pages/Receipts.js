import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import ReceiptCard from "../components/ReceiptCard";
import useApi from "../utils/useApi";
import { getTenYearsAgo, dateBEFormatter } from "../utils/utils";
import DatePicker from "react-datepicker";
import Dropdown from "react-dropdown";
import FormGroup from "../components/FormGroup";

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Datum");
  const [sortType, setSortType] = useState("Opadajuće");
  const sortByOptions = ["Datum", "Prodavnica", "PIB", "Cena", "PDV"];
  const sortTypeOptions = ["Rastuće", "Opadajuće"];
  const api = useApi();

  useEffect(() => {
    getReceipts();
  }, []);

  const getReceipts = async () => {
    const receipts = await api.getReceipts();
    setReceipts(receipts);
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    const dateFrom = dateBEFormatter(fromDate);
    const dateTo = dateBEFormatter(toDate);
    let unit = "%";
    let tin = "%";
    let priceFrom = 0;
    let priceTo = 9999999;
    let orderBy;
    switch (sortBy) {
      case "Datum":
        orderBy = "r.date";
        break;
      case "Prodavnica":
        orderBy = "u.name";
        break;
      case "PIB":
        orderBy = "u.company";
        break;
      case "Cena":
        orderBy = "r.totalPrice";
        break;
      case "PDV":
        orderBy = "r.totalVat";
        break;
      default:
        orderBy = "r.date";
        break;
    }
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

    const receipts = await api.filterReceipts(
      dateFrom,
      dateTo,
      unit,
      tin,
      priceFrom,
      priceTo,
      orderBy,
      ascendingOrder
    );

    setReceipts(receipts);
  };

  return (
    <div className="l-container">
      <div className="receipts">
        <TypeAnimation
          className="text-animator text-animator--fast pt-1 pb-3"
          sequence={[`Vaši računi:`]}
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
        <div className="receipts__items">
          {receipts.map((receipt) => {
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
      </div>
    </div>
  );
};

export default Receipts;
