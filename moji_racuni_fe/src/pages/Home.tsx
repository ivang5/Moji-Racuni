import React, { useMemo, useRef, useState } from "react";
import Receipt from "../components/Receipt";
import StatPanel from "../components/StatPanel";
import { getPercentageChange, capitalize } from "../utils/utils";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import InfoIcon from "../icons/info-icon.png";
import Toast from "../components/Toast";
import Report from "../components/Report";
import useToast from "../hooks/useToast";
import { validateReceiptLink } from "../utils/validators";
import useAuthUser from "../hooks/useAuthUser";
import useHomeBaseStatsQuery from "../hooks/queries/useHomeBaseStatsQuery";
import useLastReceiptFullQuery from "../hooks/queries/useLastReceiptFullQuery";
import useLastReportQuery from "../hooks/queries/useLastReportQuery";
import useAddFullReceiptMutation from "../hooks/mutations/useAddFullReceiptMutation";
import { ApiError } from "../api/errors";
import type {
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

const EMPTY_PERCENTAGE_CHANGES: PercentageChanges = {
  totalSpent: null,
  unitCount: null,
  mostVisitedCompanyReceiptCount: null,
  mostVisitedCompanyPriceSum: null,
  mostValuableItemPrice: null,
};

const Home = () => {
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("month");
  const [receiptLinkValid, setReceiptLinkValid] = useState("");
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const { userRole, username } = useAuthUser();
  const { toast, toastOpen, showToast, closeToast } = useToast(10000);
  const statsQuery = useHomeBaseStatsQuery(timeSpan, "current");
  const previousStatsQuery = useHomeBaseStatsQuery(timeSpan, "previous");
  const lastReceiptQuery = useLastReceiptFullQuery(userRole === "REGULAR");
  const lastReportQuery = useLastReportQuery(userRole === "ADMIN");
  const addFullReceiptMutation = useAddFullReceiptMutation();

  const stats = statsQuery.data;
  const previousStats = previousStatsQuery.data;
  const statsLoading =
    statsQuery.isLoading ||
    statsQuery.isFetching ||
    (timeSpan !== "all" &&
      (previousStatsQuery.isLoading || previousStatsQuery.isFetching));

  const percentageChanges = useMemo<PercentageChanges>(() => {
    if (
      timeSpan === "all" ||
      !stats?.totalSpent ||
      !previousStats?.totalSpent
    ) {
      return EMPTY_PERCENTAGE_CHANGES;
    }

    return {
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
          previousStats.MostVisitedCompaniesInfo?.[0]?.receiptCount,
          stats.MostVisitedCompaniesInfo?.[0]?.receiptCount,
        ),
      ),
      mostVisitedCompanyPriceSum: toNullableNumber(
        getPercentageChange(
          previousStats.MostVisitedCompaniesInfo?.[0]?.priceSum,
          stats.MostVisitedCompaniesInfo?.[0]?.priceSum,
        ),
      ),
      mostValuableItemPrice: toNullableNumber(
        getPercentageChange(
          previousStats.mostValuableItems?.[0]?.price,
          stats.mostValuableItems?.[0]?.price,
        ),
      ),
    };
  }, [
    previousStats?.MostVisitedCompaniesInfo,
    previousStats?.mostValuableItems,
    previousStats?.totalSpent,
    previousStats?.visitedCompaniesInfo?.unitCount,
    stats,
    timeSpan,
  ]);

  const addingReceipt = addFullReceiptMutation.isPending;
  const receiptLoading =
    lastReceiptQuery.isLoading || lastReceiptQuery.isFetching;
  const reportLoading = lastReportQuery.isLoading || lastReportQuery.isFetching;
  const lastReceiptInfo = lastReceiptQuery.data;
  const lastReport = lastReportQuery.data;

  const addReceipt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as AddReceiptForm;
    setReceiptLinkValid("");
    const validationMessage = validateReceiptLink(form.receiptLink.value);

    if (validationMessage !== "") {
      setReceiptLinkValid(validationMessage);
      return;
    }

    try {
      await addFullReceiptMutation.mutateAsync(form.receiptLink.value.trim());
    } catch (error) {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        setReceiptLinkValid("Ovaj račun ste već uneli!");
        return;
      }

      setReceiptLinkValid(
        "Došlo je do greške, proverite da li ste uneli validan link i pokušajte ponovo!",
      );
      return;
    }

    showToast({
      title: "Uspešno",
      text: "Račun je uspešno dodat.",
    });

    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
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
                success=""
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
        {stats?.totalSpent ? (
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
                {lastReceiptInfo?.receipt ? (
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
                {lastReport?.receipt ? (
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
