import React, { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import Toast from "../components/Toast";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import { validateEmail } from "../utils/utils";

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenPass, setModalOpenPass] = useState(false);
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [formValid, setFormValid] = useState({
    name: "",
    lastname: "",
    username: "",
    email: "",
  });
  const [formValidPass, setFormValidPass] = useState({
    password: "",
    passwordRepeat: "",
  });
  const api = useApi();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const userInfo = await api.getUser(user.user_id);
    setUserInfo(userInfo);
  };

  const saveChanges = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = {
      name: "",
      lastname: "",
      username: "",
      email: "",
    };

    if (e.target.name.value.trim() === "") {
      validationObj.name = "Ime ne može biti prazno!";
      valid = false;
    } else if (e.target.name.value.trim().length < 2) {
      validationObj.name = "Ime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.name.value.trim())) {
      validationObj.name = "Ime mora biti tekstualnog tipa!";
      valid = false;
    }

    if (e.target.lastname.value.trim() === "") {
      validationObj.lastname = "Prezime ne može biti prazno!";
      valid = false;
    } else if (e.target.lastname.value.trim().length < 2) {
      validationObj.lastname = "Prezime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.lastname.value.trim())) {
      validationObj.lastname = "Prezime mora biti tekstualnog tipa!";
      valid = false;
    }

    if (e.target.username.value.trim() === "") {
      validationObj.username = "Korisničko ime ne može biti prazno!";
      valid = false;
    } else if (e.target.username.value.trim().length < 3) {
      validationObj.username = "Korisničko ime je previše kratko!";
      valid = false;
    } else if (!isNaN(e.target.username.value.trim())) {
      validationObj.username =
        "Korisničko ime mora sadržati barem jedno slovo!";
      valid = false;
    }

    if (e.target.email.value.trim() === "") {
      validationObj.email = "Email ne može biti prazan!";
      valid = false;
    } else if (!validateEmail(e.target.email.value.trim())) {
      validationObj.email = "Email nije validan!";
      valid = false;
    }

    if (!valid) {
      setFormValid(validationObj);
      return;
    }

    const userInfo = {
      first_name: e.target.name.value,
      last_name: e.target.lastname.value,
      username: e.target.username.value,
      email: e.target.email.value,
    };
    const response = await api.updateUser(user.user_id, userInfo);

    if (response === 409) {
      validationObj.username = "Korisničko ime već postoji!";
      setFormValid(validationObj);
    } else {
      setFormValid(validationObj);
      setModalOpen(false);
      setToast({
        title: "Uspešno",
        text: "Informacije su uspešno promenjene.",
      });
      openToast();
      getUserInfo();
    }
  };

  const saveChangesPass = async (e) => {
    e.preventDefault();
    let valid = true;
    let validationObj = {
      password: "",
      passwordRepeat: "",
    };

    if (e.target.passRepeat.value.trim() === "") {
      validationObj.passwordRepeat = "Morate ponoviti lozinku!";
      valid = false;
    } else if (
      e.target.pass.value.trim() !== e.target.passRepeat.value.trim()
    ) {
      validationObj.passwordRepeat = "Lozinke moraju biti iste!";
      valid = false;
    }

    if (e.target.pass.value.trim() === "") {
      validationObj.password = "Lozinka ne može biti prazna!";

      if (e.target.passRepeat.value.trim() === "") {
        validationObj.passwordRepeat = "Lozinka ne može biti prazna!";
      }
      valid = false;
    }

    if (!valid) {
      setFormValidPass(validationObj);
      return;
    }

    const newPasswordInfo = {
      password: e.target.pass.value,
      passRepeat: e.target.passRepeat.value,
    };
    await api.updateUserPassword(user.user_id, newPasswordInfo);

    setFormValidPass(validationObj);
    setModalOpenPass(false);
    setToast({
      title: "Uspešno",
      text: "Lozinka je uspešno promenjena.",
    });
    openToast();
    getUserInfo();
  };

  const openToast = () => {
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 7000);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  return (
    <div>
      {userInfo ? (
        <>
          <div className="l-container">
            <div className="profile">
              <TypeAnimation
                className="text-animator text-animator--fast pt-1 pb-3"
                sequence={[`Pregled profila`]}
                wrapper="h1"
                speed={10}
                cursor={false}
              />
              <div className="profile__info">
                <h5 className="profile__info-title">
                  Korisničko ime:{" "}
                  <span className="profile__info-value">
                    {userInfo.username}
                  </span>
                </h5>
                <h5 className="profile__info-title">
                  Ime:{" "}
                  <span className="profile__info-value">
                    {userInfo.first_name}
                  </span>
                </h5>
                <h5 className="profile__info-title">
                  Prezime:{" "}
                  <span className="profile__info-value">
                    {userInfo.last_name}
                  </span>
                </h5>
                <h5 className="profile__info-title">
                  Email:{" "}
                  <span className="profile__info-value">{userInfo.email}</span>
                </h5>
                <h5 className="profile__info-title">
                  <Link className="profile__info-link" to="/prijave">
                    Moje prijave <span className="arrow arrow--right"></span>
                  </Link>
                </h5>
                <div className="profile__info-footer">
                  <button
                    className="btn btn-primary btn-round profile__info-btn"
                    onClick={() => setModalOpen(true)}
                  >
                    Promeni informacije
                  </button>
                  <button
                    className="btn btn-primary btn-primary--yellow btn-round profile__info-btn"
                    onClick={() => setModalOpenPass(true)}
                  >
                    Promeni lozinku
                  </button>
                </div>
              </div>
            </div>
          </div>
          {modalOpen && (
            <div className="modal">
              <form className="profile__form" onSubmit={saveChanges}>
                <h3 className="profile__form-title">Izmena informacija</h3>
                <FormGroup
                  name="name"
                  text="Ime"
                  type="text"
                  error={formValid.name}
                  defaultVal={userInfo.first_name}
                />
                <FormGroup
                  name="lastname"
                  text="Prezime"
                  type="text"
                  error={formValid.lastname}
                  defaultVal={userInfo.last_name}
                />
                <FormGroup
                  name="username"
                  text="Korisničko ime"
                  type="text"
                  error={formValid.username}
                  defaultVal={userInfo.username}
                />
                <FormGroup
                  name="email"
                  text="Email"
                  type="email"
                  error={formValid.email}
                  defaultVal={userInfo.email}
                />
                <div className="profile__form-footer">
                  <button
                    className="btn btn-primary btn-primary--gray btn-round"
                    onClick={() => setModalOpen(false)}
                    type="button"
                  >
                    Odustani
                  </button>
                  <button
                    className="btn btn-primary btn-primary btn-round"
                    type="submit"
                  >
                    Sačuvaj
                  </button>
                </div>
              </form>
              <span
                className="close"
                onClick={() => setModalOpen(false)}
              ></span>
            </div>
          )}
          {modalOpenPass && (
            <div className="modal">
              <form
                className="profile__form profile__form--password"
                onSubmit={saveChangesPass}
              >
                <h3 className="profile__form-title">Izmena lozinke</h3>
                <FormGroup
                  name="pass"
                  text="Nova lozinka"
                  type="password"
                  error={formValidPass.password}
                />
                <FormGroup
                  name="passRepeat"
                  text="Ponvite lozinku"
                  type="password"
                  error={formValidPass.passwordRepeat}
                />
                <div className="profile__form-footer">
                  <button
                    className="btn btn-primary btn-primary--gray btn-round"
                    onClick={() => setModalOpenPass(false)}
                    type="button"
                  >
                    Odustani
                  </button>
                  <button
                    className="btn btn-primary btn-primary btn-round"
                    type="submit"
                  >
                    Sačuvaj
                  </button>
                </div>
              </form>
              <span
                className="close"
                onClick={() => setModalOpenPass(false)}
              ></span>
            </div>
          )}
        </>
      ) : (
        <h4>
          Izvinjavamo se, došlo je do greške pri učitavanju korisničkih
          informacija.
        </h4>
      )}
      {toastOpen && (
        <Toast title={toast.title} text={toast.text} close={closeToast} />
      )}
    </div>
  );
};

export default Profile;
