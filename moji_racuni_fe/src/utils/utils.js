import dayjs from "dayjs";

export const BASE_URL = "http://{IPv4_Address}:8000";

export const dateFormatter = (date) => {
  return dayjs(date).format("DD/MM/YYYY");
};

export const dateBEFormatter = (date) => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const dateTimeFormatter = (date) => {
  return dayjs(date).format("DD/MM/YYYY - HH:mm:ss");
};

export const dateTimeBEFormatter = (date) => {
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
    new Date(date.getFullYear(), date.getMonth())
  );
  const dateTo = dateBEFormatter(
    new Date(date.getFullYear(), date.getMonth() + 1, 1)
  );
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getThisYear = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(new Date(date.getFullYear(), 0, 1));
  const dateTo = dateBEFormatter(new Date(date.getFullYear() + 1, 0, 1));
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getAllTime = () => {
  const date = new Date();
  const dateFrom = dateBEFormatter(
    new Date(date.getFullYear() - 10, date.getMonth())
  );
  const dateTo = dateBEFormatter(new Date(date.getFullYear() + 1, 0, 1));
  return { dateFrom: dateFrom, dateTo: dateTo };
};

export const getTenYearsAgo = () => {
  const date = new Date();
  return new Date(date.getFullYear() - 10, date.getMonth(), date.getDate());
};

export const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

export const noDecimalNum = (number) => {
  return Math.round(number);
};

export const twoDecimalNum = (number) => {
  return parseFloat(number).toFixed(2);
};

export const formatPrice = (number) => {
  const twoDecimalNum = parseFloat(number).toFixed(2);
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

export const capitalize = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getPageFromPathname = (pathname) => {
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
  }

  return page;
};

export const getReceiptOrderCode = (orderBy) => {
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

export const getReportOrderCode = (orderBy) => {
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

export const getCompanyOrderCode = (orderBy) => {
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

export const getUserOrderCode = (orderBy) => {
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

const numberToHour = (number) => {
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

const numberToWeekday = (number) => {
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

const numberToMonth = (number) => {
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

export const getHoursFromNumbers = (hoursList, type) => {
  const newList = [];

  hoursList.forEach((obj) => {
    const newObj = {
      hour: numberToHour(obj.hourNum),
      count: type === "count" ? obj.count : 0,
      spent: type === "spent" ? obj.spent : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getWeekdaysFromNumbers = (weekdaysList, type) => {
  const newList = [];

  weekdaysList.forEach((obj) => {
    const newObj = {
      dayofweek: numberToWeekday(obj.dayofweek),
      count: type === "count" ? obj.count : 0,
      spent: type === "spent" ? obj.spent : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getMonthsFromNumbers = (monthsList, type) => {
  const newList = [];

  monthsList.forEach((obj) => {
    const newObj = {
      month: numberToMonth(obj.monthNum),
      count: type === "count" ? obj.count : 0,
      spent: type === "spent" ? obj.spent : 0,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getSpendingsPieFormatData = (data, isCompany) => {
  const newList = [];

  data.forEach((obj) => {
    const newObj = {
      id: isCompany ? obj.companyName : obj.companyType,
      value: obj.priceSum,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getVisitsPieFormatData = (data, isCompany) => {
  const newList = [];

  data.forEach((obj) => {
    const newObj = {
      id: isCompany ? obj.companyName : obj.companyType,
      value: obj.receiptCount,
    };
    newList.push(newObj);
  });

  return newList;
};

export const getMostValItemsFormat = (itemsList) => {
  const newList = [];

  itemsList.forEach((obj) => {
    const newObj = {
      name: obj.name,
      price: obj.price,
    };
    newList.push(newObj);
  });

  return newList;
};

export const formatChartVal = (number) => {
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

export const sumSpendings = (visitedList) => {
  let sum = 0;
  visitedList.forEach((obj) => {
    sum += obj.value;
  });
  return sum;
};

export const countReceipts = (visitedList) => {
  let counter = 0;
  visitedList.forEach((obj) => {
    counter += obj.value;
  });
  return counter;
};

export const isChartEmpty = (data, type) => {
  let isEmpty = true;

  if (type === "count") {
    data.forEach((obj) => {
      if (obj.count !== 0) {
        isEmpty = false;
      }
    });
  } else if (type === "spent") {
    data.forEach((obj) => {
      if (obj.spent !== 0) {
        isEmpty = false;
      }
    });
  }

  return isEmpty;
};

export const getPageNumberList = (pageCount, activePage) => {
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
