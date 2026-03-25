import React from "react";
import { dateTimeFormatter, formatPrice } from "../utils/utils";
import type { ReceiptListItemView } from "../types/viewModels";
import useReceiptCardMetaQuery from "../hooks/queries/useReceiptCardMetaQuery";

type ReceiptCardProps = Pick<
  ReceiptListItemView,
  "id" | "date" | "totalPrice" | "totalVat"
> & {
  companyUnitId: ReceiptListItemView["companyUnit"];
  openModal: (id: number) => void;
};

const ReceiptCard = ({
  id,
  date,
  totalPrice,
  totalVat,
  companyUnitId,
  openModal,
}: ReceiptCardProps) => {
  const { data } = useReceiptCardMetaQuery(companyUnitId, id);
  const companyUnit = data?.companyUnit;
  const itemsCount = data?.itemsCount ?? 0;

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
