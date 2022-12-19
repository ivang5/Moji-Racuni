import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import ReceiptCard from "../components/ReceiptCard";
import useApi from "../utils/useApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormGroup from "../components/FormGroup";

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const api = useApi();

  useEffect(() => {
    getReceipts();
  }, []);

  const getReceipts = async () => {
    const receipts = await api.getReceipts();
    setReceipts(receipts);
  };

  const searchReceipts = async () => {
    const receipts = await api.getReceipts();
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
        <div className="receipts__search mb-3">
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
            <form className="receipts__search-fields" onSubmit={searchReceipts}>
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
              <button className="btn btn-primary btn-round mb-2" type="submit">
                Pretraži
              </button>
            </form>
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
