import React, { useCallback, useEffect, useRef, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import useApi from "../utils/useApi";
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
  ReceiptsInfoView,
  StatPlotsView,
} from "../types/viewModels";

const Statistics = () => {
  const [showSpendings, setShowSpendings] = useState(true);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [, setStatsLoading] = useState(true);
  const [baseStats, setBaseStats] = useState<BaseStatsView>({});
  const [receiptsByHour, setReceiptsByHour] = useState<ChartBarPoint[]>([]);
  const [receiptsByWeekday, setReceiptsByWeekday] = useState<ChartBarPoint[]>(
    [],
  );
  const [receiptsByMonth, setReceiptsByMonth] = useState<ChartBarPoint[]>([]);
  const [spentByHour, setSpentByHour] = useState<ChartBarPoint[]>([]);
  const [spentByWeekday, setSpentByWeekday] = useState<ChartBarPoint[]>([]);
  const [spentByMonth, setSpentByMonth] = useState<ChartBarPoint[]>([]);
  const [mostSpentCompanies, setMostSpentCompanies] = useState<ChartPiePoint[]>(
    [],
  );
  const [mostVisitedCompanies, setMostVisitedCompanies] = useState<
    ChartPiePoint[]
  >([]);
  const [mostSpentTypes, setMostSpentTypes] = useState<ChartPiePoint[]>([]);
  const [mostVisitedTypes, setMostVisitedTypes] = useState<ChartPiePoint[]>([]);
  const [mostValuableItems, setMostValuableItems] = useState<ChartBarPoint[]>(
    [],
  );
  const [receiptsInfo, setReceiptsInfo] = useState<ReceiptsInfoView>({});
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(getTomorrow());
  const [searchOpen, setSearchOpen] = useState(false);
  const [statPlots, setStatPlots] = useState<StatPlotsView>({});
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [PDFBlob, setPDFBlob] = useState<Blob | null>(null);
  const api = useApi();
  const apiRef = useRef(api);
  const workerRef = useRef<Worker | null>(null);
  const fromDateStr = dateBEFormatter(fromDate);
  const toDateStr = dateBEFormatter(toDate);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/WorkerPDF.ts", import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<Blob>) => {
      setPDFBlob(e.data);
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const getBaseStats = useCallback(async () => {
    const baseStats = (await apiRef.current.getBaseStats(
      fromDateStr,
      toDateStr,
      1,
    )) as BaseStatsView;
    setBaseStats(baseStats);
  }, [fromDateStr, toDateStr]);

  const getReceiptsInfo = useCallback(async () => {
    const receiptsInfo = (await apiRef.current.getTotalSpent(
      fromDateStr,
      toDateStr,
    )) as ReceiptsInfoView;
    setReceiptsInfo(receiptsInfo);
  }, [fromDateStr, toDateStr]);

  const getReceiptsByHour = useCallback(async () => {
    const receiptsCount = await apiRef.current.getReceiptsByHour(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByHour([]);
      return;
    }
    const receiptsCountFormatted = getHoursFromNumbers(
      receiptsCount,
      "count",
    ) as ChartBarPoint[];
    setReceiptsByHour(receiptsCountFormatted);
  }, [fromDateStr, toDateStr]);

  const getReceiptsByWeekday = useCallback(async () => {
    const receiptsCount = await apiRef.current.getReceiptsByWeekday(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByWeekday([]);
      return;
    }
    const receiptsCountFormatted = getWeekdaysFromNumbers(
      receiptsCount,
      "count",
    ) as ChartBarPoint[];
    setReceiptsByWeekday(receiptsCountFormatted);
  }, [fromDateStr, toDateStr]);

  const getReceiptsByMonth = useCallback(async () => {
    const receiptsCount = await apiRef.current.getReceiptsByMonth(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByMonth([]);
      return;
    }
    const receiptsCountFormatted = getMonthsFromNumbers(
      receiptsCount,
      "count",
    ) as ChartBarPoint[];
    setReceiptsByMonth(receiptsCountFormatted);
  }, [fromDateStr, toDateStr]);

  const getSpentByHour = useCallback(async () => {
    const moneySpent = await apiRef.current.getSpentByHour(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByHour([]);
      return;
    }
    const moneySpentFormatted = getHoursFromNumbers(
      moneySpent,
      "spent",
    ) as ChartBarPoint[];
    setSpentByHour(moneySpentFormatted);
  }, [fromDateStr, toDateStr]);

  const getSpentByWeekday = useCallback(async () => {
    const moneySpent = await apiRef.current.getSpentByWeekday(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByWeekday([]);
      return;
    }
    const moneySpentFormatted = getWeekdaysFromNumbers(
      moneySpent,
      "spent",
    ) as ChartBarPoint[];
    setSpentByWeekday(moneySpentFormatted);
  }, [fromDateStr, toDateStr]);

  const getSpentByMonth = useCallback(async () => {
    const moneySpent = await apiRef.current.getSpentByMonth(
      fromDateStr,
      toDateStr,
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByMonth([]);
      return;
    }
    const moneySpentFormatted = getMonthsFromNumbers(
      moneySpent,
      "spent",
    ) as ChartBarPoint[];
    setSpentByMonth(moneySpentFormatted);
  }, [fromDateStr, toDateStr]);

  const getMostSpentCompanies = useCallback(async () => {
    const mostSpentCompanies = await apiRef.current.getMostSpentCompaniesInfo(
      fromDateStr,
      toDateStr,
      10,
    );
    if (!Array.isArray(mostSpentCompanies) || mostSpentCompanies.length === 0) {
      setMostSpentCompanies([]);
      return;
    }
    const spentCompaniesFormatted = getSpendingsPieFormatData(
      mostSpentCompanies,
      true,
    ) as ChartPiePoint[];
    spentCompaniesFormatted.push({
      id: "Ostalo",
      value:
        Number(receiptsInfo.totalSpent || 0) -
        sumSpendings(spentCompaniesFormatted),
    });
    setMostSpentCompanies(spentCompaniesFormatted);
  }, [fromDateStr, toDateStr, receiptsInfo.totalSpent]);

  const getMostVisitedCompanies = useCallback(async () => {
    const mostVisitedCompanies =
      await apiRef.current.getMostVisitedCompaniesInfo(
        fromDateStr,
        toDateStr,
        10,
      );
    if (
      !Array.isArray(mostVisitedCompanies) ||
      mostVisitedCompanies.length === 0
    ) {
      setMostVisitedCompanies([]);
      return;
    }
    const visitedCompaniesFormatted = getVisitsPieFormatData(
      mostVisitedCompanies,
      true,
    ) as ChartPiePoint[];
    visitedCompaniesFormatted.push({
      id: "Ostalo",
      value:
        Number(receiptsInfo.receiptsCount || 0) -
        countReceipts(visitedCompaniesFormatted),
    });
    setMostVisitedCompanies(visitedCompaniesFormatted);
  }, [fromDateStr, toDateStr, receiptsInfo.receiptsCount]);

  const getMostSpentTypes = useCallback(async () => {
    const mostSpentTypes = await apiRef.current.getMostSpentTypesInfo(
      fromDateStr,
      toDateStr,
      10,
    );
    if (!Array.isArray(mostSpentTypes) || mostSpentTypes.length === 0) {
      setMostSpentTypes([]);
      return;
    }
    const spentTypesFormatted = getSpendingsPieFormatData(
      mostSpentTypes,
      false,
    ) as ChartPiePoint[];
    spentTypesFormatted.push({
      id: "Ostalo",
      value:
        Number(receiptsInfo.totalSpent || 0) -
        sumSpendings(spentTypesFormatted),
    });
    setMostSpentTypes(spentTypesFormatted);
  }, [fromDateStr, toDateStr, receiptsInfo.totalSpent]);

  const getMostVisitedTypes = useCallback(async () => {
    const mostVisitedTypes = await apiRef.current.getMostVisitedTypesInfo(
      fromDateStr,
      toDateStr,
      10,
    );
    if (!Array.isArray(mostVisitedTypes) || mostVisitedTypes.length === 0) {
      setMostVisitedTypes([]);
      return;
    }
    const visitedTypesFormatted = getVisitsPieFormatData(
      mostVisitedTypes,
      false,
    ) as ChartPiePoint[];
    visitedTypesFormatted.push({
      id: "Ostalo",
      value:
        Number(receiptsInfo.receiptsCount || 0) -
        countReceipts(visitedTypesFormatted),
    });
    setMostVisitedTypes(visitedTypesFormatted);
  }, [fromDateStr, toDateStr, receiptsInfo.receiptsCount]);

  const getMostValuableItems = useCallback(async () => {
    const mostValuableItems = await apiRef.current.getValuableItems(
      fromDateStr,
      toDateStr,
      10,
    );
    if (!Array.isArray(mostValuableItems) || mostValuableItems.length === 0) {
      setMostValuableItems([]);
      return;
    }
    const mostValuableItemsFormatted = getMostValItemsFormat(
      mostValuableItems,
    ) as ChartBarPoint[];
    setMostValuableItems(mostValuableItemsFormatted);
  }, [fromDateStr, toDateStr]);

  const getStatPlots = useCallback(async () => {
    const plots = (await apiRef.current.getStatPlots(
      fromDateStr,
      toDateStr,
      10,
    )) as StatPlotsView;
    setStatPlots(plots);
    setPlotsLoading(false);
  }, [fromDateStr, toDateStr]);

  const applyFilters = useCallback(async () => {
    setStatsLoading(true);
    getBaseStats();
    getReceiptsInfo();
    getReceiptsByWeekday();
    getReceiptsByMonth();
    getReceiptsByHour();
    getSpentByHour();
    getSpentByWeekday();
    getSpentByMonth();
    getMostSpentCompanies();
    getMostVisitedCompanies();
    getMostSpentTypes();
    getMostVisitedTypes();
    getMostValuableItems();
    setStatsLoading(false);
  }, [
    getBaseStats,
    getMostSpentCompanies,
    getMostSpentTypes,
    getMostValuableItems,
    getMostVisitedCompanies,
    getMostVisitedTypes,
    getReceiptsByHour,
    getReceiptsByMonth,
    getReceiptsByWeekday,
    getReceiptsInfo,
    getSpentByHour,
    getSpentByMonth,
    getSpentByWeekday,
  ]);

  const generatePdf = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({
      statPlots: statPlots,
      baseStats: baseStats,
      fromDate: fromDate,
      toDate: toDate,
      mostSpentTypes: mostSpentTypes,
    });
  }, [baseStats, fromDate, mostSpentTypes, statPlots, toDate]);

  useEffect(() => {
    applyFilters();
    getStatPlots();
    setPlotsLoading(true);
  }, [fromDate, toDate, applyFilters, getStatPlots]);

  useEffect(() => {
    getMostSpentCompanies();
    getMostVisitedCompanies();
    getMostSpentTypes();
    getMostVisitedTypes();
  }, [
    receiptsInfo,
    getMostSpentCompanies,
    getMostSpentTypes,
    getMostVisitedCompanies,
    getMostVisitedTypes,
  ]);

  useEffect(() => {
    baseStats.totalSpent && statPlots?.spending && generatePdf();
  }, [baseStats.totalSpent, generatePdf, statPlots?.spending]);

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
