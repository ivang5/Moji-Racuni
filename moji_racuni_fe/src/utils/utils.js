import dayjs from "dayjs";

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
    case "/statistike":
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
