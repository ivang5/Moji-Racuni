import React, { useEffect, useRef, useState } from "react";
import useApi from "../utils/useApi";
import { dateTimeFormatter, formatPrice } from "../utils/utils";

const ReceiptCard = ({
  id,
  date,
  totalPrice,
  totalVat,
  companyUnitId,
  openModal,
}) => {
  const [companyUnit, setCompanyUnit] = useState({});
  const [itemsCount, setItemsCount] = useState(0);
  const api = useApi();
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    const loadReceiptCardData = async () => {
      const [unit, items] = await Promise.all([
        apiRef.current.getUnit(companyUnitId),
        apiRef.current.getItems(id),
      ]);
      setCompanyUnit(unit);
      setItemsCount(items.length);
    };

    loadReceiptCardData();
  }, [companyUnitId, id]);

  return (
    <>
      {companyUnit && itemsCount ? (
        <div className="receipt-card" onClick={() => openModal(id)}>
          <div className="receipt-card__head-wrapper">
            <span className="receipt-card__date">
              {dateTimeFormatter(date)}
            </span>
            <h6 className="receipt-card__id">Račun #{id}</h6>
            <h5 className="receipt-card__unit">{companyUnit.name}</h5>
            <span className="receipt-card__tin">{companyUnit.company}</span>
            <div className="receipt-card__items-count mt-2">
              Broj stavki: {itemsCount}
            </div>
          </div>
          <div className="receipt-card__price-wrapper">
            <div className="receipt-card__price">
              <span className="receipt-card__price-text">Ukupno:</span>
              <span className="receipt-card__price-number">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="receipt-card__price">
              <span className="receipt-card__price-text">PDV:</span>
              <span className="receipt-card__price-number">
                {formatPrice(totalVat)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default ReceiptCard;
