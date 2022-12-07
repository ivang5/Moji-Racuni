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

const Home = () => {
  const [lastReceiptInfo, setLastReceiptInfo] = useState({});
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [date, setDate] = useState(getThisMonth());
  const [timeSpan, setTimeSpan] = useState("month");
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
    setReceiptsLoading(true);
    const receiptInfo = await api.getLastReceiptFull();
    setLastReceiptInfo(receiptInfo);
    setReceiptsLoading(false);
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

      <a href="#" className="btn btn-primary btn-round btn-lg fs-4">
        Dodaj račun
      </a>
      {stats.totalSpent && (
        <StatPanel
          stats={stats}
          timeSpan={timeSpan}
          setTimeSpan={setTimeSpan}
          statsLoading={statsLoading}
        />
      )}
      <div className="py-1 py-lg-1">
        <h2>Poslednji dodati račun</h2>
        {lastReceiptInfo.receipt ? (
          <Receipt receiptInfo={lastReceiptInfo} />
        ) : (
          <div className="receipt-empty">
            <h3 className="pb-2">Nije pronađen nijedan račun...</h3>
            <p>Dodajte barem jedan račun da bi se prikazao u ovoj sekciji.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
