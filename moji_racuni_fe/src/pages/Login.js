import React, { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";

const Login = () => {
  const { loginUser, registerUser } = useContext(AuthContext);
  const [registration, setRegistration] = useState(false);

  const goToLogin = () => {
    setRegistration(false);
  };

  const goToRegistration = () => {
    setRegistration(true);
  };

  return (
    <>
      <div className={registration ? "logreg logreg--registration" : "logreg"}>
        <div
          className={
            registration
              ? "logreg__login-aside"
              : "logreg__login-aside logreg__login-aside--active"
          }
        >
          <div className="logreg__aside-content">
            <h2 className="logreg__aside-title capitalize">Nemate nalog?</h2>
            <p className="logreg__aside-text">
              Ako još niste kreirali nalog, registrujte se.
            </p>
            <button
              className="btn btn-lg btn-secondary btn-secondary--white btn-round"
              onClick={goToRegistration}
            >
              Registrujte se
            </button>
          </div>
          <div className="logreg__shape-wrapper">
            <div className="logreg__shape logreg__shape--1"></div>
            <div className="logreg__shape logreg__shape--2"></div>
            <div className="logreg__shape logreg__shape--3"></div>
          </div>
        </div>
        <div
          className={
            registration
              ? "logreg__form-wrapper logreg__form-wrapper--reg"
              : "logreg__form-wrapper"
          }
        >
          <div
            className={
              registration
                ? "logreg__form"
                : "logreg__form logreg__form--active"
            }
          >
            <div>
              <h1 className="logreg__form-title capitalize">
                Prijavite se na svoj nalog
              </h1>
              <span className="logreg__form-title-line"></span>
            </div>
            <form className="form pt-3" onSubmit={loginUser}>
              <div className="form__group">
                <label className="form__label" htmlFor="username">
                  <input
                    className="form__input"
                    id="username"
                    type="text"
                    name="username"
                    placeholder=" "
                  />
                  <span className="form__label-text">Korisničko ime</span>
                </label>
              </div>
              <div className="form__group">
                <label className="form__label" htmlFor="password">
                  <input
                    className="form__input"
                    id="password"
                    type="password"
                    name="password"
                    placeholder=" "
                  />
                  <span className="form__label-text">Lozinka</span>
                </label>
              </div>
              <button className="btn btn-primary btn-round" type="submit">
                Prijava
              </button>
            </form>
          </div>
          <div
            className={
              registration
                ? "logreg__form logreg__form--active"
                : "logreg__form"
            }
          >
            <div>
              <h1 className="logreg__form-title capitalize">Kreirajte nalog</h1>
              <span className="logreg__form-title-line"></span>
            </div>
            <form className="form" onSubmit={registerUser}>
              <div className="form__group-wrapper">
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-name">
                    <input
                      className="form__input"
                      id="reg-name"
                      type="text"
                      name="name"
                      placeholder=" "
                    />
                    <span className="form__label-text">Ime</span>
                  </label>
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-lastname">
                    <input
                      className="form__input"
                      id="reg-lastname"
                      type="text"
                      name="lastname"
                      placeholder=" "
                    />
                    <span className="form__label-text">Prezime</span>
                  </label>
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-email">
                    <input
                      className="form__input"
                      id="reg-email"
                      type="email"
                      name="email"
                      placeholder=" "
                    />
                    <span className="form__label-text">Email</span>
                  </label>
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-username">
                    <input
                      className="form__input"
                      id="reg-username"
                      type="text"
                      name="username"
                      placeholder=" "
                    />
                    <span className="form__label-text">Korisničko ime</span>
                  </label>
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-password">
                    <input
                      className="form__input"
                      id="reg-password"
                      type="password"
                      name="password"
                      placeholder=" "
                    />
                    <span className="form__label-text">Lozinka</span>
                  </label>
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="reg-password-1">
                    <input
                      className="form__input"
                      id="reg-password-1"
                      type="password"
                      name="password1"
                      placeholder=" "
                    />
                    <span className="form__label-text">Ponovite lozinku</span>
                  </label>
                </div>
              </div>
              <button className="btn btn-primary btn-round" type="submit">
                Registracija
              </button>
            </form>
          </div>
        </div>
        <div
          className={
            registration
              ? "logreg__reg-aside logreg__reg-aside--active"
              : "logreg__reg-aside"
          }
        >
          <div className="logreg__aside-content">
            <h2 className="logreg__aside-title capitalize">Imate nalog?</h2>
            <p className="logreg__aside-text">
              Ako ste već registorovani, samo se prijavite. Dobrodošli nazad!
            </p>
            <button
              className="btn btn-lg btn-secondary btn-secondary--white btn-round"
              onClick={goToLogin}
            >
              Prijavite se
            </button>
          </div>
          <div className="logreg__shape-wrapper">
            <div className="logreg__shape logreg__shape--4"></div>
            <div className="logreg__shape logreg__shape--5"></div>
            <div className="logreg__shape logreg__shape--6"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
