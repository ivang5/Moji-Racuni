import React, { useContext, useState } from "react";
import FormGroup from "../components/FormGroup";
import AuthContext from "../context/AuthContext";
import receipt from "../rec.svg";
import {
  validateLoginForm,
  validateRegistrationForm,
} from "../utils/validators";

type LoginForm = HTMLFormElement & {
  username: HTMLInputElement;
  password: HTMLInputElement;
};

type RegistrationForm = HTMLFormElement & {
  regEmail: HTMLInputElement;
  regUsername: HTMLInputElement;
  regPassword: HTMLInputElement;
  regPassword1: HTMLInputElement;
};

type LoginValidation = {
  username: string;
  password: string;
  server: string;
};

type RegistrationValidation = {
  email: string;
  username: string;
  password: string;
  passwordRepeat: string;
  server: string;
};

const Login = () => {
  const { loginUser, registerUser } = useContext(AuthContext);
  const [registration, setRegistration] = useState(false);
  const [loginValid, setLoginValid] = useState<LoginValidation>({
    username: "",
    password: "",
    server: "",
  });
  const [registrationValid, setRegistrationValid] =
    useState<RegistrationValidation>({
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

  const initiateLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as LoginForm;
    const validationObj = validateLoginForm({
      username: form.username.value,
      password: form.password.value,
    });

    if (validationObj.username !== "" || validationObj.password !== "") {
      setLoginValid(validationObj);
      return;
    }

    const response = await loginUser(e);

    if (response === undefined) {
      return;
    }

    // Ista poruka za nepostojeće ime i pogrešnu lozinku (ne otkriva koja korisnička imena postoje)
    if (response === 401) {
      validationObj.server = "Pogrešno korisničko ime ili lozinka!";
    } else if (response === 429) {
      validationObj.server =
        "Previše pokušaja prijave, pokušajte ponovo za minut.";
    } else {
      validationObj.server =
        "Došlo je do greške, pokušajte ponovo za nekoliko minuta...";
    }

    setLoginValid(validationObj);
  };

  const initiateRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as RegistrationForm;
    const validationObj = validateRegistrationForm({
      email: form.regEmail.value,
      username: form.regUsername.value,
      password: form.regPassword.value,
      passwordRepeat: form.regPassword1.value,
    });

    if (
      validationObj.email !== "" ||
      validationObj.username !== "" ||
      validationObj.password !== "" ||
      validationObj.passwordRepeat !== ""
    ) {
      setRegistrationValid(validationObj);
      return;
    }

    const response = await registerUser(e);

    if (response === undefined) {
      return;
    }

    const { status, errors } = response;

    if (status === 409) {
      validationObj.username = "Korisničko ime već postoji!";
    } else if (status === 400 && Object.keys(errors).length > 0) {
      // Greške validacije sa BE-a (npr. pravila za lozinku, zauzet email)
      validationObj.email = errors.email?.join(" ") ?? "";
      validationObj.username = errors.username?.join(" ") ?? "";
      validationObj.password = errors.password?.join(" ") ?? "";
    } else if (status === 429) {
      validationObj.server =
        "Previše pokušaja registracije, pokušajte ponovo kasnije.";
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
