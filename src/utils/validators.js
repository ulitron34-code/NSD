// Validar email
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar contrasena (minimo 8 caracteres)
export const validatePassword = (password) => {
  return password.length >= 8;
};

// Validar RFC de persona fisica o moral.
export const validateRFC = (rfc) => {
  const regex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return regex.test(rfc.toUpperCase());
};

// Obtener mensaje de error de validacion
export const getValidationError = (field, value) => {
  switch (field) {
    case "email":
      if (!value) return "Email es requerido";
      if (!validateEmail(value)) return "Email invalido";
      return "";
    case "password":
      if (!value) return "Contraseña es requerida";
      if (!validatePassword(value)) return "Minimo 8 caracteres";
      return "";
    case "confirmPassword":
      if (!value) return "Confirmar contrasena es requerido";
      return "";
    case "role":
      if (!value) return "Tipo de usuario es requerido";
      return "";
    default:
      return "";
  }
};
