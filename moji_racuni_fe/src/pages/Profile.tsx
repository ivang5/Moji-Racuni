// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import Toast from "../components/Toast";
import useApi from "../utils/useApi";
import { dateFormatter } from "../utils/utils";
import {
  validatePasswordUpdateForm,
  validateProfileInfoForm,
} from "../utils/validators";
import useModalDismiss from "../hooks/useModalDismiss";
import useAuthUser from "../hooks/useAuthUser";

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenPass, setModalOpenPass] = useState(false);
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [formValid, setFormValid] = useState({
    username: "",
    email: "",
  });
  const [formValidPass, setFormValidPass] = useState({
    password: "",
    passwordRepeat: "",
  });
  const api = useApi();
  const apiRef = useRef(api);
  const { userId, userRole } = useAuthUser();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const getUserInfo = useCallback(async () => {
    if (!userId) {
      return;
    }

    const userInfo = await apiRef.current.getUser(userId);
    setUserInfo(userInfo);
  }, [userId]);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  const saveChanges = async (e) => {
    e.preventDefault();
    if (!userId) {
      return;
    }

    let validationObj = validateProfileInfoForm({
      username: e.target.username.value,
      email: e.target.email.value,
    });

    if (validationObj.username !== "" || validationObj.email !== "") {
      setFormValid(validationObj);
      return;
    }

    const userInfo = {
      username: e.target.username.value,
      email: e.target.email.value,
    };
    const response = await api.updateUser(userId, userInfo);

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
    if (!userId) {
      return;
    }

    let validationObj = validatePasswordUpdateForm({
      password: e.target.pass.value,
      passwordRepeat: e.target.passRepeat.value,
    });

    if (validationObj.password !== "" || validationObj.passwordRepeat !== "") {
      setFormValidPass(validationObj);
      return;
    }

    const newPasswordInfo = {
      password: e.target.pass.value,
      passRepeat: e.target.passRepeat.value,
    };
    await api.updateUserPassword(userId, newPasswordInfo);

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

  const resetModal = () => {
    setModalOpen(false);
    setModalOpenPass(false);
  };

  useModalDismiss(resetModal);

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
                  Email:{" "}
                  <span className="profile__info-value">{userInfo.email}</span>
                </h5>
                <h5 className="profile__info-title">
                  Korisnik od:{" "}
                  <span className="profile__info-value">
                    {dateFormatter(userInfo.date_joined)}
                  </span>
                </h5>
                {userRole === "REGULAR" && (
                  <h5 className="profile__info-title">
                    <Link className="profile__info-link" to="/prijave">
                      Moje prijave <span className="arrow arrow--right"></span>
                    </Link>
                  </h5>
                )}
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
