import React from "react";

const UserCard = ({ id, username, email, active, openModal }) => {
  return (
    <div
      className={active ? "user-card" : "user-card user-card--blocked"}
      onClick={() => openModal(id)}
    >
      <div className="user-card__head-wrapper">
        <h5 className="user-card__username">
          {username} (#{id})
        </h5>
        <span className="d-block user-card__status">
          Status:{" "}
          <span className={active ? "fw-bold c-green-4" : "fw-bold c-red"}>
            {active ? "Aktivan" : "Blokiran"}
          </span>
        </span>
      </div>
      <div className="user-card__body">
        <h6 className="user-card__email">{email}</h6>
      </div>
    </div>
  );
};

export default UserCard;
