import React from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../utils/utils";
import TrendUp from "../icons/trend-up.png";
import TrendDown from "../icons/trend-down.png";
import type {
  PercentageChanges,
  StatSummary,
  TimeSpan,
} from "../types/viewModels";

type StatPanelProps = {
  stats: StatSummary;
  timeSpan: TimeSpan;
  setTimeSpan: (span: TimeSpan) => void;
  percentageChanges: PercentageChanges;
  statsLoading: boolean;
};

const StatPanel = ({
  stats,
  timeSpan,
  setTimeSpan,
  percentageChanges,
  statsLoading,
}: StatPanelProps) => {
  const topVisitedCompany = stats.MostVisitedCompaniesInfo?.[0];
  const topValuableItem = stats.mostValuableItems?.[0];

  return (
    <div className="stat-panel py-4 py-lg-3">
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
        <Link className="stat-panel__header-link" to="/statistika">
          Pogledaj više <i className="arrow arrow--right"></i>
        </Link>
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
                <span className="stat-panel__item-val fs-2 fw-bold">
                  {formatPrice(stats.totalSpent.totalSpent)} RSD
                </span>
                {timeSpan !== "all" &&
                  percentageChanges.totalSpent !== null &&
                  percentageChanges.totalSpent !== 0 && (
                    <div
                      className={`stat-panel__item-trend ${
                        percentageChanges.totalSpent < 0 &&
                        "stat-panel__item-trend--down"
                      }`}
                    >
                      <img
                        className="stat-panel__item-trend-img"
                        src={
                          percentageChanges.totalSpent >= 0
                            ? TrendUp
                            : TrendDown
                        }
                        alt={
                          percentageChanges.totalSpent >= 0
                            ? "uptrend"
                            : "downtrend"
                        }
                      />
                      {percentageChanges.totalSpent}%
                    </div>
                  )}
              </div>
              <div className="stat-panel__item stat-panel__item--two">
                <h6 className="stat-panel__item-title c-gray">
                  Broj posećenih prodavnica
                </h6>
                <span className="stat-panel__item-val fs-2 fw-bold">
                  {stats.visitedCompaniesInfo.unitCount}
                </span>
                {timeSpan !== "all" &&
                  percentageChanges.unitCount !== null &&
                  percentageChanges.unitCount !== 0 && (
                    <div
                      className={`stat-panel__item-trend ${
                        percentageChanges.unitCount < 0 &&
                        "stat-panel__item-trend--down"
                      }`}
                    >
                      <img
                        className="stat-panel__item-trend-img"
                        src={
                          percentageChanges.unitCount >= 0 ? TrendUp : TrendDown
                        }
                        alt={
                          percentageChanges.unitCount >= 0
                            ? "uptrend"
                            : "downtrend"
                        }
                      />
                      {percentageChanges.unitCount}%
                    </div>
                  )}
              </div>
              <div className="stat-panel__item stat-panel__item--three">
                <h6 className="stat-panel__item-title c-gray">
                  Najposećenije preduzeće
                </h6>
                <h3 className="stat-panel__item-val">
                  {topVisitedCompany?.companyName}
                </h3>
                <div className="stat-panel__item-wrapper">
                  <div>
                    <span className="stat-panel__item-val fs-3 fw-bold">
                      {topVisitedCompany?.receiptCount ?? 0}
                    </span>
                    <h6 className="stat-panel__item-title c-gray">Računa</h6>
                    {timeSpan !== "all" &&
                      percentageChanges.mostVisitedCompanyReceiptCount !==
                        null &&
                      percentageChanges.mostVisitedCompanyReceiptCount !==
                        0 && (
                        <div
                          className={`stat-panel__item-trend stat-panel__item-trend--sm ${
                            percentageChanges.mostVisitedCompanyReceiptCount <
                              0 && "stat-panel__item-trend--down"
                          }`}
                        >
                          <img
                            className="stat-panel__item-trend-img"
                            src={
                              percentageChanges.mostVisitedCompanyReceiptCount >=
                              0
                                ? TrendUp
                                : TrendDown
                            }
                            alt={
                              percentageChanges.mostVisitedCompanyReceiptCount >=
                              0
                                ? "uptrend"
                                : "downtrend"
                            }
                          />
                          {percentageChanges.mostVisitedCompanyReceiptCount}%
                        </div>
                      )}
                  </div>
                  <div>
                    <span className="stat-panel__item-val fs-3 fw-bold">
                      {formatPrice(topVisitedCompany?.priceSum ?? 0)} RSD
                    </span>
                    <h6 className="stat-panel__item-title c-gray">Potrošeno</h6>
                    {timeSpan !== "all" &&
                      percentageChanges.mostVisitedCompanyPriceSum !== null &&
                      percentageChanges.mostVisitedCompanyPriceSum !== 0 && (
                        <div
                          className={`stat-panel__item-trend stat-panel__item-trend--sm ${
                            percentageChanges.mostVisitedCompanyPriceSum < 0 &&
                            "stat-panel__item-trend--down"
                          }`}
                        >
                          <img
                            className="stat-panel__item-trend-img"
                            src={
                              percentageChanges.mostVisitedCompanyPriceSum >= 0
                                ? TrendUp
                                : TrendDown
                            }
                            alt={
                              percentageChanges.mostVisitedCompanyPriceSum >= 0
                                ? "uptrend"
                                : "downtrend"
                            }
                          />
                          {percentageChanges.mostVisitedCompanyPriceSum}%
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="stat-panel__item stat-panel__item--four">
                <h6 className="stat-panel__item-title c-gray">
                  Najskuplji proizvod
                </h6>
                <h3 className="stat-panel__item-val">
                  {topValuableItem?.name}
                </h3>
                <span className="stat-panel__item-val fs-2 fw-bold">
                  {formatPrice(topValuableItem?.price ?? 0)} RSD
                </span>
                {timeSpan !== "all" &&
                  percentageChanges.mostValuableItemPrice !== null &&
                  percentageChanges.mostValuableItemPrice !== 0 && (
                    <div
                      className={`stat-panel__item-trend ${
                        percentageChanges.mostValuableItemPrice < 0 &&
                        "stat-panel__item-trend--down"
                      }`}
                    >
                      <img
                        className="stat-panel__item-trend-img"
                        src={
                          percentageChanges.mostValuableItemPrice >= 0
                            ? TrendUp
                            : TrendDown
                        }
                        alt={
                          percentageChanges.mostValuableItemPrice >= 0
                            ? "uptrend"
                            : "downtrend"
                        }
                      />
                      {percentageChanges.mostValuableItemPrice}%
                    </div>
                  )}
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
