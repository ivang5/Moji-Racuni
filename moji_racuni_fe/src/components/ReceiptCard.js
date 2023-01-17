import React, { useEffect, useState } from "react";
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
  const api = useApi();

  useEffect(() => {
    getCompanyUnit();
  }, []);

  const getCompanyUnit = async () => {
    const companyUnit = await api.getUnit(companyUnitId);
    setCompanyUnit(companyUnit);
  };

  return (
    <>
      {companyUnit && (
        <div
          className="receipt-card"
          onClick={() => {
            openModal(id);
            window.scrollTo(0, 0);
          }}
        >
          <div className="receipt-card__head-wrapper">
            <span className="receipt-card__date">
              {dateTimeFormatter(date)}
            </span>
            <h6 className="receipt-card__id">Račun #{id}</h6>
            <h5 className="receipt-card__unit">{companyUnit.name}</h5>
            <span className="receipt-card__tin">{companyUnit.company}</span>
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
      )}
    </>
  );
};

export default ReceiptCard;
