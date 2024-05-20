import React from "react";
import { useState } from "react";
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
import { useEffect } from "react";
import Chart from "../components/Chart";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Review from "../components/Review";
import InfoIcon from "../icons/info-icon.png";

const Statistics = () => {
  const [showSpendings, setShowSpendings] = useState(true);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [baseStats, setBaseStats] = useState({});
  const [receiptsByHour, setReceiptsByHour] = useState([]);
  const [receiptsByWeekday, setReceiptsByWeekday] = useState([]);
  const [receiptsByMonth, setReceiptsByMonth] = useState([]);
  const [spentByHour, setSpentByHour] = useState([]);
  const [spentByWeekday, setSpentByWeekday] = useState([]);
  const [spentByMonth, setSpentByMonth] = useState([]);
  const [mostSpentCompanies, setMostSpentCompanies] = useState([]);
  const [mostVisitedCompanies, setMostVisitedCompanies] = useState([]);
  const [mostSpentTypes, setMostSpentTypes] = useState([]);
  const [mostVisitedTypes, setMostVisitedTypes] = useState([]);
  const [mostValuableItems, setMostValuableItems] = useState([]);
  const [receiptsInfo, setReceiptsInfo] = useState({});
  const [fromDate, setFromDate] = useState(getTenYearsAgo());
  const [toDate, setToDate] = useState(getTomorrow());
  const [searchOpen, setSearchOpen] = useState(false);
  const [statPlots, setStatPlots] = useState({});
  const [plotsLoading, setPlotsLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    applyFilters();
    getStatPlots();
    setPlotsLoading(true);
  }, [fromDate, toDate]);

  useEffect(() => {
    getMostSpentCompanies();
    getMostVisitedCompanies();
    getMostSpentTypes();
    getMostVisitedTypes();
  }, [receiptsInfo]);

  const getBaseStats = async () => {
    const baseStats = await api.getBaseStats(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      1
    );
    setBaseStats(baseStats);
  };

  const getReceiptsInfo = async () => {
    const receiptsInfo = await api.getTotalSpent(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    setReceiptsInfo(receiptsInfo);
  };

  const getReceiptsByHour = async () => {
    const receiptsCount = await api.getReceiptsByHour(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByHour([]);
      return;
    }
    const receiptsCountFormatted = getHoursFromNumbers(receiptsCount, "count");
    setReceiptsByHour(receiptsCountFormatted);
  };

  const getReceiptsByWeekday = async () => {
    const receiptsCount = await api.getReceiptsByWeekday(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByWeekday([]);
      return;
    }
    const receiptsCountFormatted = getWeekdaysFromNumbers(
      receiptsCount,
      "count"
    );
    setReceiptsByWeekday(receiptsCountFormatted);
  };

  const getReceiptsByMonth = async () => {
    const receiptsCount = await api.getReceiptsByMonth(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(receiptsCount, "count")) {
      setReceiptsByMonth([]);
      return;
    }
    const receiptsCountFormatted = getMonthsFromNumbers(receiptsCount, "count");
    setReceiptsByMonth(receiptsCountFormatted);
  };

  const getSpentByHour = async () => {
    const moneySpent = await api.getSpentByHour(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByHour([]);
      return;
    }
    const moneySpentFormatted = getHoursFromNumbers(moneySpent, "spent");
    setSpentByHour(moneySpentFormatted);
  };

  const getSpentByWeekday = async () => {
    const moneySpent = await api.getSpentByWeekday(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByWeekday([]);
      return;
    }
    const moneySpentFormatted = getWeekdaysFromNumbers(moneySpent, "spent");
    setSpentByWeekday(moneySpentFormatted);
  };

  const getSpentByMonth = async () => {
    const moneySpent = await api.getSpentByMonth(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate)
    );
    if (isChartEmpty(moneySpent, "spent")) {
      setSpentByMonth([]);
      return;
    }
    const moneySpentFormatted = getMonthsFromNumbers(moneySpent, "spent");
    setSpentByMonth(moneySpentFormatted);
  };

  const getMostSpentCompanies = async () => {
    const mostSpentCompanies = await api.getMostSpentCompaniesInfo(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    if (mostSpentCompanies.length === 0) {
      setMostSpentCompanies([]);
      return;
    }
    const spentCompaniesFormatted = getSpendingsPieFormatData(
      mostSpentCompanies,
      true
    );
    spentCompaniesFormatted.push({
      id: "Ostalo",
      value: receiptsInfo.totalSpent - sumSpendings(spentCompaniesFormatted),
    });
    setMostSpentCompanies(spentCompaniesFormatted);
  };

  const getMostVisitedCompanies = async () => {
    const mostVisitedCompanies = await api.getMostVisitedCompaniesInfo(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    if (mostVisitedCompanies.length === 0) {
      setMostVisitedCompanies([]);
      return;
    }
    const visitedCompaniesFormatted = getVisitsPieFormatData(
      mostVisitedCompanies,
      true
    );
    visitedCompaniesFormatted.push({
      id: "Ostalo",
      value:
        receiptsInfo.receiptsCount - countReceipts(visitedCompaniesFormatted),
    });
    setMostVisitedCompanies(visitedCompaniesFormatted);
  };

  const getMostSpentTypes = async () => {
    const mostSpentTypes = await api.getMostSpentTypesInfo(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    if (mostSpentTypes.length === 0) {
      setMostSpentTypes([]);
      return;
    }
    const spentTypesFormatted = getSpendingsPieFormatData(
      mostSpentTypes,
      false
    );
    spentTypesFormatted.push({
      id: "Ostalo",
      value: receiptsInfo.totalSpent - sumSpendings(spentTypesFormatted),
    });
    setMostSpentTypes(spentTypesFormatted);
  };

  const getMostVisitedTypes = async () => {
    const mostVisitedTypes = await api.getMostVisitedTypesInfo(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    if (mostVisitedTypes.length === 0) {
      setMostVisitedTypes([]);
      return;
    }
    const visitedTypesFormatted = getVisitsPieFormatData(
      mostVisitedTypes,
      false
    );
    visitedTypesFormatted.push({
      id: "Ostalo",
      value: receiptsInfo.receiptsCount - countReceipts(visitedTypesFormatted),
    });
    setMostVisitedTypes(visitedTypesFormatted);
  };

  const getMostValuableItems = async () => {
    const mostValuableItems = await api.getValuableItems(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    if (mostValuableItems.length === 0) {
      setMostValuableItems([]);
      return;
    }
    const mostValuableItemsFormatted = getMostValItemsFormat(mostValuableItems);
    setMostValuableItems(mostValuableItemsFormatted);
  };

  const getStatPlots = async () => {
    const plots = await api.getStatPlots(
      dateBEFormatter(fromDate),
      dateBEFormatter(toDate),
      10
    );
    setStatPlots(plots);
    await new Promise(() => setTimeout(setPlotsLoading(false), 500));
  };

  const applyFilters = async () => {
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
  };

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
                    onChange={(date) => setFromDate(date)}
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
                    onChange={(date) => setToDate(date)}
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
                  {plotsLoading ? (
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
                      <PDFDownloadLink
                        document={
                          <Review
                            statPlots={statPlots}
                            baseStats={baseStats}
                            fromDate={fromDate}
                            toDate={toDate}
                            showCompanyTypes={
                              mostSpentTypes.length > 1 ? true : false
                            }
                          />
                        }
                        fileName="File"
                      >
                        <button
                          className="btn btn-primary btn-round"
                          type="button"
                        >
                          Preuzmi PDF
                        </button>
                      </PDFDownloadLink>
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
                    {baseStats.mostSpentInADay.mostSpent
                      ? formatPrice(baseStats.mostSpentInADay.mostSpent)
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
            <h2 className="statistics__chart-wrapper-title mt-4">
              - Potrošnja
            </h2>
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
            <h2 className="statistics__chart-wrapper-title mt-4">
              - Broj računa
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
                    {baseStats.MostVisitedCompaniesInfo[0]
                      ? baseStats.MostVisitedCompaniesInfo[0].companyName
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
            <h2 className="statistics__chart-wrapper-title mt-4">
              - Preduzeća
            </h2>
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
            <h2 className="statistics__chart-wrapper-title mt-4">
              - Tipovi preduzeća
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
                    {baseStats.mostValuableItems[0]
                      ? baseStats.mostValuableItems[0].name
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
            <h2 className="statistics__chart-wrapper-title mt-4">
              - Stavke računa
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
