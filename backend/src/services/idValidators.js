// Algoritmos de digito verificador para identificadores fiscales/nacionales
// de la expansion multi-pais (CO, EC, AR, PE, CL, BO, PY, UY, US, CA).
// Son funciones puras (sin I/O) para poder testearlas de forma aislada y
// reusarlas desde agentValidator.js. Donde no existe un algoritmo de digito
// verificador publicamente documentado y confiable (BO NIT, UY RUT, AR/PE
// DNI, CA BN), solo se valida el formato -- no se inventa un algoritmo, para
// no generar una falsa sensacion de certeza (mismo criterio que el screening
// OFAC: "requiere revision manual", no un veredicto absoluto).

// ───────────────────────── Colombia ─────────────────────────

// NIT (DIAN). Algoritmo oficial: se rellena a 15 digitos por la izquierda,
// se multiplica cada digito por su peso y se reduce mod 11.
const CO_NIT_WEIGHTS = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
export function coCalcularDigitoVerificacionNit(nit) {
  const digits = String(nit).replace(/\D/g, '').padStart(15, '0');
  let total = 0;
  for (let i = 0; i < 15; i++) {
    total += parseInt(digits[i], 10) * CO_NIT_WEIGHTS[i];
  }
  const rem = total % 11;
  return rem > 1 ? 11 - rem : rem;
}

export function coValidarNit(nitConDv) {
  const match = String(nitConDv).replace(/\./g, '').match(/^(\d{8,10})-?(\d)$/);
  if (!match) return false;
  return coCalcularDigitoVerificacionNit(match[1]) === parseInt(match[2], 10);
}

// ───────────────────────── Ecuador ─────────────────────────

// Cedula: modulo 10 (algoritmo del Registro Civil ecuatoriano) sobre los
// primeros 9 digitos, mas validacion de codigo de provincia (01-24, 30).
const EC_CEDULA_COEF = [2, 1, 2, 1, 2, 1, 2, 1, 2];
export function ecValidarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const province = parseInt(cedula.slice(0, 2), 10);
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  const thirdDigit = parseInt(cedula[2], 10);
  if (thirdDigit >= 6) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(cedula[i], 10) * EC_CEDULA_COEF[i];
    if (val >= 10) val -= 9;
    sum += val;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cedula[9], 10);
}

// RUC: cedula natural (3er digito 0-5) + "001", o algoritmo mod11 propio
// para sector publico (3er digito 6) y sociedades privadas (3er digito 9).
export function ecValidarRuc(ruc) {
  if (!/^\d{13}$/.test(ruc)) return false;
  const thirdDigit = parseInt(ruc[2], 10);

  if (thirdDigit <= 5) {
    return ecValidarCedula(ruc.slice(0, 10)) && ruc.slice(10) === '001';
  }

  if (thirdDigit === 6) {
    const coef = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(ruc[i], 10) * coef[i];
    const rem = sum % 11;
    const check = rem === 0 ? 0 : 11 - rem;
    return check === parseInt(ruc[8], 10) && ruc.slice(9) === '0001';
  }

  if (thirdDigit === 9) {
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(ruc[i], 10) * coef[i];
    const rem = sum % 11;
    const check = rem === 0 ? 0 : 11 - rem;
    return check === parseInt(ruc[9], 10) && ruc.slice(10) === '001';
  }

  return false;
}

// ───────────────────────── Argentina ─────────────────────────

const AR_CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
// Retorna el digito esperado (0-9), o null si el algoritmo da un resultado
// no valido (10), caso en el que el CUIT/CUIL declarado no puede ser correcto.
export function arCalcularDigitoCuit(primeros10Digitos) {
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(primeros10Digitos[i], 10) * AR_CUIT_WEIGHTS[i];
  const rem = sum % 11;
  let dv = 11 - rem;
  if (dv === 11) dv = 0;
  if (dv === 10) return null;
  return dv;
}

export function arValidarCuit(cuit) {
  const clean = String(cuit).replace(/-/g, '');
  if (!/^\d{11}$/.test(clean)) return false;
  const dv = arCalcularDigitoCuit(clean.slice(0, 10));
  return dv !== null && dv === parseInt(clean[10], 10);
}

export function arValidarDniFormato(dni) {
  return /^\d{7,8}$/.test(String(dni).replace(/\./g, ''));
}

// ───────────────────────── Perú ─────────────────────────

const PE_RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
export function peValidarRuc(ruc) {
  if (!/^\d{11}$/.test(ruc)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(ruc[i], 10) * PE_RUC_WEIGHTS[i];
  const rem = sum % 11;
  let dv = 11 - rem;
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 1;
  return dv === parseInt(ruc[10], 10);
}

export function peValidarDniFormato(dni) {
  return /^\d{8}$/.test(String(dni));
}

// ───────────────────────── Chile ─────────────────────────

function clCalcularDigitoVerificador(cuerpo) {
  let sum = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    sum += parseInt(cuerpo[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rem = 11 - (sum % 11);
  if (rem === 11) return '0';
  if (rem === 10) return 'K';
  return String(rem);
}

export function clValidarRut(rut) {
  const clean = String(rut).replace(/[.\s]/g, '').toUpperCase();
  const match = clean.match(/^(\d{1,8})-?([0-9K])$/);
  if (!match) return false;
  return clCalcularDigitoVerificador(match[1]) === match[2];
}

// ───────────────────────── Bolivia ─────────────────────────

// No hay un algoritmo de digito verificador del NIT boliviano publicamente
// documentado y confiable; solo se valida el formato (9-10 digitos + DV).
export function boValidarNitFormato(nit) {
  return /^\d{9,10}-?\d$/.test(String(nit).replace(/\./g, ''));
}

// ───────────────────────── Paraguay ─────────────────────────

const PY_RUC_MAX_MULTIPLIER = 7;
function pyCalcularDigitoRuc(cuerpo) {
  let sum = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    sum += parseInt(cuerpo[i], 10) * mul;
    mul = mul === PY_RUC_MAX_MULTIPLIER ? 2 : mul + 1;
  }
  const rem = 11 - (sum % 11);
  return rem >= 10 ? 0 : rem;
}

export function pyValidarRuc(ruc) {
  const clean = String(ruc).replace(/[.\s]/g, '');
  const match = clean.match(/^(\d{6,8})-?(\d)$/);
  if (!match) return false;
  return pyCalcularDigitoRuc(match[1]) === parseInt(match[2], 10);
}

// ───────────────────────── Uruguay ─────────────────────────

// El RUT uruguayo (DGI) no tiene un algoritmo de digito verificador
// publicamente documentado y confiable con la informacion disponible; solo
// se valida el formato (12 digitos).
export function uyValidarRutFormato(rut) {
  return /^\d{12}$/.test(String(rut).replace(/[.\s-]/g, ''));
}

// ───────────────────────── USA ─────────────────────────

// Prefijos de EIN que el IRS nunca asigna (lista publicada de prefijos
// invalidos), no una lista de campus (el sistema de campus se retiro en 2001).
const US_EIN_INVALID_PREFIXES = new Set([
  '00', '07', '08', '09', '17', '18', '19', '28', '29', '49', '69', '70', '78', '79', '89', '96', '97'
]);

export function usValidarEinFormato(ein) {
  const match = String(ein).match(/^(\d{2})-(\d{7})$/);
  if (!match) return false;
  return !US_EIN_INVALID_PREFIXES.has(match[1]);
}

export function usValidarSsnFormato(ssn) {
  const match = String(ssn).match(/^(\d{3})-(\d{2})-(\d{4})$/);
  if (!match) return false;
  const [, area, group, serial] = match;
  if (area === '000' || area === '666' || parseInt(area, 10) >= 900) return false;
  if (group === '00') return false;
  if (serial === '0000') return false;
  return true;
}

// ───────────────────────── Canadá ─────────────────────────

// SIN: algoritmo de Luhn (modulo 10) sobre los 9 digitos.
export function caValidarSin(sin) {
  const clean = String(sin).replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(clean[i], 10);
    if ((i + 1) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// El Business Number (CRA) no tiene un digito verificador publico; solo se
// valida el formato (9 digitos).
export function caValidarBnFormato(bn) {
  return /^\d{9}$/.test(String(bn).replace(/[\s-]/g, ''));
}
