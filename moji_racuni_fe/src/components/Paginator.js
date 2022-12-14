import React from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Paginator = ({ pageNumbers, activePage, path }) => {
  const navigate = useNavigate();
  const { page } = useParams();

  useEffect(() => {
    if (parseInt(page) > pageNumbers.at(-1)) {
      navigate("/not-found");
    }
  }, []);

  return (
    <div className="paginator">
      <div
        className={
          activePage === 1
            ? "paginator__step paginator__step--inactive"
            : "paginator__step"
        }
        onClick={() =>
          activePage !== 1 && navigate(`${path}/strana/${activePage - 1}`)
        }
      >
        <i className="arrow arrow--left"></i> Prethodna
      </div>
      {pageNumbers &&
        pageNumbers.map((pageNumber) => {
          return pageNumber > 0 ? (
            <div
              key={pageNumber}
              className={
                pageNumber === activePage
                  ? "paginator__page paginator__page--active"
                  : "paginator__page"
              }
              onClick={() => navigate(`${path}/strana/${pageNumber}`)}
            >
              {pageNumber}
            </div>
          ) : (
            <div key={pageNumber}>...</div>
          );
        })}
      <div
        className={
          activePage === pageNumbers.at(-1)
            ? "paginator__step paginator__step--inactive"
            : "paginator__step"
        }
        onClick={() =>
          activePage !== pageNumbers.at(-1) &&
          navigate(`${path}/strana/${activePage + 1}`)
        }
      >
        Sledeća <i className="arrow arrow--right"></i>
      </div>
    </div>
  );
};

export default Paginator;
