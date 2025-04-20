import React, { forwardRef } from "react";

const FormGroup = forwardRef(
  ({ name, text, type, error, success, inline, defaultVal }, ref) => {
    return (
      <div
        className={inline ? "form__group form__group--inline" : "form__group"}
      >
        <label className="form__label" htmlFor={name}>
          <input
            className="form__input"
            ref={ref}
            id={name}
            type={type}
            name={name}
            placeholder=" "
            defaultValue={defaultVal && defaultVal}
          />
          <span className="form__label-text">{text}</span>
        </label>
        <span className={error === "" ? "d-none" : "form__error"}>{error}</span>
        <span className={success === "" ? "d-none" : "form__success"}>
          {success}
        </span>
      </div>
    );
  }
);

export default FormGroup;
