import React from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

type PaginatorProps = {
  pageNumbers: number[];
  activePage: number;
  path: string;
};

const Paginator = ({ pageNumbers, activePage, path }: PaginatorProps) => {
  const navigate = useNavigate();
  const { page } = useParams();
  const lastPage = pageNumbers[pageNumbers.length - 1] ?? 1;

  useEffect(() => {
    const parsedPage = Number.parseInt(page ?? "", 10);
    if (parsedPage > lastPage) {
      navigate("/not-found");
    }
  }, [lastPage, navigate, page]);

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
          activePage === lastPage
            ? "paginator__step paginator__step--inactive"
            : "paginator__step"
        }
        onClick={() =>
          activePage !== lastPage &&
          navigate(`${path}/strana/${activePage + 1}`)
        }
      >
        Sledeća <i className="arrow arrow--right"></i>
      </div>
    </div>
  );
};

export default Paginator;
