import React, { useEffect, useState } from "react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import { dateTimeFormatter } from "../utils/utils";
import BellIcon from "../icons/bell-icon.svg";

const ReportCard = ({
  id,
  date,
  request,
  closed,
  seen,
  receipt,
  userId,
  openModal,
}) => {
  const [reportUser, setReportUser] = useState({});
  const { user } = useContext(AuthContext);
  const api = useApi();

  useEffect(() => {
    getReportUser();
  }, []);

  const getReportUser = async () => {
    const repUser = await api.getUser(userId);
    setReportUser(repUser);
  };

  return (
    <>
      {reportUser && (
        <div
          className={
            closed
              ? !seen && user.role === "REGULAR"
                ? "report-card report-card--unseen"
                : "report-card report-card--closed"
              : "report-card"
          }
          onClick={() => {
            openModal(id);
            window.scrollTo(0, 0);
          }}
        >
          {user.role === "REGULAR" && closed && !seen ? (
            <img
              className="report-card__icon"
              src={BellIcon}
              alt="oko"
              title="Nove promene"
            />
          ) : (
            <></>
          )}
          <div className="report-card__head-wrapper">
            <span className="report-card__date">{dateTimeFormatter(date)}</span>
            <h5 className="report-card__receipt">Prijava #{id}</h5>
            <h6>Račun #{receipt}</h6>
            <span className={closed ? "c-red d-block" : "c-green-4 d-block"}>
              {closed ? "Zatvorena" : "Otvorena"}
            </span>
            {user.role === "ADMIN" && (
              <span className="d-block report-card__user">
                Prijavio: {reportUser.username}
              </span>
            )}
          </div>
          <div className="report-card__footer-wrapper">
            <p className="report-card__request">{request}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportCard;
