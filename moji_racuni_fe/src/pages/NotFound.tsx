import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="not-found">
      <h1 className="not-found__title">404</h1>
      <p className="not-found__text">
        Izvinite, stranica koju tražite ne postoji.
      </p>
      <Link
        className="btn btn-primary btn-primary--black btn-round not-found__btn"
        to="/"
      >
        Početna strana
      </Link>
    </div>
  );
};

export default NotFound;
