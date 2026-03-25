import React, { useEffect, useMemo, useRef, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import DatePicker from "react-datepicker";
import {
  countReceipts,
  dateBEFormatter,
  getSpendingsPieFormatData,
  getVisitsPieFormatData,
  getHoursFromNumbers,
  getMonthsFromNumbers,
  getTenYearsAgo,
  getTomorrow,
  getWeekdaysFromNumbers,
  sumSpendings,
  isChartEmpty,
  getMostValItemsFormat,
  formatPrice,
} from "../utils/utils";
import Chart from "../components/Chart";
import InfoIcon from "../icons/info-icon.png";
import { saveAs } from "file-saver";
import type {
  BaseStatsView,
  ChartBarPoint,
  ChartPiePoint,
  StatPlotsView,
} from "../types/viewModels";
import useStatisticsBaseStatsQuery from "../hooks/queries/useStatisticsBaseStatsQuery";
import useStatisticsTotalSpentQuery from "../hooks/queries/useStatisticsTotalSpentQuery";
import useStatisticsReceiptsByHourQuery from "../hooks/queries/useStatisticsReceiptsByHourQuery";
import useStatisticsReceiptsByWeekdayQuery from "../hooks/queries/useStatisticsReceiptsByWeekdayQuery";
import useStatisticsReceiptsByMonthQuery from "../hooks/queries/useStatisticsReceiptsByMonthQuery";
import useStatisticsSpentByHourQuery from "../hooks/queries/useStatisticsSpentByHourQuery";
import useStatisticsSpentByWeekdayQuery from "../hooks/queries/useStatisticsSpentByWeekdayQuery";
import useStatisticsSpentByMonthQuery from "../hooks/queries/useStatisticsSpentByMonthQuery";
import useStatisticsMostSpentCompaniesQuery from "../hooks/queries/useStatisticsMostSpentCompaniesQuery";
import useStatisticsMostVisitedCompaniesQuery from "../hooks/queries/useStatisticsMostVisitedCompaniesQuery";
import useStatisticsMostSpentTypesQuery from "../hooks/queries/useStatisticsMostSpentTypesQuery";
import useStatisticsMostVisitedTypesQuery from "../hooks/queries/useStatisticsMostVisitedTypesQuery";
import useStatisticsMostValuableItemsQuery from "../hooks/queries/useStatisticsMostValuableItemsQuery";
import useStatisticsPlotsQuery from "../hooks/queries/useStatisticsPlotsQuery";

const pdfBlobCache = new Map<string, Blob>();

const Statistics = () => {
  const [showSpendings, setShowSpendings] = useState(true);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(getTomorrow());
  const [searchOpen, setSearchOpen] = useState(false);
  const [PDFBlob, setPDFBlob] = useState<Blob | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingPdfKeyRef = useRef<string | null>(null);
  const fromDateStr = dateBEFormatter(fromDate);
  const toDateStr = dateBEFormatter(toDate);

  const dateParams = useMemo(
    () => ({ dateFrom: fromDateStr, dateTo: toDateStr }),
    [fromDateStr, toDateStr],
  );

  const baseStatsQuery = useStatisticsBaseStatsQuery(dateParams);
  const totalSpentQuery = useStatisticsTotalSpentQuery(dateParams);
  const receiptsByHourQuery = useStatisticsReceiptsByHourQuery(dateParams);
  const receiptsByWeekdayQuery =
    useStatisticsReceiptsByWeekdayQuery(dateParams);
  const receiptsByMonthQuery = useStatisticsReceiptsByMonthQuery(dateParams);
  const spentByHourQuery = useStatisticsSpentByHourQuery(dateParams);
  const spentByWeekdayQuery = useStatisticsSpentByWeekdayQuery(dateParams);
  const spentByMonthQuery = useStatisticsSpentByMonthQuery(dateParams);
  const mostSpentCompaniesQuery =
    useStatisticsMostSpentCompaniesQuery(dateParams);
  const mostVisitedCompaniesQuery =
    useStatisticsMostVisitedCompaniesQuery(dateParams);
  const mostSpentTypesQuery = useStatisticsMostSpentTypesQuery(dateParams);
  const mostVisitedTypesQuery = useStatisticsMostVisitedTypesQuery(dateParams);
  const mostValuableItemsQuery =
    useStatisticsMostValuableItemsQuery(dateParams);
  const statPlotsQuery = useStatisticsPlotsQuery(dateParams);

  const baseStats = useMemo(
    () => (baseStatsQuery.data || {}) as BaseStatsView,
    [baseStatsQuery.data],
  );
  const receiptsInfo = totalSpentQuery.data || {};
  const statPlots = useMemo(
    () => (statPlotsQuery.data || {}) as StatPlotsView,
    [statPlotsQuery.data],
  );
  const plotsLoading = statPlotsQuery.isLoading || statPlotsQuery.isFetching;
  const pdfCacheKey = useMemo(
    () =>
      [
        fromDateStr,
        toDateStr,
        String(baseStatsQuery.dataUpdatedAt),
        String(statPlotsQuery.dataUpdatedAt),
        String(mostSpentTypesQuery.dataUpdatedAt),
        String(totalSpentQuery.dataUpdatedAt),
      ].join("|"),
    [
      fromDateStr,
      toDateStr,
      baseStatsQuery.dataUpdatedAt,
      statPlotsQuery.dataUpdatedAt,
      mostSpentTypesQuery.dataUpdatedAt,
      totalSpentQuery.dataUpdatedAt,
    ],
  );

  const receiptsByHour = useMemo(() => {
    const source = receiptsByHourQuery.data || [];
    if (isChartEmpty(source, "count")) {
      return [];
    }

    return getHoursFromNumbers(source, "count") as ChartBarPoint[];
  }, [receiptsByHourQuery.data]);

  const receiptsByWeekday = useMemo(() => {
    const source = receiptsByWeekdayQuery.data || [];
    if (isChartEmpty(source, "count")) {
      return [];
    }

    return getWeekdaysFromNumbers(source, "count") as ChartBarPoint[];
  }, [receiptsByWeekdayQuery.data]);

  const receiptsByMonth = useMemo(() => {
    const source = receiptsByMonthQuery.data || [];
    if (isChartEmpty(source, "count")) {
      return [];
    }

    return getMonthsFromNumbers(source, "count") as ChartBarPoint[];
  }, [receiptsByMonthQuery.data]);

  const spentByHour = useMemo(() => {
    const source = spentByHourQuery.data || [];
    if (isChartEmpty(source, "spent")) {
      return [];
    }

    return getHoursFromNumbers(source, "spent") as ChartBarPoint[];
  }, [spentByHourQuery.data]);

  const spentByWeekday = useMemo(() => {
    const source = spentByWeekdayQuery.data || [];
    if (isChartEmpty(source, "spent")) {
      return [];
    }

    return getWeekdaysFromNumbers(source, "spent") as ChartBarPoint[];
  }, [spentByWeekdayQuery.data]);

  const spentByMonth = useMemo(() => {
    const source = spentByMonthQuery.data || [];
    if (isChartEmpty(source, "spent")) {
      return [];
    }

    return getMonthsFromNumbers(source, "spent") as ChartBarPoint[];
  }, [spentByMonthQuery.data]);

  const mostSpentCompanies = useMemo(() => {
    const source = mostSpentCompaniesQuery.data || [];
    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    const formatted = getSpendingsPieFormatData(
      source,
      true,
    ) as ChartPiePoint[];
    formatted.push({
      id: "Ostalo",
      value: Number(receiptsInfo.totalSpent || 0) - sumSpendings(formatted),
    });
    return formatted;
  }, [mostSpentCompaniesQuery.data, receiptsInfo.totalSpent]);

  const mostVisitedCompanies = useMemo(() => {
    const source = mostVisitedCompaniesQuery.data || [];
    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    const formatted = getVisitsPieFormatData(source, true) as ChartPiePoint[];
    formatted.push({
      id: "Ostalo",
      value: Number(receiptsInfo.receiptsCount || 0) - countReceipts(formatted),
    });
    return formatted;
  }, [mostVisitedCompaniesQuery.data, receiptsInfo.receiptsCount]);

  const mostSpentTypes = useMemo(() => {
    const source = mostSpentTypesQuery.data || [];
    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    const formatted = getSpendingsPieFormatData(
      source,
      false,
    ) as ChartPiePoint[];
    formatted.push({
      id: "Ostalo",
      value: Number(receiptsInfo.totalSpent || 0) - sumSpendings(formatted),
    });
    return formatted;
  }, [mostSpentTypesQuery.data, receiptsInfo.totalSpent]);

  const mostVisitedTypes = useMemo(() => {
    const source = mostVisitedTypesQuery.data || [];
    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    const formatted = getVisitsPieFormatData(source, false) as ChartPiePoint[];
    formatted.push({
      id: "Ostalo",
      value: Number(receiptsInfo.receiptsCount || 0) - countReceipts(formatted),
    });
    return formatted;
  }, [mostVisitedTypesQuery.data, receiptsInfo.receiptsCount]);

  const mostValuableItems = useMemo(() => {
    const source = mostValuableItemsQuery.data || [];
    if (!Array.isArray(source) || source.length === 0) {
      return [];
    }

    return getMostValItemsFormat(source) as ChartBarPoint[];
  }, [mostValuableItemsQuery.data]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/WorkerPDF.ts", import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<Blob>) => {
      const pendingKey = pendingPdfKeyRef.current;
      if (pendingKey) {
        pdfBlobCache.set(pendingKey, e.data);

        // Keep cache bounded to avoid unbounded memory growth.
        if (pdfBlobCache.size > 20) {
          const oldestKey = pdfBlobCache.keys().next().value;
          if (oldestKey) {
            pdfBlobCache.delete(oldestKey);
          }
        }
      }

      setPDFBlob(e.data);
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) {
      return;
    }

    if (!baseStats.totalSpent || !statPlots?.spending) {
      return;
    }

    const cachedPdfBlob = pdfBlobCache.get(pdfCacheKey);
    if (cachedPdfBlob) {
      setPDFBlob(cachedPdfBlob);
      return;
    }

    setPDFBlob(null);
    pendingPdfKeyRef.current = pdfCacheKey;

    workerRef.current.postMessage({
      statPlots: statPlots,
      baseStats: baseStats,
      fromDate: fromDate,
      toDate: toDate,
      mostSpentTypes: mostSpentTypes,
    });
  }, [baseStats, fromDate, mostSpentTypes, pdfCacheKey, statPlots, toDate]);

  return (
    <div className="l-container">
      <div className="statistics">
        <TypeAnimation
          className="text-animator pt-1 pb-3"
          sequence={["Pregled statistike"]}
          wrapper="h1"
          speed={20}
          cursor={false}
        />
        <div className="statistics__search mb-1">
          <div
            className={
              searchOpen
                ? "statistics__search-wrapper statistics__search-wrapper--open"
                : "statistics__search-wrapper"
            }
          >
            <h2
              className="statistics__search-title pb-2"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              Opcije <i className="arrow arrow--down"></i>
            </h2>
            <div className="statistics__search-fields">
              <div className="statistics__search-fields-wrapper">
                <div className="statistics__search-date-wrapper">
                  <span className="statistics__search-lbl">Datum od</span>
                  <DatePicker
                    selected={fromDate}
                    onChange={(date) => {
                      if (date) {
                        setFromDate(date);
                      }
                    }}
                    selectsStart
                    startDate={fromDate}
                    endDate={toDate}
                    dateFormat="d/MM/yyyy"
                  />
                </div>
                <div className="statistics__search-date-wrapper">
                  <span className="statistics__search-lbl">Datum do</span>
                  <DatePicker
                    selected={toDate}
                    onChange={(date) => {
                      if (date) {
                        setToDate(date);
                      }
                    }}
                    selectsEnd
                    startDate={fromDate}
                    endDate={toDate}
                    minDate={fromDate}
                    dateFormat="d/MM/yyyy"
                  />
                </div>
                <ul className="statistics__search-checkbox-wrapper">
                  <li className="statistics__search-checkbox">
                    <input
                      className="flip"
                      type="checkbox"
                      id="check1"
                      checked={showSpendings}
                      onChange={() => {
                        setShowSpendings(true);
                        setShowReceipts(false);
                        setShowCompanies(false);
                        setShowItems(false);
                      }}
                    />
                    <label htmlFor="check1">
                      <span></span>Potrošnja
                    </label>
                  </li>
                  <li className="statistics__search-checkbox">
                    <input
                      className="flip"
                      type="checkbox"
                      id="check2"
                      checked={showReceipts}
                      onChange={() => {
                        setShowReceipts(true);
                        setShowSpendings(false);
                        setShowCompanies(false);
                        setShowItems(false);
                      }}
                    />
                    <label htmlFor="check2">
                      <span></span>Računi
                    </label>
                  </li>
                  <li className="statistics__search-checkbox">
                    <input
                      className="flip"
                      type="checkbox"
                      id="check3"
                      checked={showCompanies}
                      onChange={() => {
                        setShowCompanies(true);
                        setShowSpendings(false);
                        setShowReceipts(false);
                        setShowItems(false);
                      }}
                    />
                    <label htmlFor="check3">
                      <span></span>Preduzeća
                    </label>
                  </li>
                  <li className="statistics__search-checkbox">
                    <input
                      className="flip"
                      type="checkbox"
                      id="check4"
                      checked={showItems}
                      onChange={() => {
                        setShowItems(true);
                        setShowSpendings(false);
                        setShowReceipts(false);
                        setShowCompanies(false);
                      }}
                    />
                    <label htmlFor="check4">
                      <span></span>Stavke
                    </label>
                  </li>
                </ul>
              </div>
              {baseStats.totalSpent?.receiptsCount !== 0 && (
                <div className="statistics__btn-wrapper">
                  {plotsLoading || PDFBlob === null ? (
                    <div className="btn btn-primary btn-round btn-spinner">
                      <div className="spinner spinner--sm">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="statistics__pdf-btn">
                      <button
                        className="btn btn-primary btn-round"
                        type="button"
                        onClick={async () => {
                          saveAs(PDFBlob, "Statistika.pdf");
                        }}
                      >
                        Preuzmi PDF
                      </button>
                      <div className="statistics__pdf-info">
                        <img
                          className="statistics__pdf-info-icon"
                          src={InfoIcon}
                          alt="info"
                        />
                        <div className="statistics__pdf-info-body">
                          <ul className="statistics__pdf-info-list">
                            <li>
                              PDF datoteka sadrži uvid u statistiku o potrošnji,
                              računima, preduzećima i stavkama.
                            </li>
                            <br />
                            <li>
                              Statistika sadržana u PDF datoteci je samo za
                              odabrani datumski opseg.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {showSpendings && (
          <>
            {baseStats.totalSpent ? (
              <div className="statistics__panel">
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Ukupno potrošeno</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.totalSpent.totalSpent
                      ? formatPrice(baseStats.totalSpent.totalSpent)
                      : 0}{" "}
                    RSD
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Potrošeno na PDV</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.totalSpent.totalSpentVat
                      ? formatPrice(baseStats.totalSpent.totalSpentVat)
                      : 0}{" "}
                    RSD
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Najviše potrošeno u jednom danu</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.mostSpentInADay?.mostSpent
                      ? formatPrice(baseStats.mostSpentInADay?.mostSpent)
                      : 0}{" "}
                    RSD
                  </span>
                </div>
              </div>
            ) : (
              <div className="statistics__panel__empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            )}
            <h2 className="statistics__chart-wrapper-title mt-5">Potrošnja</h2>
            {spentByHour.length !== 0 ? (
              <div className="statistics__chart-wrapper mt-5">
                <Chart
                  type="bar"
                  data={spentByWeekday}
                  keys={["spent"]}
                  index="dayofweek"
                  tooltip="Potrošeno: "
                  title="Po danima"
                />
                <Chart
                  type="bar"
                  data={spentByMonth}
                  keys={["spent"]}
                  index="month"
                  tooltip="Potrošeno: "
                  title="Po mesecima"
                />
                <Chart
                  type="bar"
                  data={spentByHour}
                  keys={["spent"]}
                  index="hour"
                  tooltip="Potrošeno: "
                  title="Po satima"
                  desktop={true}
                />
              </div>
            ) : (
              <p className="statistics__chart-wrapper-text">
                Nedovoljno podataka da bi se prikazali grafikoni!
              </p>
            )}
          </>
        )}
        {showReceipts && (
          <>
            {baseStats.totalSpent ? (
              <div className="statistics__panel">
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Ukupan broj računa</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.totalSpent.receiptsCount}
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Najveći račun</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.totalSpent.mostSpentReceipt
                      ? formatPrice(baseStats.totalSpent.mostSpentReceipt)
                      : 0}{" "}
                    RSD
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Prosečna vrednost računa</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.totalSpent.avgSpentReceipt
                      ? formatPrice(baseStats.totalSpent.avgSpentReceipt)
                      : 0}{" "}
                    RSD
                  </span>
                </div>
              </div>
            ) : (
              <div className="statistics__panel__empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            )}
            <h2 className="statistics__chart-wrapper-title mt-5">
              Broj računa
            </h2>
            {receiptsByHour.length !== 0 ? (
              <div className="statistics__chart-wrapper mt-5">
                <Chart
                  type="bar"
                  data={receiptsByWeekday}
                  keys={["count"]}
                  index="dayofweek"
                  tooltip="Broj računa: "
                  title="Po danima"
                />
                <Chart
                  type="bar"
                  data={receiptsByMonth}
                  keys={["count"]}
                  index="month"
                  tooltip="Broj računa: "
                  title="Po mesecima"
                />
                <Chart
                  type="bar"
                  data={receiptsByHour}
                  keys={["count"]}
                  index="hour"
                  tooltip="Broj računa: "
                  title="Po satima"
                  desktop={true}
                />
              </div>
            ) : (
              <p className="statistics__chart-wrapper-text">
                Nedovoljno podataka da bi se prikazali grafikoni!
              </p>
            )}
          </>
        )}
        {showCompanies && (
          <>
            {baseStats.visitedCompaniesInfo ? (
              <div className="statistics__panel">
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Najposećenije preduzeće</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.MostVisitedCompaniesInfo?.[0]
                      ? baseStats.MostVisitedCompaniesInfo?.[0].companyName
                      : "Nedovoljno podataka"}
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Broj posećenih preduzeća</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.visitedCompaniesInfo.companyCount}
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Broj posećenih prodajnih mesta</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.visitedCompaniesInfo.unitCount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="statistics__panel__empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            )}
            <h2 className="statistics__chart-wrapper-title mt-5">Preduzeća</h2>
            {mostSpentCompanies.length !== 0 ? (
              <div className="statistics__chart-wrapper mt-4">
                <Chart
                  type="pie"
                  data={mostSpentCompanies}
                  tooltip="cena"
                  title="Najveći troškovi"
                />
                <Chart
                  type="pie"
                  data={mostVisitedCompanies}
                  tooltip="broj"
                  title="Najposećenija"
                />
              </div>
            ) : (
              <p className="statistics__chart-wrapper-text">
                Nedovoljno podataka da bi se prikazali grafikoni!
              </p>
            )}
            <h2 className="statistics__chart-wrapper-title mt-5">
              Tipovi preduzeća
            </h2>
            {mostSpentTypes.length !== 0 ? (
              <div className="statistics__chart-wrapper mt-4">
                <Chart
                  type="pie"
                  data={mostSpentTypes}
                  tooltip="cena"
                  title="Najveći troškovi"
                />
                <Chart
                  type="pie"
                  data={mostVisitedTypes}
                  tooltip="broj"
                  title="Najposećeniji"
                />
              </div>
            ) : (
              <p className="statistics__chart-wrapper-text">
                Nedovoljno podataka da bi se prikazali grafikoni!
              </p>
            )}
          </>
        )}
        {showItems && (
          <>
            {baseStats.mostItems ? (
              <div className="statistics__panel">
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Najskuplja stavka</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.mostValuableItems?.[0]
                      ? baseStats.mostValuableItems?.[0].name
                      : "Nedovoljno podataka"}
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Najviše stavki na jednom računu</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {baseStats.mostItems.mostItems
                      ? baseStats.mostItems.mostItems
                      : 0}
                  </span>
                </div>
                <div className="statistics__panel-item">
                  <h6 className="c-gray">Prosečan broj stavki na računu</h6>
                  <span className="stat-panel__item-val fs-3 fw-bold">
                    {Math.round(baseStats.mostItems.avgItems)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="statistics__panel__empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            )}
            <h2 className="statistics__chart-wrapper-title mt-5">
              Stavke računa
            </h2>
            {receiptsByHour.length !== 0 ? (
              <div className="statistics__chart-wrapper mt-5">
                <Chart
                  type="bar"
                  data={mostValuableItems}
                  keys={["price"]}
                  index="name"
                  tooltip="Cena: "
                  title="Najskuplje"
                  customAxis={true}
                />
              </div>
            ) : (
              <p className="statistics__chart-wrapper-text">
                Nedovoljno podataka da bi se prikazali grafikoni!
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Statistics;
