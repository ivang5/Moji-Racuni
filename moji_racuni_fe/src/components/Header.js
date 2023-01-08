import React, { useContext, useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { capitalize, getPageFromPathname } from "../utils/utils";
import AuthContext from "../context/AuthContext";
import Logo from "../icons/logo/Logo_bg_color.svg";

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [mobileNav, setMobileNav] = useState(false);
  const [activePage, setActivePage] = useState();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
            <div className="nav__wrapper py-1 px-2">
              <nav className="nav">
                <div className="nav__brand d-inline">
                  <Link
                    className="nav__logo"
                    to="/"
                    onClick={() => {
                      setActivePage("Home");
                      setDropdownOpen(false);
                    }}
                  >
                    <img className="nav__logo-img" src={Logo} alt="logo" />
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
                      onClick={() => {
                        setActivePage("Home");
                        setDropdownOpen(false);
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
                        setDropdownOpen(false);
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
                        setDropdownOpen(false);
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
                        setDropdownOpen(false);
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
                          setDropdownOpen(false);
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
                          setDropdownOpen(false);
                        }}
                      >
                        Prijave
                      </Link>
                    </li>
                  )}
                </ul>
                <div
                  className={
                    dropdownOpen
                      ? "nav__dropdown nav__dropdown--open"
                      : "nav__dropdown"
                  }
                >
                  <div onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <span
                      className={
                        activePage === "Profile"
                          ? "nav__link nav__link--active"
                          : "nav__link"
                      }
                      data-content={capitalize(user.username)}
                    >
                      {capitalize(user.username)}{" "}
                    </span>
                    <i className="arrow arrow--down"></i>
                  </div>
                  <div className="nav__dropdown-items">
                    <Link
                      className="nav__dropdown-item"
                      to="/profil"
                      onClick={() => {
                        setActivePage("Profile");
                        setDropdownOpen(false);
                      }}
                    >
                      {" "}
                      Profil
                    </Link>
                    <div
                      className="nav__dropdown-item"
                      onClick={() => {
                        logoutUser();
                        setDropdownOpen(false);
                      }}
                    >
                      Odjavi se
                    </div>
                  </div>
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
              <li>
                <div
                  className={
                    dropdownOpen
                      ? "mobile-nav__dropdown mobile-nav__dropdown--open"
                      : "mobile-nav__dropdown"
                  }
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span
                    className={
                      activePage === "Profile"
                        ? "nav__link nav__link--active"
                        : "nav__link"
                    }
                  >
                    {capitalize(user.username)}{" "}
                  </span>
                  <i className="arrow arrow--down"></i>
                  <div className="mobile-nav__dropdown-items">
                    <Link
                      className="mobile-nav__dropdown-item"
                      onClick={() => {
                        setActivePage("Profile");
                        toggleMobileNav();
                      }}
                      to="/profil"
                    >
                      Profil
                    </Link>
                    <div
                      className="mobile-nav__dropdown-item"
                      onClick={logoutUser}
                    >
                      Odjavi se
                    </div>
                  </div>
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
