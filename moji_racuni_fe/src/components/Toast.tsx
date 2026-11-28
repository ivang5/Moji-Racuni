import { Link } from "react-router";
import checkIcon from "../icons/checkmark_circle.svg";
import errorIcon from "../icons/info-icon-fill.png";

type ToastLink = {
  to: string;
  text: string;
};

type ToastProps = {
  title: string;
  text: string;
  link?: ToastLink;
  error?: boolean;
  close: () => void;
};

const Toast = ({ title, text, link, error = false, close }: ToastProps) => {
  return (
    <div className="toast">
      <img
        className="toast__icon"
        src={error ? errorIcon : checkIcon}
        alt={error ? "greška" : "checkmark"}
      />
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
