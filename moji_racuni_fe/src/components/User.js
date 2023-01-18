import React from "react";
import { dateFormatter } from "../utils/utils";

const User = ({ userInfo }) => {
  return (
    <div className="user">
      <h4 className="user__title">Korisnik #{userInfo.id}</h4>
      <div className="user__body">
        <p className="user__date fw-bold">
          Korisnik od: {dateFormatter(userInfo.date_joined)}
        </p>
        <div className="user__info">
          Status:{" "}
          <span
            className={
              userInfo.is_active ? "fw-bold c-green-4" : "fw-bold c-red"
            }
          >
            {userInfo.is_active ? "Aktivan" : "Blokiran"}
          </span>
        </div>
        <div className="user__info">
          Korisničko ime: <span className="fw-bold">{userInfo.username}</span>
        </div>
        <div className="user__info">
          Ime: <span className="fw-bold capitalize">{userInfo.first_name}</span>
        </div>
        <div className="user__info">
          Prezime:{" "}
          <span className="fw-bold capitalize">{userInfo.last_name}</span>
        </div>
        <div className="user__info">
          Email: <span className="fw-bold">{userInfo.email}</span>
        </div>
      </div>
    </div>
  );
};

export default User;
