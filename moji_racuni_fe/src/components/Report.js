import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import { dateTimeFormatter } from "../utils/utils";

const Report = ({ reportInfo }) => {
  const [reportUser, setReportUser] = useState({});
  const { user } = useContext(AuthContext);
  const api = useApi();

  useEffect(() => {
    getReportUser();
  }, []);

  const getReportUser = async () => {
    const repUser = await api.getUser(reportInfo.user);
    setReportUser(repUser);
  };

  return (
    <div className="report-details">
      <h4 className="report-details__title">Prijava #{reportInfo.id}</h4>
      <div className="report-details__body">
        <p className="report-details__date fw-bold">
          {dateTimeFormatter(reportInfo.date)}
        </p>
        <div className="report-details__status">
          Račun: <span className="fw-bold">#{reportInfo.receipt}</span>
        </div>
        <div className="report-details__status">
          Status:{" "}
          <span
            className={
              reportInfo.closed ? "fw-bold c-red" : "fw-bold c-green-4"
            }
          >
            {reportInfo.closed ? "Zatvorena" : "Otvorena"}
          </span>
        </div>
        {user.role === "ADMIN" && (
          <div className="report-details__user">
            Prijavio:
            <span className="fw-bold">
              {" "}
              {reportUser.username} (#{reportUser.id})
            </span>
          </div>
        )}
        <div className="report-details__text pt-2">
          <h5 className="report-details__text-title">Opis:</h5>
          <p className="report-details__text-content">{reportInfo.request}</p>
        </div>
        {reportInfo.response && (
          <div className="report-details__text pt-2">
            <h5 className="report-details__text-title">Odgovor:</h5>
            <p className="report-details__text-content">
              {reportInfo.response}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
