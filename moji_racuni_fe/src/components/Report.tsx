// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../utils/useApi";
import { dateTimeFormatter } from "../utils/utils";
import useAuthUser from "../hooks/useAuthUser";

const Report = ({ reportInfo, hasLink }) => {
  const [reportUser, setReportUser] = useState({});
  const { userRole } = useAuthUser();
  const api = useApi();
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    const loadReportUser = async () => {
      const repUser = await apiRef.current.getUser(reportInfo.user);
      setReportUser(repUser);
    };

    loadReportUser();
  }, [reportInfo.user]);

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
        {userRole === "ADMIN" && (
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
        {hasLink && (
          <Link className="report-details__link" to="/prijave">
            Pregled prijava <i className="arrow arrow--right"></i>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Report;
