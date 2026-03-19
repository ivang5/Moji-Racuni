import React, { useEffect, useRef, useState } from "react";
import useApi from "../utils/useApi";
import { dateTimeFormatter } from "../utils/utils";
import BellIcon from "../icons/bell-icon.svg";
import useAuthUser from "../hooks/useAuthUser";

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
  const { userRole } = useAuthUser();
  const api = useApi();
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    const loadReportUser = async () => {
      const repUser = await apiRef.current.getUser(userId);
      setReportUser(repUser);
    };

    loadReportUser();
  }, [userId]);

  return (
    <>
      {reportUser && (
        <div
          className={
            closed
              ? !seen && userRole === "REGULAR"
                ? "report-card report-card--unseen"
                : "report-card report-card--closed"
              : "report-card"
          }
          onClick={() => openModal(id)}
        >
          {userRole === "REGULAR" && closed && !seen ? (
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
            {userRole === "ADMIN" && (
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
