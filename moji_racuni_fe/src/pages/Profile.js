import React, { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [formValid, setFormValid] = useState({
    name: "",
    lastname: "",
    username: "",
    email: "",
    server: "",
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
                <button
                  className="btn btn-primary btn-round profile__info-btn"
                  onClick={() => setModalOpen(true)}
                >
                  Promeni informacije
                </button>
              </div>
            </div>
          </div>
          {modalOpen && (
            <div className="modal">
              <div className="profile__form">
                <h3 className="profile__form-title">Izmena informacija</h3>
                <FormGroup
                  name="name"
                  text="Ime"
                  type="text"
                  error={formValid.name}
                />
                <FormGroup
                  name="lastname"
                  text="Prezime"
                  type="text"
                  error={formValid.lastname}
                />
                <FormGroup
                  name="username"
                  text="Korisničko ime"
                  type="text"
                  error={formValid.username}
                />
                <FormGroup
                  name="email"
                  text="Email"
                  type="email"
                  error={formValid.email}
                />
                <div className="profile__form-footer">
                  <button
                    className="btn btn-primary btn-primary--gray btn-round"
                    onClick={() => setModalOpen(false)}
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
              </div>
              <span
                className="close"
                onClick={() => setModalOpen(false)}
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
    </div>
  );
};

export default Profile;
