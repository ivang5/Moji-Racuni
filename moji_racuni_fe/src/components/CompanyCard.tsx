import React from "react";
import ImgPlaceholder from "../icons/placeholder-icon.svg";
import type { CompanyListItemView } from "../types/viewModels";
import useCompanyCardMetaQuery from "../hooks/queries/useCompanyCardMetaQuery";

type CompanyCardProps = CompanyListItemView & {
  openModal: (tin: string) => void;
};

const CompanyCard = ({ tin, name, image, openModal }: CompanyCardProps) => {
  const { data } = useCompanyCardMetaQuery(tin);
  const companyType = data?.companyType;
  const companyTypeName = companyType?.name?.trim();
  const companyVisits = data?.companyVisits ?? 0;

  return (
    <div className="company-card" onClick={() => openModal(tin)}>
      <div className="company-card__head-wrapper">
        <h5 className="company-card__name">{name}</h5>
        <span className="company-card__tin">{tin}</span>
      </div>
      <img
        className={
          image
            ? "company-card__img company-card__img--logo"
            : "company-card__img"
        }
        src={
          image
            ? `${process.env.REACT_APP_BASE_URL}/media/${image}`
            : ImgPlaceholder
        }
        alt="logo preduzeća"
      />
      {companyTypeName && (
        <span className="company-card__type">{companyTypeName}</span>
      )}
      <div className="company-card__visits">Broj poseta: {companyVisits}</div>
    </div>
  );
};

export default CompanyCard;
