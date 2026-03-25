import React from "react";
import { dateTimeFormatter } from "../utils/utils";
import BellIcon from "../icons/bell-icon.svg";
import useAuthUser from "../hooks/useAuthUser";
import useUserByIdQuery from "../hooks/queries/useUserByIdQuery";
import type { ReportListItemView } from "../types/viewModels";

type ReportCardProps = Pick<
  ReportListItemView,
  "id" | "date" | "request" | "closed" | "seen" | "receipt"
> & {
  userId: ReportListItemView["user"];
  openModal: (id: number) => void;
};

const ReportCard = ({
  id,
  date,
  request,
  closed,
  seen,
  receipt,
  userId,
  openModal,
}: ReportCardProps) => {
  const { userRole } = useAuthUser();
  const { data: reportUser } = useUserByIdQuery(userId);

  return (
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
            Prijavio: {reportUser?.username || "..."}
          </span>
        )}
      </div>
      <div className="report-card__footer-wrapper">
        <p className="report-card__request">{request}</p>
      </div>
    </div>
  );
};

export default ReportCard;
