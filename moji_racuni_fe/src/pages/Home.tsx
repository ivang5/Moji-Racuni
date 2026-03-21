import React, { useState, useEffect, useRef, useCallback } from "react";
import Receipt from "../components/Receipt";
import StatPanel from "../components/StatPanel";
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
import useToast from "../hooks/useToast";
import { validateReceiptLink } from "../utils/validators";
import useAuthUser from "../hooks/useAuthUser";
import type {
  ExtendedStats,
  PercentageChanges,
  ReceiptInfoView,
  ReportInfoView,
  StatSummary,
  TimeSpan,
} from "../types/viewModels";

type AddReceiptForm = HTMLFormElement & {
  receiptLink: HTMLInputElement;
};

const toNullableNumber = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }

  return Number(value);
};

const Home = () => {
  const [lastReceiptInfo, setLastReceiptInfo] = useState<
    Partial<ReceiptInfoView>
  >({});
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [lastReport, setLastReport] = useState<Partial<ReportInfoView>>({});
  const [reportLoading, setReportLoading] = useState(true);
  const [stats, setStats] = useState<Partial<ExtendedStats>>({});
  const [previousStats, setPreviousStats] = useState<Partial<ExtendedStats>>(
    {},
  );
  const [statsLoading, setStatsLoading] = useState(true);
  const [addingReceipt, setAddingReceipt] = useState(false);
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("month");
  const [percentageChanges, setPercentageChanges] = useState<PercentageChanges>(
    {
      totalSpent: null,
      unitCount: null,
      mostVisitedCompanyReceiptCount: null,
      mostVisitedCompanyPriceSum: null,
      mostSpentReceipt: null,
    },
  );
  const [receiptLinkValid, setReceiptLinkValid] = useState("");
  const [successText, setSuccessText] = useState("");
  const statsRequestIdRef = useRef(0);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const api = useApi();
  const apiRef = useRef(api);
  const { userRole, username } = useAuthUser();
  const { toast, toastOpen, showToast, closeToast } = useToast(10000);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const loadStatsForTimeSpan = useCallback(async () => {
    const requestId = ++statsRequestIdRef.current;
    setStatsLoading(true);
    setPercentageChanges({
      totalSpent: null,
      unitCount: null,
      mostVisitedCompanyReceiptCount: null,
      mostVisitedCompanyPriceSum: null,
      mostSpentReceipt: null,
    });

    const currentDate =
      timeSpan === "month"
        ? getThisMonth()
        : timeSpan === "year"
          ? getThisYear()
          : getAllTime();

    const currentPreviousDate =
      timeSpan === "month" ? getLastMonth() : getLastYear();

    const statsPromise = apiRef.current.getBaseStats(
      currentDate.dateFrom,
      currentDate.dateTo,
      1,
    );

    const previousStatsPromise =
      timeSpan === "all"
        ? Promise.resolve(null)
        : apiRef.current.getBaseStats(
            currentPreviousDate.dateFrom,
            currentPreviousDate.dateTo,
            1,
          );

    const [baseStats, basePreviousStats] = await Promise.all([
      statsPromise,
      previousStatsPromise,
    ]);

    if (requestId !== statsRequestIdRef.current) {
      return;
    }

    setStats(baseStats || {});
    setPreviousStats(basePreviousStats || {});
    setStatsLoading(false);
  }, [timeSpan]);

  const getLastReceipt = useCallback(async () => {
    if (userRole !== "REGULAR") {
      return;
    }
    setReceiptLoading(true);
    const receiptInfo = await apiRef.current.getLastReceiptFull();
    setLastReceiptInfo(receiptInfo);
    setReceiptLoading(false);
  }, [userRole]);

  const getLastReport = useCallback(async () => {
    if (userRole !== "ADMIN") {
      return;
    }
    setReportLoading(true);
    const report = await apiRef.current.getLastReport();
    setLastReport(report);
    setReportLoading(false);
  }, [userRole]);

  useEffect(() => {
    getLastReceipt();
    getLastReport();
  }, [getLastReceipt, getLastReport]);

  useEffect(() => {
    loadStatsForTimeSpan();
  }, [loadStatsForTimeSpan]);

  useEffect(() => {
    if (stats.totalSpent && previousStats.totalSpent && timeSpan !== "all") {
      const changes = {
        totalSpent: toNullableNumber(
          getPercentageChange(
            previousStats.totalSpent.totalSpent,
            stats.totalSpent.totalSpent,
          ),
        ),
        unitCount: toNullableNumber(
          getPercentageChange(
            previousStats.visitedCompaniesInfo?.unitCount,
            stats.visitedCompaniesInfo?.unitCount,
          ),
        ),
        mostVisitedCompanyReceiptCount: toNullableNumber(
          getPercentageChange(
            previousStats.MostVisitedCompaniesInfo[0]?.receiptCount,
            stats.MostVisitedCompaniesInfo[0]?.receiptCount,
          ),
        ),
        mostVisitedCompanyPriceSum: toNullableNumber(
          getPercentageChange(
            previousStats.MostVisitedCompaniesInfo[0]?.priceSum,
            stats.MostVisitedCompaniesInfo[0]?.priceSum,
          ),
        ),
        mostSpentReceipt: toNullableNumber(
          getPercentageChange(
            previousStats.totalSpent?.mostSpentReceipt,
            stats.totalSpent?.mostSpentReceipt,
          ),
        ),
      };

      setPercentageChanges(changes);
    }
  }, [
    previousStats.MostVisitedCompaniesInfo,
    previousStats.totalSpent,
    previousStats.visitedCompaniesInfo?.unitCount,
    stats,
    timeSpan,
  ]);

  const addReceipt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as AddReceiptForm;
    setReceiptLinkValid("");
    setSuccessText("");
    const validationMessage = validateReceiptLink(form.receiptLink.value);

    if (validationMessage !== "") {
      setReceiptLinkValid(validationMessage);
      return;
    }

    setAddingReceipt(true);

    const response = await api.addFullReceipt(form.receiptLink.value.trim());

    setAddingReceipt(false);

    if (response === null) {
      setReceiptLinkValid(
        "Došlo je do greške, proverite da li ste uneli validan link i pokušajte ponovo!",
      );
    } else if (response === 409) {
      setReceiptLinkValid("Ovaj račun ste već uneli!");
    } else {
      loadStatsForTimeSpan();
      getLastReceipt();
      showToast({
        title: "Uspešno",
        text: "Račun je uspešno dodat.",
      });

      if (receiptInputRef.current) {
        receiptInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="l-container">
        <TypeAnimation
          className="text-animator py-1"
          sequence={[`${capitalize(username || "")}, dobrodošli nazad!`]}
          wrapper="h1"
          speed={20}
          cursor={false}
        />
        {userRole === "REGULAR" && (
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
            stats={stats as StatSummary}
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
        {userRole === "REGULAR" ? (
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
                  <Receipt
                    receiptInfo={lastReceiptInfo as ReceiptInfoView}
                    fullWidth={true}
                  />
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
                  <Report
                    reportInfo={lastReport as ReportInfoView}
                    hasLink={true}
                  />
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
