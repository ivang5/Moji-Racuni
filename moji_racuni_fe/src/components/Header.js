import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [mobileNav, setMobileNav] = useState(false);
  const currentPath = window.location.pathname;

  const toggleMobileNav = () => {
    setMobileNav(!mobileNav);
  };

  return (
    <>
      {currentPath !== "/login" && user !== null && (
        <div>
          <header className={mobileNav ? "header header--active" : "header"}>
            <div className="nav__wrapper p-2">
              <nav className="nav">
                <div className="nav__brand d-inline">
                  <Link className="nav__logo" to="/">
                    <img
                      className="nav__logo-img"
                      src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Approve_icon.svg"
                      alt="logo"
                    />
                  </Link>
                  <span
                    className={
                      mobileNav
                        ? "nav__burger nav__burger--active"
                        : "nav__burger"
                    }
                    onClick={toggleMobileNav}
                  ></span>
                </div>
                <ul className="nav__list">
                  <li className="nav__list-item">
                    <Link className="nav__link" data-content="Početna" to="/">
                      Početna
                    </Link>
                  </li>
                  <li className="nav__list-item">
                    <Link
                      className="nav__link nav__link--active"
                      data-content="Statistike"
                      to="/"
                    >
                      Statistike
                    </Link>
                  </li>
                  <li className="nav__list-item">
                    <Link className="nav__link" data-content="Profil" to="/">
                      Profil
                    </Link>
                  </li>
                </ul>
                <div className="nav__logout" onClick={logoutUser}>
                  <span className="nav__link" data-content="Izloguj se">
                    Izloguj se
                  </span>
                </div>
              </nav>
              {/* {user && <span className="pl-1">Hello {user.username}</span>} */}
            </div>
          </header>
          <div
            className={
              mobileNav ? "mobile-nav mobile-nav--active" : "mobile-nav"
            }
          >
            <ul className="mobile-nav__list">
              <li className="nav__list-item">
                <Link className="nav__link" to="/">
                  Početna
                </Link>
              </li>
              <li className="nav__list-item">
                <Link
                  className="nav__link nav__link-active"
                  data-content="About"
                  to="/"
                >
                  Statistike
                </Link>
              </li>
              <li className="nav__list-item">
                <Link className="nav__link" to="/">
                  Profil
                </Link>
              </li>
              <li>
                <div className="mobile-nav__logout" onClick={logoutUser}>
                  <span className="nav__link">Izloguj se</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
