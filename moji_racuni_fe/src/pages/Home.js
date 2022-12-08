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

const Home = () => {
  const [lastReceiptInfo, setLastReceiptInfo] = useState({});
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [date, setDate] = useState(getThisMonth());
  const [timeSpan, setTimeSpan] = useState("month");
  const [receiptLinkValid, setReceiptLinkValid] = useState("");
  const [successText, setSuccessText] = useState("");
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
      validation = "Polje za unos ne sme biti prazno!";
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

    const response = await api.addFullReceipt(
      e.target.receiptLink.value.trim()
    );

    if (response === null) {
      setReceiptLinkValid("Došlo je do greške, pokušajte ponovo malo kasnije!");
    } else if (response === 409) {
      setReceiptLinkValid("Ovaj račun ste već uneli!");
    } else {
      setSuccessText("Račun je uspešno dodat!");
      getStats();
      getLastReceipt();
    }
  };

  return (
    <div className="l-container">
      <TypeAnimation
        className="text-animator py-1"
        sequence={[`${capitalize(user.username)}, dobrodošli nazad!`]}
        wrapper="h1"
        speed={20}
        cursor={false}
      />
      <h2 className="pt-4 pt-lg-4">Dodajte novi račun</h2>
      <form className="form form--simple pb-2" onSubmit={addReceipt}>
        <FormGroup
          name="receiptLink"
          text="Link fiskalnog računa"
          type="text"
          error={receiptLinkValid}
          success={successText}
        />
        <button className="btn btn-primary btn-round" type="submit">
          Dodaj račun
        </button>
      </form>
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
      <div className="py-1 py-lg-1">
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
              <Receipt receiptInfo={lastReceiptInfo} />
            ) : (
              <div className="receipt-empty">
                <h3 className="pb-2">Nije pronađen nijedan račun...</h3>
                <p>
                  Dodajte barem jedan račun da bi se prikazao u ovoj sekciji.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
