import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import Toast from "../components/Toast";
import { dateFormatter } from "../utils/utils";
import {
  validatePasswordUpdateForm,
  validateProfileInfoForm,
} from "../utils/validators";
import useModalDismiss from "../hooks/useModalDismiss";
import useAuthUser from "../hooks/useAuthUser";
import useToast from "../hooks/useToast";
import useUserByIdQuery from "../hooks/queries/useUserByIdQuery";
import useUpdateUserMutation from "../hooks/mutations/useUpdateUserMutation";
import useUpdateUserPasswordMutation from "../hooks/mutations/useUpdateUserPasswordMutation";
import { ApiError } from "../api/errors";

type ProfileValidation = {
  username: string;
  email: string;
};

type PasswordValidation = {
  password: string;
  passwordRepeat: string;
};

type ProfileInfoForm = HTMLFormElement & {
  username: HTMLInputElement;
  email: HTMLInputElement;
};

type PasswordForm = HTMLFormElement & {
  pass: HTMLInputElement;
  passRepeat: HTMLInputElement;
};

const Profile = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenPass, setModalOpenPass] = useState(false);
  const [formValid, setFormValid] = useState<ProfileValidation>({
    username: "",
    email: "",
  });
  const [formValidPass, setFormValidPass] = useState<PasswordValidation>({
    password: "",
    passwordRepeat: "",
  });
  const { userId, userRole } = useAuthUser();
  const { toast, toastOpen, showToast, closeToast } = useToast(7000);
  const { data: userInfo, isLoading: userLoading } = useUserByIdQuery(userId);
  const { mutateAsync: updateUserMutation } = useUpdateUserMutation();
  const { mutateAsync: updateUserPasswordMutation } =
    useUpdateUserPasswordMutation();

  const saveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
    const form = e.currentTarget as ProfileInfoForm;

    let validationObj = validateProfileInfoForm({
      username: form.username.value,
      email: form.email.value,
    });

    if (validationObj.username !== "" || validationObj.email !== "") {
      setFormValid(validationObj);
      return;
    }

    if (!userInfo) {
      return;
    }

    const updatedUserInfo = {
      username: form.username.value,
      email: form.email.value,
      is_active: userInfo.is_active,
    };

    try {
      await updateUserMutation({
        id: userId,
        userInfo: updatedUserInfo,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        validationObj.username = "Korisničko ime već postoji!";
        setFormValid(validationObj);
      }
      return;
    }

    setFormValid(validationObj);
    setModalOpen(false);
    showToast({
      title: "Uspešno",
      text: "Informacije su uspešno promenjene.",
    });
  };

  const saveChangesPass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
    const form = e.currentTarget as PasswordForm;

    let validationObj = validatePasswordUpdateForm({
      password: form.pass.value,
      passwordRepeat: form.passRepeat.value,
    });

    if (validationObj.password !== "" || validationObj.passwordRepeat !== "") {
      setFormValidPass(validationObj);
      return;
    }

    const newPasswordInfo = {
      password: form.pass.value,
      passRepeat: form.passRepeat.value,
    };
    try {
      await updateUserPasswordMutation({
        id: userId,
        passwordInfo: newPasswordInfo,
      });
    } catch {
      return;
    }

    setFormValidPass(validationObj);
    setModalOpenPass(false);
    showToast({
      title: "Uspešno",
      text: "Lozinka je uspešno promenjena.",
    });
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
        <>
          {userLoading ? (
            <div className="stat-panel-empty mb-4">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : (
            <h4>
              Izvinjavamo se, došlo je do greške pri učitavanju korisničkih
              informacija.
            </h4>
          )}
        </>
      )}
      {toastOpen && (
        <Toast title={toast.title} text={toast.text} close={closeToast} />
      )}
    </div>
  );
};

export default Profile;
