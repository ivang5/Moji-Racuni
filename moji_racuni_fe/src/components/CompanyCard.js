import React, { useEffect, useState } from "react";
import useApi from "../utils/useApi";
import ImgPlaceholder from "../icons/placeholder-icon.svg";

const CompanyCard = ({ tin, name, image, openModal }) => {
  const [companyVisits, setCompanyVisits] = useState(0);
  const [companyType, setCompanyType] = useState({});
  const api = useApi();

  useEffect(() => {
    getCompanyType();
    getCompanyVisits();
  }, []);

  const getCompanyType = async () => {
    const type = await api.getTypeForCompany(tin);
    setCompanyType(type);
  };

  const getCompanyVisits = async () => {
    const visits = await api.getCompanyVisits(tin);
    setCompanyVisits(visits.visits);
  };

  return (
    <div
      className="company-card"
      onClick={() => {
        openModal(tin);
        window.scrollTo(0, 0);
      }}
    >
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
      {companyType && (
        <span className="company-card__type">{companyType.name}</span>
      )}
      <div className="company-card__visits">Broj poseta: {companyVisits}</div>
    </div>
  );
};

export default CompanyCard;
