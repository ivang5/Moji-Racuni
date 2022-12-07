import React from "react";

const StatPanel = ({ stats, timeSpan, setTimeSpan, statsLoading }) => {
  return (
    <div className="stat-panel py-4 py-lg-4">
      <div className="stat-panel__header">
        <div className="stat-panel__header-main">
          <h2>Statistika</h2>
          <div className="stat-panel__header-info">
            <span
              className={
                timeSpan === "month"
                  ? "stat-panel__header-info-item stat-panel__header-info-item--active fs-6 fw-semi-bold"
                  : "stat-panel__header-info-item fs-6 fw-semi-bold"
              }
              onClick={() => setTimeSpan("month")}
            >
              Mesec
            </span>
            <span
              className={
                timeSpan === "year"
                  ? "stat-panel__header-info-item stat-panel__header-info-item--active fs-6 fw-semi-bold"
                  : "stat-panel__header-info-item fs-6 fw-semi-bold"
              }
              onClick={() => setTimeSpan("year")}
            >
              Godina
            </span>
            <span
              className={
                timeSpan === "all"
                  ? "stat-panel__header-info-item stat-panel__header-info-item--active fs-6 fw-semi-bold"
                  : "stat-panel__header-info-item fs-6 fw-semi-bold"
              }
              onClick={() => setTimeSpan("all")}
            >
              Sve
            </span>
          </div>
        </div>
        <a href="#" className="stat-panel__header-link">
          Pogledaj više <i className="arrow arrow--right"></i>
        </a>
      </div>
      {statsLoading ? (
        <div className="stat-panel-empty">
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      ) : (
        <>
          {stats.totalSpent.totalSpent ? (
            <div className="stat-panel__body">
              <div className="stat-panel__item stat-panel__item--one">
                <h6 className="stat-panel__item-title c-gray">
                  Ukupno potrošeno
                </h6>
                <span className="stat-panel__item-val fs-1 fw-bold">
                  {stats.totalSpent.totalSpent} RSD
                </span>
              </div>
              <div className="stat-panel__item stat-panel__item--two">
                <h6 className="stat-panel__item-title c-gray">
                  Broj posećenih prodavnica
                </h6>
                <span className="stat-panel__item-val fs-1 fw-bold">
                  {stats.visitedCompaniesInfo.unitCount}
                </span>
              </div>
              <div className="stat-panel__item stat-panel__item--three">
                <h6 className="stat-panel__item-title c-gray">
                  Najposećenije preduzeće
                </h6>
                <h3 className="stat-panel__item-val">
                  {stats.MostVisitedCompaniesInfo[0].companyName}
                </h3>
                <div className="stat-panel__item-wrapper">
                  <div>
                    <span className="stat-panel__item-val fs-3 fw-bold">
                      {stats.MostVisitedCompaniesInfo[0].receiptCount}
                    </span>
                    <h6 className="stat-panel__item-title c-gray">Računa</h6>
                  </div>
                  <div>
                    <span className="stat-panel__item-val fs-3 fw-bold">
                      {stats.MostVisitedCompaniesInfo[0].priceSum} RSD
                    </span>
                    <h6 className="stat-panel__item-title c-gray">Potrošeno</h6>
                  </div>
                </div>
              </div>
              <div className="stat-panel__item stat-panel__item--four">
                <h6 className="stat-panel__item-title c-gray">
                  Najskuplji proizvod
                </h6>
                <h3 className="stat-panel__item-val">
                  {stats.mostValuableItems[0].name}
                </h3>
                <span className="stat-panel__item-val fs-2 fw-bold">
                  {stats.mostValuableItems[0].price} RSD
                </span>
              </div>
            </div>
          ) : (
            <div className="stat-panel-empty">
              <h3 className="pb-2">Nedovoljno podataka za statistiku...</h3>
              <p>Dodajte još računa da bi statistika mogla da se prikaže.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatPanel;
