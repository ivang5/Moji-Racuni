import React from "react";
import { dateTimeFormatter, noDecimalNum, twoDecimalNum } from "../utils/utils";

const Receipt = ({ receiptInfo }) => {
  return (
    <div className="receipt">
      <h4 className="receipt__title">Račun #{receiptInfo.receipt.id}</h4>
      <div className="receipt__body">
        <h5 className="pt-1 t-center">
          {receiptInfo.company.name} - {receiptInfo.company.tin}
        </h5>
        <p className="receipt__date fw-bold">
          {dateTimeFormatter(receiptInfo.receipt.date)}
        </p>
        <ul className="receipt__items pt-1">
          {receiptInfo.items.map((item) => (
            <li key={item.id} className="receipt__item">
              <p>
                {item.name} ({item.measurementUnit}) ({item.vatType}%)
              </p>
              <div className="receipt__item-row">
                <div className="receipt__item-row-pq">
                  <span>{item.price}</span>
                  <span>
                    {" "}
                    (
                    {item.measurementUnit === "KOM"
                      ? noDecimalNum(item.quantity)
                      : item.quantity}
                    )
                  </span>
                </div>
                <span>{twoDecimalNum(item.price * item.quantity)}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="receipt__price pt-1">
          <div className="receipt__price-total fw-bold">
            <span>Ukupno:</span>
            <span>{twoDecimalNum(receiptInfo.receipt.totalPrice)}</span>
          </div>
          <div className="receipt__price-vat fw-bold">
            <span>PDV:</span>
            <span>{twoDecimalNum(receiptInfo.receipt.totalVat)}</span>
          </div>
        </div>
        <a
          className="receipt__link mt-2"
          href={receiptInfo.receipt.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Pogledaj original računa <i className="arrow arrow--right"></i>
        </a>
      </div>
    </div>
  );
};

export default Receipt;
