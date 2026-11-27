import React, { useRef } from "react";
import Dropdown from "react-dropdown";
import ImgPlaceholder from "../icons/placeholder-icon.svg";
import EditIcon from "../icons/edit-icon.svg";
import { formatPrice } from "../utils/utils";
import { API_BASE_URL } from "../config";
import useAuthUser from "../hooks/useAuthUser";
import type { CompanyInfoView, CompanyTypeView } from "../types/viewModels";

type CompanyProps = {
  companyInfo: CompanyInfoView;
  changeCompanyImg: (e: React.ChangeEvent<HTMLInputElement>) => void;
  companyTypes: CompanyTypeView[];
  changeCompanyType: (typeId: number | "none") => void;
};

const Company = ({
  companyInfo,
  changeCompanyImg,
  companyTypes,
  changeCompanyType,
}: CompanyProps) => {
  const companyTypeOptions: string[] = ["Bez tipa"];
  const { userRole } = useAuthUser();
  const imgInput = useRef<HTMLInputElement | null>(null);
  const currentTypeOption = companyInfo.type
    ? companyInfo.type.name
    : companyTypeOptions[0];

  companyTypes.forEach((type) => {
    companyTypeOptions.push(type.name);
  });

  const handleTypeChange = (selectedOption: string) => {
    if (selectedOption === currentTypeOption) {
      return;
    }
    const matchedType = companyTypes.find(
      (type) => type.name === selectedOption,
    );
    const selectedType: number | "none" =
      selectedOption === "Bez tipa" ? "none" : (matchedType?.id ?? "none");
    changeCompanyType(selectedType);
  };

  const handleClick = () => {
    if (userRole !== "REGULAR") {
      imgInput.current?.click();
    }
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
                userRole === "REGULAR"
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
                    ? `${API_BASE_URL}${companyInfo.company.image}`
                    : ImgPlaceholder
                }
                alt="logo preduzeća"
              />
              {userRole !== "REGULAR" && (
                <img className="company__img-icon" src={EditIcon} alt="edit" />
              )}
            </div>
            <div className="fw-bold t-center mb-1">
              Broj poseta: {companyInfo.visits.visits}
            </div>
            <div className="fw-bold t-center mb-2">
              Ukupna potrošnja: {formatPrice(companyInfo.visits.spent)} RSD
            </div>
            <div className="company__type-wrapper">
              <span className="company__type-text">Tip: </span>
              <Dropdown
                options={companyTypeOptions}
                onChange={(option) => handleTypeChange(String(option.value))}
                value={currentTypeOption}
                placeholder="Izaberite opciju"
              />
            </div>
            <h5 className="pt-2">Prodajna mesta:</h5>
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
