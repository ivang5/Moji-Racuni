import React, { useState, useEffect, useContext } from "react";
import Receipt from "../components/Receipt";
import StatPanel from "../components/StatPanel";
import AuthContext from "../context/AuthContext";
import useApi from "../utils/useApi";
import {
  getThisMonth,
  getThisYear,
  getAllTime,
  capitalize,
} from "../utils/utils";
import { TypeAnimation } from "react-type-animation";
import FormGroup from "../components/FormGroup";
import InfoIcon from "../icons/info-icon.png";
import Toast from "../components/Toast";

const Home = () => {
  const [lastReceiptInfo, setLastReceiptInfo] = useState({});
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [addingReceipt, setAddingReceipt] = useState(false);
  const [date, setDate] = useState(getThisMonth());
  const [timeSpan, setTimeSpan] = useState("month");
  const [receiptLinkValid, setReceiptLinkValid] = useState("");
  const [successText, setSuccessText] = useState("");
  const [toast, setToast] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const api = useApi();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    getLastReceipt();
  }, []);

  useEffect(() => {
    if (timeSpan === "month") {
      setDate(getThisMonth);
    } else if (timeSpan === "year") {
      setDate(getThisYear);
    } else {
      setDate(getAllTime);
    }
  }, [timeSpan]);

  useEffect(() => {
    getStats();
  }, [date]);

  const getStats = async () => {
    setStatsLoading(true);
    const baseStats = await api.getBaseStats(date.dateFrom, date.dateTo, 1);
    setStats(baseStats);
    setStatsLoading(false);
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

  const addReceipt = async (e) => {
    e.preventDefault();
    setReceiptLinkValid("");
    setSuccessText("");
    let valid = true;
    let validation = "";

    if (e.target.receiptLink.value.trim() === "") {
      validation = "Polje za unos ra??una ne sme biti prazno!";
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
        "Do??lo je do gre??ke, proverite da li ste uneli validan link i poku??ajte ponovo!"
      );
    } else if (response === 409) {
      setReceiptLinkValid("Ovaj ra??un ste ve?? uneli!");
    } else {
      setSuccessText("Ra??un je uspe??no dodat!");
      getStats();
      getLastReceipt();
      setToast({
        title: "Uspe??no",
        text: "Ra??un je uspe??no dodat.",
      });
      openToast();
    }
  };

  const openToast = () => {
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 7000);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  return (
    <>
      <div className="l-container">
        <TypeAnimation
          className="text-animator py-1"
          sequence={[`${capitalize(user.username)}, dobrodo??li nazad!`]}
          wrapper="h1"
          speed={20}
          cursor={false}
        />
        {user.role === "REGULAR" && (
          <>
            <h2 className="pt-4 pt-lg-4">
              Dodajte ra??un{" "}
              <div className="info">
                <img className="info__icon" src={InfoIcon} alt="info" />
                <div className="info__body">
                  <ul className="info__list">
                    <li>
                      Za dodavanje novog ra??una unesite link koji dobijete
                      skeniranjem QR koda sa fiskalnog ra??una.
                    </li>
                    <br />
                    <li>
                      Ukoliko unesete validan link, a dobijete gre??ku, izdavalac
                      ra??una verovatno jo?? uvek nije uneo ra??un u sistem.
                    </li>
                  </ul>
                </div>
              </div>
            </h2>
            <form className="form form--simple pb-2" onSubmit={addReceipt}>
              <FormGroup
                name="receiptLink"
                text="Link fiskalnog ra??una"
                type="text"
                error={receiptLinkValid}
                success={successText}
              />
              {!addingReceipt ? (
                <button className="btn btn-primary btn-round" type="submit">
                  Dodaj ra??un
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
        {user.role === "REGULAR" && (
          <div className="py-1 py-lg-1">
            <h2>Poslednji ra??un</h2>
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
                  <Receipt receiptInfo={lastReceiptInfo} />
                ) : (
                  <div className="receipt-empty">
                    <h3 className="pb-2">Nije prona??en nijedan ra??un...</h3>
                    <p>
                      Dodajte barem jedan ra??un da bi se prikazao u ovoj
                      sekciji.
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
