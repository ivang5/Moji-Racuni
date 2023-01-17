import React, { useContext, useEffect, useRef, useState } from "react";
import Dropdown from "react-dropdown";
import ImgPlaceholder from "../icons/placeholder-icon.svg";
import EditIcon from "../icons/edit-icon.svg";
import AuthContext from "../context/AuthContext";
import { BASE_URL } from "../utils/utils";

const Company = ({
  companyInfo,
  changeCompanyImg,
  companyTypes,
  changeCompanyType,
}) => {
  const [companyTypeOption, setCompanyTypeOption] = useState(
    companyInfo.type && companyInfo.type.name
  );
  let companyTypeOptions = ["Bez tipa"];
  const { user } = useContext(AuthContext);
  const imgInput = useRef();
  const firstUpdate = useRef(true);

  companyTypes.forEach((type) => {
    companyTypeOptions.push(type.name);
  });

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    if (companyTypeOption) {
      const selectedType =
        companyTypeOption === "Bez tipa"
          ? "none"
          : companyTypes.find((type) => type.name === companyTypeOption).id;
      changeCompanyType(selectedType);
    }
  }, [companyTypeOption]);

  const handleClick = () => {
    user.role !== "REGULAR" && imgInput.current.click();
  };

  return (
    <div className="company">
      {companyInfo.company && (
        <>
          <h4 className="company__title">
            {companyInfo.company.name} - {companyInfo.company.tin}
          </h4>
          <div className="company__body">
            <div
              className={
                user.role === "REGULAR"
                  ? "company__img-wrapper"
                  : "company__img-wrapper company__img-wrapper--editable"
              }
              onClick={handleClick}
            >
              <input
                className="company__img-input"
                type="file"
                ref={imgInput}
                onChange={(e) => {
                  changeCompanyImg(e);
                }}
              />
              <img
                className={
                  companyInfo.company.image
                    ? "company__img company__img--logo"
                    : "company__img"
                }
                src={
                  companyInfo.company.image
                    ? `${BASE_URL}${companyInfo.company.image}`
                    : ImgPlaceholder
                }
                alt="logo preduzeća"
              />
              {user.role !== "REGULAR" && (
                <img
                  className="company__img-icon"
                  src={EditIcon}
                  alt="edit image"
                />
              )}
            </div>
            <div className="fw-bold t-center mb-2">
              Broj poseta: {companyInfo.visits.visits}
            </div>
            <div className="company__type-wrapper">
              <span className="company__type-text">Tip: </span>
              <Dropdown
                options={companyTypeOptions}
                onChange={(value) => setCompanyTypeOption(value.value)}
                value={
                  companyInfo.type
                    ? companyInfo.type.name
                    : companyTypeOptions[0]
                }
                placeholder="Izaberite opciju"
              />
            </div>
            <h5 className="pt-1">Prodajna mesta:</h5>
            <ul className="company__units">
              {companyInfo.units.map((unit) => (
                <li key={unit.id} className="company__unit">
                  <h6 className="company__unit-title">
                    #{unit.id} - {unit.name}
                  </h6>
                  <p className="company__unit-address">
                    <span className="fw-bold">Adresa:</span> {unit.address},{" "}
                    {unit.place} ({unit.municipality})
                  </p>
                  <div className="company__unit-category">
                    <span className="fw-bold">Kategorija:</span> {unit.category}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Company;
