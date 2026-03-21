import { validateEmail } from "./utils";

export const validateReceiptLink = (receiptLink) => {
  const trimmedValue = receiptLink.trim();

  if (trimmedValue === "") {
    return "Polje za unos računa ne sme biti prazno!";
  }

  if (!trimmedValue.startsWith("https://suf.purs.gov.rs/")) {
    return "Uneti link nije validan!";
  }

  return "";
};

export const validateUsernameField = (username) => {
  const trimmedValue = username.trim();

  if (trimmedValue === "") {
    return "Korisničko ime ne može biti prazno!";
  }

  if (trimmedValue.length < 3) {
    return "Korisničko ime je previše kratko!";
  }

  if (!isNaN(trimmedValue)) {
    return "Korisničko ime mora sadržati barem jedno slovo!";
  }

  return "";
};

export const validateEmailField = (email) => {
  const trimmedValue = email.trim();

  if (trimmedValue === "") {
    return "Email ne može biti prazan!";
  }

  if (!validateEmail(trimmedValue)) {
    return "Email nije validan!";
  }

  return "";
};

export const validateRequiredPassword = (password) => {
  if (password.trim() === "") {
    return "Lozinka ne može biti prazna!";
  }

  return "";
};

export const validatePasswordRepeatRules = (password, passwordRepeat) => {
  const passwordValue = password.trim();
  const repeatValue = passwordRepeat.trim();

  if (repeatValue === "") {
    return "Morate ponoviti lozinku!";
  }

  if (passwordValue !== repeatValue) {
    return "Lozinke moraju biti iste!";
  }

  return "";
};

export const validateLoginForm = ({ username, password }) => {
  const validation = {
    username: "",
    password: "",
    server: "",
  };

  validation.username =
    username.trim() === "" ? "Korisničko ime ne može biti prazno!" : "";
  validation.password = validateRequiredPassword(password);

  return validation;
};

export const validateProfileInfoForm = ({ username, email }) => {
  return {
    username: validateUsernameField(username),
    email: validateEmailField(email),
  };
};

export const validateRegistrationForm = ({
  email,
  username,
  password,
  passwordRepeat,
}) => {
  const validation = {
    email: validateEmailField(email),
    username: validateUsernameField(username),
    password: "",
    passwordRepeat: validatePasswordRepeatRules(password, passwordRepeat),
    server: "",
  };

  validation.password = validateRequiredPassword(password);

  if (password.trim() === "" && passwordRepeat.trim() === "") {
    validation.passwordRepeat = "Lozinka ne može biti prazna!";
  }

  return validation;
};

export const validatePasswordUpdateForm = ({ password, passwordRepeat }) => {
  const validation = {
    password: "",
    passwordRepeat: validatePasswordRepeatRules(password, passwordRepeat),
  };

  validation.password = validateRequiredPassword(password);

  if (password.trim() === "" && passwordRepeat.trim() === "") {
    validation.passwordRepeat = "Lozinka ne može biti prazna!";
  }

  return validation;
};
