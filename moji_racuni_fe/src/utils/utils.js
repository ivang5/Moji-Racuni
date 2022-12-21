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

export const noDecimalNum = (number) => {
  return Math.round(number);
};

export const twoDecimalNum = (number) => {
  return number.toFixed(2);
};

export const capitalize = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
