import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  capitalize,
  dateBEFormatter,
  dateFormatter,
  dateTimeBEFormatter,
  dateTimeFormatter,
  formatChartVal,
  formatPrice,
  getLastMonth,
  getLastYear,
  getPageNumberList,
  getPercentageChange,
  getThisMonth,
  getThisYear,
  getTomorrow,
} from "@/utils/utils";

describe("formatPrice", () => {
  it.each([
    [0, "0,00"],
    [5, "5,00"],
    [12.5, "12,50"],
    [999.5, "999,50"],
    ["1234.5", "1.234,50"],
    ["99.999", "100,00"],
    [230572.81, "230.572,81"],
    [1234567.891, "1.234.567,89"],
  ])("formatira %s kao %s", (input, expected) => {
    expect(formatPrice(input)).toBe(expected);
  });
});

describe("getPercentageChange", () => {
  it("vraća procentualnu promenu sa dve decimale", () => {
    expect(getPercentageChange(100, 150)).toBe("50.00");
    expect(getPercentageChange(200, 100)).toBe("-50.00");
    expect(getPercentageChange(3, 1)).toBe("-66.67");
    expect(getPercentageChange(50, 50)).toBe("0.00");
  });

  it("vraća null kada nema stare vrednosti ili je ona nula", () => {
    expect(getPercentageChange(0, 100)).toBeNull();
    expect(getPercentageChange(null, 100)).toBeNull();
    expect(getPercentageChange(undefined, 100)).toBeNull();
  });

  it("vraća null kada nema nove vrednosti", () => {
    expect(getPercentageChange(100, null)).toBeNull();
    expect(getPercentageChange(100, undefined)).toBeNull();
  });
});

describe("getPageNumberList", () => {
  // 0, -1 and -2 are placeholders that the paginator renders as "...".
  it("vraća sve strane kada ih ima manje od 9", () => {
    expect(getPageNumberList(0, 1)).toEqual([]);
    expect(getPageNumberList(5, 3)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumberList(8, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("na početku liste prikazuje prvih 6 strana i poslednju", () => {
    expect(getPageNumberList(20, 1)).toEqual([1, 2, 3, 4, 5, 6, 0, 20]);
    expect(getPageNumberList(20, 4)).toEqual([1, 2, 3, 4, 5, 6, 0, 20]);
    expect(getPageNumberList(9, 4)).toEqual([1, 2, 3, 4, 5, 6, 0, 9]);
  });

  it("u sredini liste prikazuje okolinu aktivne strane", () => {
    expect(getPageNumberList(20, 5)).toEqual([1, -1, 4, 5, 6, 7, -2, 20]);
    expect(getPageNumberList(20, 10)).toEqual([1, -1, 9, 10, 11, 12, -2, 20]);
  });

  it("na kraju liste prikazuje poslednjih 6 strana", () => {
    const lastSix = [1, -1, 15, 16, 17, 18, 19, 20];
    for (const activePage of [16, 17, 18, 19, 20]) {
      expect(getPageNumberList(20, activePage)).toEqual(lastSix);
    }
    expect(getPageNumberList(9, 5)).toEqual([1, -1, 4, 5, 6, 7, 8, 9]);
  });
});

describe("formateri datuma", () => {
  it("dateFormatter vraća DD/MM/YYYY", () => {
    expect(dateFormatter("2026-03-07")).toBe("07/03/2026");
    expect(dateFormatter(new Date(2026, 2, 7))).toBe("07/03/2026");
  });

  it("dateBEFormatter vraća YYYY-MM-DD", () => {
    expect(dateBEFormatter(new Date(2026, 0, 31))).toBe("2026-01-31");
    expect(dateBEFormatter("2026-12-01")).toBe("2026-12-01");
  });

  it("dateTimeFormatter prikazuje vreme u UTC-u", () => {
    expect(dateTimeFormatter("2026-03-07T14:05:09Z")).toBe(
      "07/03/2026 - 14:05:09",
    );
    expect(dateTimeFormatter("2026-03-07T14:05:09")).toBe(
      "07/03/2026 - 14:05:09",
    );
  });

  it("dateTimeBEFormatter vraća YYYY-MM-DD HH:mm:ss", () => {
    expect(dateTimeBEFormatter(new Date(2026, 2, 7, 14, 5, 9))).toBe(
      "2026-03-07 14:05:09",
    );
  });
});

describe("periodi za statistiku", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("računa tekući i prošli mesec i godinu", () => {
    vi.setSystemTime(new Date(2026, 10, 27, 12));

    expect(getThisMonth()).toEqual({
      dateFrom: "2026-11-01",
      dateTo: "2026-12-01",
    });
    expect(getLastMonth()).toEqual({
      dateFrom: "2026-10-01",
      dateTo: "2026-11-01",
    });
    expect(getThisYear()).toEqual({
      dateFrom: "2026-01-01",
      dateTo: "2027-01-01",
    });
    expect(getLastYear()).toEqual({
      dateFrom: "2025-01-01",
      dateTo: "2026-01-01",
    });
    expect(dateBEFormatter(getTomorrow())).toBe("2026-11-28");
  });

  it("u decembru tekući mesec traje do 1. januara sledeće godine", () => {
    vi.setSystemTime(new Date(2026, 11, 15, 12));

    expect(getThisMonth()).toEqual({
      dateFrom: "2026-12-01",
      dateTo: "2027-01-01",
    });
  });

  it.fails(
    "Greška: u januaru je prošli mesec decembar prethodne godine",
    () => {
      vi.setSystemTime(new Date(2026, 0, 15, 12));

      // Currently returns 2024-12-01 as the start (two years back).
      expect(getLastMonth()).toEqual({
        dateFrom: "2025-12-01",
        dateTo: "2026-01-01",
      });
    },
  );
});

describe("ostali formateri", () => {
  it("capitalize menja samo prvo slovo", () => {
    expect(capitalize("čokolada")).toBe("Čokolada");
    expect(capitalize("")).toBe("");
  });

  it("formatChartVal skraćuje hiljade i milione", () => {
    expect(formatChartVal(950)).toBe(950);
    expect(formatChartVal(1500)).toBe("1k");
    expect(formatChartVal(25400)).toBe("25k");
    expect(formatChartVal(999999)).toBe("999k");
    expect(formatChartVal(2500000)).toBe("2M");
  });
});
