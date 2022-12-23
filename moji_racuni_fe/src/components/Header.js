import React, { useContext, useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getPageFromPathname } from "../utils/utils";
import AuthContext from "../context/AuthContext";

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [mobileNav, setMobileNav] = useState(false);
  const [activePage, setActivePage] = useState();
  const currentPath = window.location.pathname;

  useEffect(() => {
    const pathname = window.location.pathname;
    const page = getPageFromPathname(pathname);
    setActivePage(page);
  }, []);

  const toggleMobileNav = () => {
    setMobileNav(!mobileNav);
  };

  return (
    <>
      {currentPath !== "/prijava" && user !== null && (
        <div>
          <header className={mobileNav ? "header header--active" : "header"}>
            <div className="nav__wrapper p-2">
              <nav className="nav">
                <div className="nav__brand d-inline">
                  <Link
                    className="nav__logo"
                    to="/"
                    onClick={() => setActivePage("Home")}
                  >
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
                    <Link
                      className={
                        activePage === "Home"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content="Početna"
                      to="/"
                      onClick={() => setActivePage("Home")}
                    >
                      Početna
                    </Link>
                  </li>
                  <li className="nav__list-item">
                    <Link
                      className={
                        activePage === "Stats"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content="Statistike"
                      to="/statistike"
                      onClick={() => setActivePage("Stats")}
                    >
                      Statistike
                    </Link>
                  </li>
                  <li className="nav__list-item">
                    <Link
                      className={
                        activePage === "Receipts"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content="Računi"
                      to="/racuni"
                      onClick={() => setActivePage("Receipts")}
                    >
                      Računi
                    </Link>
                  </li>
                  <li className="nav__list-item">
                    <Link
                      className={
                        activePage === "Companies"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content="Preduzeća"
                      to="/preduzeca"
                      onClick={() => setActivePage("Companies")}
                    >
                      Preduzeća
                    </Link>
                  </li>
                  {user.role === "ADMIN" && (
                    <li className="nav__list-item">
                      <Link
                        className={
                          activePage === "Users"
                            ? "nav__link nav__link--active"
                            : "nav__link"
                        }
                        data-content="Korisnici"
                        to="/korisnici"
                        onClick={() => setActivePage("Users")}
                      >
                        Korisnici
                      </Link>
                    </li>
                  )}
                  {user.role === "ADMIN" && (
                    <li className="nav__list-item">
                      <Link
                        className={
                          activePage === "Reports"
                            ? "nav__link nav__link--active"
                            : "nav__link"
                        }
                        data-content="Prijave"
                        to="/prijave"
                        onClick={() => setActivePage("Reports")}
                      >
                        Prijave
                      </Link>
                    </li>
                  )}
                  <li className="nav__list-item">
                    <Link
                      className={
                        activePage === "Profile"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content="Profil"
                      to="/profil"
                      onClick={() => setActivePage("Profile")}
                    >
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
            </div>
          </header>
          <div
            className={
              mobileNav ? "mobile-nav mobile-nav--active" : "mobile-nav"
            }
          >
            <ul className="mobile-nav__list">
              <li className="nav__list-item">
                <Link
                  className={
                    activePage === "Home"
                      ? "nav__link nav__link--active"
                      : "nav__link"
                  }
                  data-content="Početna"
                  to="/"
                  onClick={() => {
                    setActivePage("Home");
                    toggleMobileNav();
                  }}
                >
                  Početna
                </Link>
              </li>
              <li className="nav__list-item">
                <Link
                  className={
                    activePage === "Stats"
                      ? "nav__link nav__link--active"
                      : "nav__link"
                  }
                  data-content="Statistike"
                  to="/statistike"
                  onClick={() => {
                    setActivePage("Stats");
                    toggleMobileNav();
                  }}
                >
                  Statistike
                </Link>
              </li>
              <li className="nav__list-item">
                <Link
                  className={
                    activePage === "Receipts"
                      ? "nav__link nav__link--active"
                      : "nav__link"
                  }
                  data-content="Računi"
                  to="/racuni"
                  onClick={() => {
                    setActivePage("Receipts");
                    toggleMobileNav();
                  }}
                >
                  Računi
                </Link>
              </li>
              <li className="nav__list-item">
                <Link
                  className={
                    activePage === "Companies"
                      ? "nav__link nav__link--active"
                      : "nav__link"
                  }
                  data-content="Preduzeća"
                  to="/preduzeca"
                  onClick={() => {
                    setActivePage("Companies");
                    toggleMobileNav();
                  }}
                >
                  Preduzeća
                </Link>
              </li>
              {user.role === "ADMIN" && (
                <li className="nav__list-item">
                  <Link
                    className={
                      activePage === "Users"
                        ? "nav__link nav__link--active"
                        : "nav__link"
                    }
                    data-content="Korisnici"
                    to="/korisnici"
                    onClick={() => {
                      setActivePage("Users");
                      toggleMobileNav();
                    }}
                  >
                    Korisnici
                  </Link>
                </li>
              )}
              {user.role === "ADMIN" && (
                <li className="nav__list-item">
                  <Link
                    className={
                      activePage === "Reports"
                        ? "nav__link nav__link--active"
                        : "nav__link"
                    }
                    data-content="Prijave"
                    to="/prijave"
                    onClick={() => {
                      setActivePage("Reports");
                      toggleMobileNav();
                    }}
                  >
                    Prijave
                  </Link>
                </li>
              )}
              <li className="nav__list-item">
                <Link
                  className={
                    activePage === "Profile"
                      ? "nav__link nav__link--active"
                      : "nav__link"
                  }
                  data-content="Profil"
                  to="/profil"
                  onClick={() => {
                    setActivePage("Profile");
                    toggleMobileNav();
                  }}
                >
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
