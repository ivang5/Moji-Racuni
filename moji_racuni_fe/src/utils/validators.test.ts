import { describe, expect, it } from "vitest";
import {
  validateEmailField,
  validateLoginForm,
  validatePasswordRepeatRules,
  validatePasswordUpdateForm,
  validateProfileInfoForm,
  validateReceiptLink,
  validateRegistrationForm,
  validateRequiredPassword,
  validateUsernameField,
} from "@/utils/validators";

describe("validateReceiptLink", () => {
  it("prihvata link sa PURS-a", () => {
    expect(validateReceiptLink("https://suf.purs.gov.rs/v/?vl=abc")).toBe("");
    expect(validateReceiptLink("  https://suf.purs.gov.rs/v/?vl=abc  ")).toBe(
      "",
    );
  });

  it("odbija prazan unos", () => {
    expect(validateReceiptLink("   ")).toBe(
      "Polje za unos računa ne sme biti prazno!",
    );
  });

  it("odbija link koji nije sa PURS-a", () => {
    expect(validateReceiptLink("https://example.com/v/?vl=abc")).toBe(
      "Uneti link nije validan!",
    );
    expect(validateReceiptLink("http://suf.purs.gov.rs/v/?vl=abc")).toBe(
      "Uneti link nije validan!",
    );
  });
});

describe("validateUsernameField", () => {
  it.each([
    ["", "Korisničko ime ne može biti prazno!"],
    ["  ", "Korisničko ime ne može biti prazno!"],
    ["ab", "Korisničko ime je previše kratko!"],
    ["12345", "Korisničko ime mora sadržati barem jedno slovo!"],
    ["marko", ""],
    ["đorđe99", ""],
  ])("%j -> %j", (input, expected) => {
    expect(validateUsernameField(input)).toBe(expected);
  });
});

describe("validateEmailField", () => {
  it.each([
    ["", "Email ne može biti prazan!"],
    ["marko", "Email nije validan!"],
    ["marko@", "Email nije validan!"],
    ["marko@example", "Email nije validan!"],
    ["marko@example.com", ""],
    [" marko.markovic@mail.example.rs ", ""],
  ])("%j -> %j", (input, expected) => {
    expect(validateEmailField(input)).toBe(expected);
  });
});

describe("lozinke", () => {
  it("validateRequiredPassword odbija praznu lozinku", () => {
    expect(validateRequiredPassword(" ")).toBe("Lozinka ne može biti prazna!");
    expect(validateRequiredPassword("tajna")).toBe("");
  });

  it("validatePasswordRepeatRules traži istu ponovljenu lozinku", () => {
    expect(validatePasswordRepeatRules("tajna", "")).toBe(
      "Morate ponoviti lozinku!",
    );
    expect(validatePasswordRepeatRules("tajna", "tajna2")).toBe(
      "Lozinke moraju biti iste!",
    );
    expect(validatePasswordRepeatRules("tajna", " tajna ")).toBe("");
  });
});

describe("validacija formi", () => {
  it("validateLoginForm", () => {
    expect(validateLoginForm({ username: "", password: "" })).toEqual({
      username: "Korisničko ime ne može biti prazno!",
      password: "Lozinka ne može biti prazna!",
      server: "",
    });
    expect(validateLoginForm({ username: "ab", password: "x" })).toEqual({
      username: "",
      password: "",
      server: "",
    });
  });

  it("validateProfileInfoForm", () => {
    expect(
      validateProfileInfoForm({ username: "12", email: "nije-email" }),
    ).toEqual({
      username: "Korisničko ime je previše kratko!",
      email: "Email nije validan!",
    });
  });

  it("validateRegistrationForm za prazne lozinke prijavljuje grešku na oba polja", () => {
    expect(
      validateRegistrationForm({
        email: "marko@example.com",
        username: "marko",
        password: "",
        passwordRepeat: "",
      }),
    ).toEqual({
      email: "",
      username: "",
      password: "Lozinka ne može biti prazna!",
      passwordRepeat: "Lozinka ne može biti prazna!",
      server: "",
    });
  });

  it("validateRegistrationForm za ispravne podatke ne vraća greške", () => {
    expect(
      validateRegistrationForm({
        email: "marko@example.com",
        username: "marko",
        password: "tajna",
        passwordRepeat: "tajna",
      }),
    ).toEqual({
      email: "",
      username: "",
      password: "",
      passwordRepeat: "",
      server: "",
    });
  });

  it("validatePasswordUpdateForm", () => {
    expect(
      validatePasswordUpdateForm({ password: "", passwordRepeat: "" }),
    ).toEqual({
      password: "Lozinka ne može biti prazna!",
      passwordRepeat: "Lozinka ne može biti prazna!",
    });
    expect(
      validatePasswordUpdateForm({
        password: "tajna",
        passwordRepeat: "druga",
      }),
    ).toEqual({
      password: "",
      passwordRepeat: "Lozinke moraju biti iste!",
    });
  });
});
