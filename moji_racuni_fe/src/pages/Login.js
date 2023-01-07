import React, { useContext, useState } from "react";
import FormGroup from "../components/FormGroup";
import AuthContext from "../context/AuthContext";
import receipt from "../rec.svg";
import { validateEmail } from "../utils/utils";

const Login = () => {
  const { loginUser, registerUser } = useContext(AuthContext);
  const [registration, setRegistration] = useState(false);
  const [loginValid, setLoginValid] = useState({
    username: "",
    password: "",
    server: "",
  });
  const [registrationValid, setRegistrationValid] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    passwordRepeat: "",
    server: "",
  });

  const goToLogin = () => {
    setRegistration(false);
  };

  const goToRegistration = () => {
    setRegistration(true);
  };

  const initiateLogin = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = { username: "", password: "", server: "" };

    if (e.target.username.value.trim() === "") {
      validationObj.username = "Korisničko ime ne može biti prazno!";
      valid = false;
    }

    if (e.target.password.value.trim() === "") {
      validationObj.password = "Lozinka ne može biti prazna!";
      valid = false;
    }

    if (!valid) {
      setLoginValid(validationObj);
      return;
    }

    const response = await loginUser(e);

    if (response === 404) {
      validationObj.username = "Korisničko ime ne postoji!";
    } else if (response === 401) {
      validationObj.password = "Pogrešna lozinka!";
    } else {
      validationObj.server =
        "Došlo je do greške, pokušajte ponovo za nekoliko minuta...";
    }

    setLoginValid(validationObj);
  };

  const initiateRegistration = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      passwordRepeat: "",
      server: "",
    };

    if (e.target.regName.value.trim() === "") {
      validationObj.firstName = "Ime ne može biti prazno!";
      valid = false;
    } else if (e.target.regName.value.trim().length < 2) {
      validationObj.firstName = "Ime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.regName.value.trim())) {
      validationObj.firstName = "Ime mora biti tekstualnog tipa!";
      valid = false;
    }

    if (e.target.regLastname.value.trim() === "") {
      validationObj.lastName = "Prezime ne može biti prazno!";
      valid = false;
    } else if (e.target.regLastname.value.trim().length < 2) {
      validationObj.lastName = "Prezime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.regName.value.trim())) {
      validationObj.lastName = "Prezime mora biti tekstualnog tipa!";
      valid = false;
    }

    if (e.target.regEmail.value.trim() === "") {
      validationObj.email = "Email ne može biti prazan!";
      valid = false;
    } else if (!validateEmail(e.target.regEmail.value.trim())) {
      validationObj.email = "Email nije validan!";
      valid = false;
    }

    if (e.target.regUsername.value.trim() === "") {
      validationObj.username = "Korisničko ime ne može biti prazno!";
      valid = false;
    } else if (e.target.regUsername.value.trim().length < 3) {
      validationObj.username = "Korisničko ime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.regName.value.trim())) {
      validationObj.username =
        "Korisničko ime mora sadržati barem jedno slovo!";
      valid = false;
    }

    if (e.target.regPassword1.value.trim() === "") {
      validationObj.passwordRepeat = "Morate ponoviti lozinku!";
      valid = false;
    } else if (
      e.target.regPassword.value.trim() !== e.target.regPassword1.value.trim()
    ) {
      validationObj.passwordRepeat = "Lozinke moraju biti iste!";
      valid = false;
    }

    if (e.target.regPassword.value.trim() === "") {
      validationObj.password = "Lozinka ne može biti prazna!";

      if (e.target.regPassword1.value.trim() === "") {
        validationObj.passwordRepeat = "Lozinka ne može biti prazna!";
      }
      valid = false;
    }

    if (!valid) {
      setRegistrationValid(validationObj);
      return;
    }

    const response = await registerUser(e);

    if (response === 409) {
      validationObj.username = "Korisničko ime već postoji!";
    } else {
      validationObj.server =
        "Izvinjavamo se, došlo je do greške, pokušajte ponovo za par minuta...";
    }

    setRegistrationValid(validationObj);
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
          <div className="logreg__bg">
            <img className="logreg__bg-img" src={receipt} alt="receipt" />
          </div>
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
            <form className="form pt-3" onSubmit={initiateLogin}>
              <FormGroup
                name="username"
                text="Korisničko ime"
                type="text"
                error={loginValid.username}
              />
              <FormGroup
                name="password"
                text="Lozinka"
                type="password"
                error={loginValid.password}
              />
              <span
                className={
                  loginValid.server === ""
                    ? "d-none"
                    : "form__error form__error--lg t-center"
                }
              >
                {loginValid.server}
              </span>
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
            <form className="form" onSubmit={initiateRegistration}>
              <div className="form__group-wrapper">
                <FormGroup
                  name="regName"
                  text="Ime"
                  type="text"
                  error={registrationValid.firstName}
                />
                <FormGroup
                  name="regLastname"
                  text="Prezime"
                  type="text"
                  error={registrationValid.lastName}
                />
                <FormGroup
                  name="regEmail"
                  text="Email"
                  type="email"
                  error={registrationValid.email}
                />
                <FormGroup
                  name="regUsername"
                  text="Korisničko ime"
                  type="text"
                  error={registrationValid.username}
                />
                <FormGroup
                  name="regPassword"
                  text="Lozinka"
                  type="password"
                  error={registrationValid.password}
                />
                <FormGroup
                  name="regPassword1"
                  text="Ponovite lozinku"
                  type="password"
                  error={registrationValid.passwordRepeat}
                />
              </div>
              <span
                className={
                  registrationValid.server === ""
                    ? "d-none"
                    : "form__error form__error--lg t-center"
                }
              >
                {registrationValid.server}
              </span>
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
