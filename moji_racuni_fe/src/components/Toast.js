import React from "react";
import { Link } from "react-router-dom";
import checkIcon from "../icons/checkmark_circle.svg";

const Toast = ({ title, text, link, close }) => {
  return (
    <div className="toast">
      <img className="toast__icon" src={checkIcon} alt="checkmark" />
      <div className="toast__body">
        <h5 className="toast__title">{title}</h5>
        <p className="toast__text">{text}</p>
        {link && (
          <Link className="toast__link" to={link.to}>
            {link.text}
          </Link>
        )}
      </div>
      <span className="close close--sm" onClick={close}></span>
    </div>
  );
};

export default Toast;
