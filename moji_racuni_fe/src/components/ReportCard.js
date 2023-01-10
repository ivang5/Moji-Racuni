import React, { useEffect, useState } from "react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import { dateTimeFormatter } from "../utils/utils";

const ReportCard = ({
  id,
  date,
  request,
  response,
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
          className="report-card"
          onClick={() => {
            openModal(id);
            window.scrollTo(0, 0);
          }}
        >
          <div className="report-card__head-wrapper">
            <span className="report-card__date">{dateTimeFormatter(date)}</span>
            <h5 className="report-card__receipt">Račun #{receipt}</h5>
            <h6>Status: {closed ? "Zatvoren" : "Otvoren"}</h6>
            {user.role === "ADMIN" && (
              <span className="report-card__user">
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
