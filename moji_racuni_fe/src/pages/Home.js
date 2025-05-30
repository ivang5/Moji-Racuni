import React, { useState, useEffect, useContext, useRef } from "react";
import Receipt from "../components/Receipt";
import StatPanel from "../components/StatPanel";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import {
  getThisMonth,
  getLastMonth,
  getThisYear,
  getLastYear,
  getAllTime,
  getPercentageChange,
  capitalize,
} from "../utils/utils";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import InfoIcon from "../icons/info-icon.png";
import Toast from "../components/Toast";
import Report from "../components/Report";

const Home = () => {
  const [lastReceiptInfo, setLastReceiptInfo] = useState({});
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [lastReport, setLastReport] = useState({});
  const [reportLoading, setReportLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [previousStats, setPreviousStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [addingReceipt, setAddingReceipt] = useState(false);
  const [date, setDate] = useState(getThisMonth());
  const [previousDate, setPreviousDate] = useState(getLastMonth());
  const [timeSpan, setTimeSpan] = useState("month");
  const [percentageChanges, setPercentageChanges] = useState({});
  const [receiptLinkValid, setReceiptLinkValid] = useState("");
  const [successText, setSuccessText] = useState("");
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const receiptInputRef = useRef(null);
  const api = useApi();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    getLastReceipt();
    getLastReport();
  }, []);

  useEffect(() => {
    if (timeSpan === "month") {
      setDate(getThisMonth);
      setPreviousDate(getLastMonth);
    } else if (timeSpan === "year") {
      setDate(getThisYear);
      setPreviousDate(getLastYear);
    } else {
      setDate(getAllTime);
    }
  }, [timeSpan]);

  useEffect(() => {
    if (timeSpan !== "all") {
      getPreviousStats();
    }
    getStats();
  }, [date]);

  useEffect(() => {
    if (stats.totalSpent && previousStats.totalSpent && timeSpan !== "all") {
      const changes = {
        totalSpent: getPercentageChange(
          previousStats.totalSpent.totalSpent,
          stats.totalSpent.totalSpent
        ),
        unitCount: getPercentageChange(
          previousStats.visitedCompaniesInfo?.unitCount,
          stats.visitedCompaniesInfo?.unitCount
        ),
        mostVisitedCompanyReceiptCount: getPercentageChange(
          previousStats.MostVisitedCompaniesInfo[0]?.receiptCount,
          stats.MostVisitedCompaniesInfo[0]?.receiptCount
        ),
        mostVisitedCompanyPriceSum: getPercentageChange(
          previousStats.MostVisitedCompaniesInfo[0]?.priceSum,
          stats.MostVisitedCompaniesInfo[0]?.priceSum
        ),
        mostSpentReceipt: getPercentageChange(
          previousStats.totalSpent?.mostSpentReceipt,
          stats.totalSpent?.mostSpentReceipt
        ),
      };

      setPercentageChanges(changes);
    }
  }, [stats]);

  const getStats = async () => {
    setStatsLoading(true);
    const baseStats = await api.getBaseStats(date.dateFrom, date.dateTo, 1);
    setStats(baseStats);
    setStatsLoading(false);
  };

  const getPreviousStats = async () => {
    const baseStats = await api.getBaseStats(
      previousDate.dateFrom,
      previousDate.dateTo,
      1
    );
    setPreviousStats(baseStats);
  };

  const getLastReceipt = async () => {
    if (user.role !== "REGULAR") {
      return;
    }
    setReceiptLoading(true);
    const receiptInfo = await api.getLastReceiptFull();
    setLastReceiptInfo(receiptInfo);
    setReceiptLoading(false);
  };

  const getLastReport = async () => {
    if (user.role !== "ADMIN") {
      return;
    }
    setReportLoading(true);
    const report = await api.getLastReport();
    setLastReport(report);
    setReportLoading(false);
  };

  const addReceipt = async (e) => {
    e.preventDefault();
    setReceiptLinkValid("");
    setSuccessText("");
    let valid = true;
    let validation = "";

    if (e.target.receiptLink.value.trim() === "") {
      validation = "Polje za unos računa ne sme biti prazno!";
      valid = false;
    } else if (
      !e.target.receiptLink.value.trim().startsWith("https://suf.purs.gov.rs/")
    ) {
      validation = "Uneti link nije validan!";
      valid = false;
    }

    if (!valid) {
      setReceiptLinkValid(validation);
      return;
    }

    setAddingReceipt(true);

    const response = await api.addFullReceipt(
      e.target.receiptLink.value.trim()
    );

    setAddingReceipt(false);

    if (response === null) {
      setReceiptLinkValid(
        "Došlo je do greške, proverite da li ste uneli validan link i pokušajte ponovo!"
      );
    } else if (response === 409) {
      setReceiptLinkValid("Ovaj račun ste već uneli!");
    } else {
      getStats();
      getLastReceipt();
      setToast({
        title: "Uspešno",
        text: "Račun je uspešno dodat.",
      });
      openToast();

      if (receiptInputRef.current) {
        receiptInputRef.current.value = "";
      }
    }
  };

  const openToast = () => {
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 10000);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  return (
    <>
      <div className="l-container">
        <TypeAnimation
          className="text-animator py-1"
          sequence={[`${capitalize(user.username)}, dobrodošli nazad!`]}
          wrapper="h1"
          speed={20}
          cursor={false}
        />
        {user.role === "REGULAR" && (
          <>
            <h2 className="pt-4 pt-lg-4">
              Dodajte račun{" "}
              <div className="info">
                <img className="info__icon" src={InfoIcon} alt="info" />
                <div className="info__body">
                  <ul className="info__list">
                    <li>
                      Za dodavanje novog računa unesite link koji dobijete
                      skeniranjem QR koda sa fiskalnog računa.
                    </li>
                    <br />
                    <li>
                      Ukoliko unesete validan link, a dobijete grešku, izdavalac
                      računa verovatno još uvek nije uneo račun u sistem.
                    </li>
                  </ul>
                </div>
              </div>
            </h2>
            <form className="form form--simple pb-2" onSubmit={addReceipt}>
              <FormGroup
                ref={receiptInputRef}
                name="receiptLink"
                text="Link fiskalnog računa"
                type="text"
                error={receiptLinkValid}
                success={successText}
              />
              {!addingReceipt ? (
                <button className="btn btn-primary btn-round" type="submit">
                  Dodaj račun
                </button>
              ) : (
                <div className="btn btn-primary btn-round btn-spinner">
                  <div className="spinner spinner--sm">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
        {stats.totalSpent ? (
          <StatPanel
            stats={stats}
            timeSpan={timeSpan}
            setTimeSpan={setTimeSpan}
            percentageChanges={percentageChanges}
            statsLoading={statsLoading}
          />
        ) : (
          <>
            <h2 className="mt-4">Statistika</h2>
            <div className="stat-panel-empty mb-4">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </>
        )}
        {user.role === "REGULAR" ? (
          <div className="pb-4 pt-2">
            <h2>Poslednji račun</h2>
            {receiptLoading ? (
              <div className="receipt-empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : (
              <>
                {lastReceiptInfo.receipt ? (
                  <Receipt receiptInfo={lastReceiptInfo} fullWidth={true} />
                ) : (
                  <div className="receipt-empty">
                    <h3 className="pb-2">Nije pronađen nijedan račun...</h3>
                    <p>
                      Dodajte barem jedan račun da bi se prikazao u ovoj
                      sekciji.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="pb-4 pt-2">
            <h2>Poslednja prijava</h2>
            {reportLoading ? (
              <div className="receipt-empty">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : (
              <>
                {lastReport.receipt ? (
                  <Report reportInfo={lastReport} hasLink={true} />
                ) : (
                  <div className="receipt-empty">
                    <h3 className="pb-2">Nije pronađena nijedna prijava...</h3>
                    <p>
                      Kada bude postojala barem jedna prijava biće prikazana
                      ovde.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {toastOpen && (
        <Toast title={toast.title} text={toast.text} close={closeToast} />
      )}
    </>
  );
};

export default Home;
