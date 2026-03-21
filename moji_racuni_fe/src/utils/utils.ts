import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

type NumericLike = number | string;
type CountOrSpent = "count" | "spent";
type VisitPoint = { value: number };
type PlotAgg = {
  hourNum?: number;
  dayofweek?: number;
  monthNum?: number;
  count?: number;
  spent?: number;
  companyName?: string;
  companyType?: string;
  priceSum?: number;
  receiptCount?: number;
  name?: string;
  price?: number;
};

export const dateFormatter = (date: Date | string) => {
  return dayjs(date).format("DD/MM/YYYY");
};

export const dateBEFormatter = (date: Date | string) => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const dateTimeFormatter = (date: Date | string) => {
  return dayjs.utc(date).format("DD/MM/YYYY - HH:mm:ss");
};

export const dateTimeBEFormatter = (date: Date | string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

export const getTomorrow = () => {
  const today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
};

export const getThisMonth = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(
    new Date(date.getFullYear(), date.getMonth()),
  );
  const dateTo = dateBEFormatter(
    new Date(date.getFullYear(), date.getMonth() + 1, 1),
  );
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getLastMonth = () => {
  const date = new Date();
  const lastMonthYear =
    date.getMonth() !== 0 ? date.getFullYear() : date.getFullYear() - 1;

  const dateFrom = dateBEFormatter(
    new Date(lastMonthYear, date.getMonth() - 1),
  );
  const dateTo = dateBEFormatter(
    new Date(date.getFullYear(), date.getMonth(), 1),
  );

  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getThisYear = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(new Date(date.getFullYear(), 0, 1));
  const dateTo = dateBEFormatter(new Date(date.getFullYear() + 1, 0, 1));
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getLastYear = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(new Date(date.getFullYear() - 1, 0, 1));
  const dateTo = dateBEFormatter(new Date(date.getFullYear(), 0, 1));
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getAllTime = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(
    new Date(date.getFullYear() - 10, date.getMonth()),
  );
  const dateTo = dateBEFormatter(new Date(date.getFullYear() + 1, 0, 1));
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getTenYearsAgo = () => {
  const date = new Date();
  return new Date(date.getFullYear() - 10, date.getMonth(), date.getDate());
};

export const getPercentageChange = (
  oldNum: number | null | undefined,
  newNum: number | null | undefined,
) => {
  if (
    oldNum === null ||
    oldNum === undefined ||
    oldNum === 0 ||
    newNum === null ||
    newNum === undefined
  ) {
    return null;
  }

  return (((newNum - oldNum) / oldNum) * 100).toFixed(2);
};

export const validateEmail = (email: string) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
};

export const noDecimalNum = (number: number) => {
  return Math.round(number);
};

export const twoDecimalNum = (number: NumericLike) => {
  return parseFloat(String(number)).toFixed(2);
};

export const formatPrice = (number: NumericLike) => {
  const twoDecimalNum = parseFloat(String(number)).toFixed(2);
  let strNum = twoDecimalNum.toString();
  strNum = strNum.replace(".", ",");

  if (strNum.slice(0, -3).length > 3) {
    strNum = strNum.slice(0, -6) + "." + strNum.slice(-6);
  }
  if (strNum.slice(0, -7).length > 3) {
    strNum = strNum.slice(0, -10) + "." + strNum.slice(-10);
  }

  return strNum;
};

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getPageFromPathname = (pathname: string) => {
  let page;

  switch (pathname) {
    case "/":
      page = "Home";
      break;
    case "/statistika":
      page = "Stats";
      break;
    case "/racuni":
      page = "Receipts";
      break;
    case "/preduzeca":
      page = "Companies";
      break;
    case "/korisnici":
      page = "Users";
      break;
    case "/prijave":
      page = "Reports";
      break;
    case "/profil":
      page = "Profile";
      break;
    default:
      page = "Home";
      break;
  }

  return page;
};

export const getReceiptOrderCode = (orderBy: string) => {
  let orderByCode;

  switch (orderBy) {
    case "Datum":
      orderByCode = "r.date";
      break;
    case "Prodavnica":
      orderByCode = "u.name";
      break;
    case "PIB":
      orderByCode = "u.company";
      break;
    case "Cena":
      orderByCode = "r.totalPrice";
      break;
    case "PDV":
      orderByCode = "r.totalVat";
      break;
    default:
      orderByCode = "r.date";
      break;
  }

  return orderByCode;
};

export const getReportOrderCode = (orderBy: string) => {
  let orderByCode;

  switch (orderBy) {
    case "Datum":
      orderByCode = "date";
      break;
    case "Status":
      orderByCode = "closed";
      break;
    default:
      orderByCode = "date";
      break;
  }

  return orderByCode;
};

export const getCompanyOrderCode = (orderBy: string) => {
  let orderByCode;

  switch (orderBy) {
    case "Naziv":
      orderByCode = "c.name";
      break;
    case "PIB":
      orderByCode = "c.tin";
      break;
    case "Tip":
      orderByCode = "t.name";
      break;
    default:
      orderByCode = "c.name";
      break;
  }

  return orderByCode;
};

export const getUserOrderCode = (orderBy: string) => {
  let orderByCode;

  switch (orderBy) {
    case "ID":
      orderByCode = "id";
      break;
    case "Status":
      orderByCode = "is_active";
      break;
    case "Kor. ime":
      orderByCode = "username";
      break;
    case "Ime":
      orderByCode = "first_name";
      break;
    case "Prezime":
      orderByCode = "last_name";
      break;
    case "Email":
      orderByCode = "email";
      break;
    default:
      orderByCode = "id";
      break;
  }

  return orderByCode;
};

const numberToHour = (number: number) => {
  let hour;
  switch (number) {
    case 0:
      hour = "00:00";
      break;
    case 1:
      hour = "01:00";
      break;
    case 2:
      hour = "02:00";
      break;
    case 3:
      hour = "03:00";
      break;
    case 4:
      hour = "04:00";
      break;
    case 5:
      hour = "05:00";
      break;
    case 6:
      hour = "06:00";
      break;
    case 7:
      hour = "07:00";
      break;
    case 8:
      hour = "08:00";
      break;
    case 9:
      hour = "09:00";
      break;
    case 10:
      hour = "10:00";
      break;
    case 11:
      hour = "11:00";
      break;
    case 12:
      hour = "12:00";
      break;
    case 13:
      hour = "13:00";
      break;
    case 14:
      hour = "14:00";
      break;
    case 15:
      hour = "15:00";
      break;
    case 16:
      hour = "16:00";
      break;
    case 17:
      hour = "17:00";
      break;
    case 18:
      hour = "18:00";
      break;
    case 19:
      hour = "19:00";
      break;
    case 20:
      hour = "20:00";
      break;
    case 21:
      hour = "21:00";
      break;
    case 22:
      hour = "22:00";
      break;
    case 23:
      hour = "23:00";
      break;
    default:
      hour = "23:00";
      break;
  }
  return hour;
};

const numberToWeekday = (number: number) => {
  let weekday;
  switch (number) {
    case 1:
      weekday = "Pon";
      break;
    case 2:
      weekday = "Uto";
      break;
    case 3:
      weekday = "Sre";
      break;
    case 4:
      weekday = "Čet";
      break;
    case 5:
      weekday = "Pet";
      break;
    case 6:
      weekday = "Sub";
      break;
    case 7:
      weekday = "Ned";
      break;
    default:
      weekday = "Ned";
      break;
  }
  return weekday;
};

const numberToMonth = (number: number) => {
  let month;
  switch (number) {
    case 1:
      month = "Jan";
      break;
    case 2:
      month = "Feb";
      break;
    case 3:
      month = "Mar";
      break;
    case 4:
      month = "Apr";
      break;
    case 5:
      month = "Maj";
      break;
    case 6:
      month = "Jun";
      break;
    case 7:
      month = "Jul";
      break;
    case 8:
      month = "Avg";
      break;
    case 9:
      month = "Sep";
      break;
    case 10:
      month = "Okt";
      break;
    case 11:
      month = "Nov";
      break;
    case 12:
      month = "Dec";
      break;
    default:
      month = "Dec";
      break;
  }
  return month;
};

export const getHoursFromNumbers = (
  hoursList: PlotAgg[],
  type: CountOrSpent,
) => {
  const newList: Array<{ hour: string; count: number; spent: number }> = [];

  hoursList.forEach((obj: PlotAgg) => {
    const newObj = {
      hour: numberToHour(obj.hourNum ?? 0),
      count: type === "count" ? (obj.count ?? 0) : 0,
      spent: type === "spent" ? (obj.spent ?? 0) : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getWeekdaysFromNumbers = (
  weekdaysList: PlotAgg[],
  type: CountOrSpent,
) => {
  const newList: Array<{ dayofweek: string; count: number; spent: number }> =
    [];

  weekdaysList.forEach((obj: PlotAgg) => {
    const newObj = {
      dayofweek: numberToWeekday(obj.dayofweek ?? 7),
      count: type === "count" ? (obj.count ?? 0) : 0,
      spent: type === "spent" ? (obj.spent ?? 0) : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getMonthsFromNumbers = (
  monthsList: PlotAgg[],
  type: CountOrSpent,
) => {
  const newList: Array<{ month: string; count: number; spent: number }> = [];

  monthsList.forEach((obj: PlotAgg) => {
    const newObj = {
      month: numberToMonth(obj.monthNum ?? 12),
      count: type === "count" ? (obj.count ?? 0) : 0,
      spent: type === "spent" ? (obj.spent ?? 0) : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getSpendingsPieFormatData = (
  data: PlotAgg[],
  isCompany: boolean,
) => {
  if (!Array.isArray(data)) {
    return [];
  }

  const newList: Array<{ id: string; value: number }> = [];

  data.forEach((obj: PlotAgg) => {
    const newObj = {
      id: isCompany
        ? (obj.companyName ?? "Nepoznato")
        : (obj.companyType ?? "Nepoznato"),
      value: obj.priceSum ?? 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getVisitsPieFormatData = (data: PlotAgg[], isCompany: boolean) => {
  if (!Array.isArray(data)) {
    return [];
  }

  const newList: Array<{ id: string; value: number }> = [];

  data.forEach((obj: PlotAgg) => {
    const newObj = {
      id: isCompany
        ? (obj.companyName ?? "Nepoznato")
        : (obj.companyType ?? "Nepoznato"),
      value: obj.receiptCount ?? 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getMostValItemsFormat = (itemsList: PlotAgg[]) => {
  if (!Array.isArray(itemsList)) {
    return [];
  }

  const newList: Array<{ name: string; price: number }> = [];

  itemsList.forEach((obj: PlotAgg) => {
    const newObj = {
      name: obj.name ?? "Nepoznato",
      price: obj.price ?? 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const formatChartVal = (number: number) => {
  const numToStr = Math.round(number).toString();
  if (numToStr.length === 4) {
    const val = `${numToStr.charAt(0)}k`;
    return val;
  }
  if (numToStr.length === 5) {
    const val = `${numToStr.slice(0, 2)}k`;
    return val;
  }
  if (numToStr.length === 6) {
    const val = `${numToStr.slice(0, 3)}k`;
    return val;
  }
  if (numToStr.length === 7) {
    const val = `${numToStr.charAt(0)}M`;
    return val;
  }
  if (numToStr.length === 8) {
    const val = `${numToStr.slice(0, 2)}M`;
    return val;
  }
  if (numToStr.length === 9) {
    const val = `${numToStr.slice(0, 3)}M`;
    return val;
  }
  return number;
};

export const sumSpendings = (visitedList: VisitPoint[]) => {
  let sum = 0;
  visitedList.forEach((obj: VisitPoint) => {
    sum += obj.value;
  });
  return sum;
};

export const countReceipts = (visitedList: VisitPoint[]) => {
  let counter = 0;
  visitedList.forEach((obj: VisitPoint) => {
    counter += obj.value;
  });
  return counter;
};

export const isChartEmpty = (data: PlotAgg[], type: CountOrSpent) => {
  if (!Array.isArray(data)) {
    return true;
  }

  let isEmpty = true;

  if (type === "count") {
    data.forEach((obj: PlotAgg) => {
      if (obj.count !== 0) {
        isEmpty = false;
      }
    });
  } else if (type === "spent") {
    data.forEach((obj: PlotAgg) => {
      if (obj.spent !== 0) {
        isEmpty = false;
      }
    });
  }

  return isEmpty;
};

export const getPageNumberList = (pageCount: number, activePage: number) => {
  if (pageCount < 9) {
    const pages = [];

    for (let i = 1; i < pageCount + 1; i++) {
      pages.push(i);
    }
    return pages;
  }

  const pages = [1];

  if (activePage < 5) {
    pages.push(2);
    pages.push(3);
    pages.push(4);
    pages.push(5);
    pages.push(6);
    pages.push(0);
    pages.push(pageCount);
  } else {
    pages.push(-1);
    if (activePage < pageCount - 4) {
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
      pages.push(activePage + 2);
      pages.push(-2);
      pages.push(pageCount);
    } else if (activePage === pageCount - 4) {
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
      pages.push(activePage + 2);
      pages.push(activePage + 3);
      pages.push(activePage + 4);
    } else if (activePage === pageCount - 3) {
      pages.push(activePage - 2);
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
      pages.push(activePage + 2);
      pages.push(activePage + 3);
    } else if (activePage === pageCount - 2) {
      pages.push(activePage - 3);
      pages.push(activePage - 2);
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
      pages.push(activePage + 2);
    } else if (activePage === pageCount - 1) {
      pages.push(activePage - 4);
      pages.push(activePage - 3);
      pages.push(activePage - 2);
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
    } else if (activePage === pageCount) {
      pages.push(activePage - 5);
      pages.push(activePage - 4);
      pages.push(activePage - 3);
      pages.push(activePage - 2);
      pages.push(activePage - 1);
      pages.push(activePage);
    }
  }

  return pages;
};
