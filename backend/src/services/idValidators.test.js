import { describe, it, expect } from 'vitest';
import {
  coValidarNit,
  ecValidarCedula,
  ecValidarRuc,
  arValidarCuit,
  arValidarDniFormato,
  peValidarRuc,
  peValidarDniFormato,
  clValidarRut,
  boValidarNitFormato,
  pyValidarRuc,
  uyValidarRutFormato,
  usValidarEinFormato,
  usValidarSsnFormato,
  caValidarSin,
  caValidarBnFormato
} from './idValidators.js';

describe('Colombia - NIT (DIAN, modulo 11)', () => {
  it('valida un NIT real conocido (Ecopetrol: 899999068-1)', () => {
    expect(coValidarNit('899999068-1')).toBe(true);
  });

  it('rechaza un digito verificador incorrecto', () => {
    expect(coValidarNit('899999068-5')).toBe(false);
  });

  it('rechaza formato invalido', () => {
    expect(coValidarNit('no-es-un-nit')).toBe(false);
  });
});

describe('Ecuador - Cedula (modulo 10)', () => {
  it('valida una cedula con digito verificador correcto', () => {
    // Provincia 17 (Pichincha), tercer digito < 6 (persona natural)
    expect(ecValidarCedula('1710034065')).toBe(true);
  });

  it('rechaza una cedula con digito verificador incorrecto', () => {
    expect(ecValidarCedula('1710034066')).toBe(false);
  });

  it('rechaza codigo de provincia invalido', () => {
    expect(ecValidarCedula('9910034065')).toBe(false);
  });

  it('rechaza formato invalido (no 10 digitos)', () => {
    expect(ecValidarCedula('12345')).toBe(false);
  });
});

describe('Ecuador - RUC', () => {
  it('valida un RUC de persona natural (cedula + 001)', () => {
    expect(ecValidarRuc('1710034065001')).toBe(true);
  });

  it('rechaza un RUC de persona natural con sufijo incorrecto', () => {
    expect(ecValidarRuc('1710034065002')).toBe(false);
  });

  it('rechaza formato invalido (no 13 digitos)', () => {
    expect(ecValidarRuc('123')).toBe(false);
  });
});

describe('Argentina - CUIT (modulo 11)', () => {
  it('valida un CUIT real conocido (con guiones)', () => {
    expect(arValidarCuit('20-12345678-6')).toBe(true);
  });

  it('valida el mismo CUIT sin guiones', () => {
    expect(arValidarCuit('20123456786')).toBe(true);
  });

  it('rechaza un digito verificador incorrecto', () => {
    expect(arValidarCuit('20-12345678-9')).toBe(false);
  });

  it('rechaza formato invalido', () => {
    expect(arValidarCuit('123')).toBe(false);
  });
});

describe('Argentina - DNI (formato)', () => {
  it('acepta 7 u 8 digitos', () => {
    expect(arValidarDniFormato('12345678')).toBe(true);
    expect(arValidarDniFormato('1234567')).toBe(true);
  });

  it('rechaza menos de 7 o mas de 8 digitos', () => {
    expect(arValidarDniFormato('123456')).toBe(false);
    expect(arValidarDniFormato('123456789')).toBe(false);
  });
});

describe('Peru - RUC (modulo 11)', () => {
  it('valida un RUC de persona juridica (prefijo 20) con digito verificador correcto', () => {
    expect(peValidarRuc('20100070971')).toBe(true);
  });

  it('rechaza un digito verificador incorrecto', () => {
    expect(peValidarRuc('20100070970')).toBe(false);
  });

  it('rechaza formato invalido (no 11 digitos)', () => {
    expect(peValidarRuc('123')).toBe(false);
  });
});

describe('Peru - DNI (formato)', () => {
  it('acepta exactamente 8 digitos', () => {
    expect(peValidarDniFormato('12345678')).toBe(true);
  });

  it('rechaza otra longitud', () => {
    expect(peValidarDniFormato('1234567')).toBe(false);
  });
});

describe('Chile - RUT (modulo 11)', () => {
  it('valida un RUT con digito verificador numerico', () => {
    expect(clValidarRut('76086428-5')).toBe(true);
  });

  it('valida un RUT cuyo digito verificador es K', () => {
    expect(clValidarRut('1000005-K')).toBe(true);
  });

  it('es insensible a puntos y mayuscula/minuscula de la K', () => {
    expect(clValidarRut('1.000.005-k')).toBe(true);
  });

  it('rechaza un digito verificador incorrecto', () => {
    expect(clValidarRut('76086428-6')).toBe(false);
  });
});

describe('Bolivia - NIT (solo formato)', () => {
  it('acepta 9-10 digitos + un digito verificador', () => {
    expect(boValidarNitFormato('1234567015')).toBe(true);
  });

  it('rechaza formato invalido', () => {
    expect(boValidarNitFormato('abc')).toBe(false);
  });
});

describe('Paraguay - RUC (modulo 11)', () => {
  it('valida un RUC con digito verificador correcto', () => {
    expect(pyValidarRuc('80017166-0')).toBe(true);
  });

  it('rechaza un digito verificador incorrecto', () => {
    expect(pyValidarRuc('80017166-3')).toBe(false);
  });
});

describe('Uruguay - RUT (solo formato)', () => {
  it('acepta 12 digitos', () => {
    expect(uyValidarRutFormato('210000550018')).toBe(true);
  });

  it('rechaza otra longitud', () => {
    expect(uyValidarRutFormato('123')).toBe(false);
  });
});

describe('USA - EIN (formato + prefijo IRS valido)', () => {
  it('acepta un EIN con prefijo valido', () => {
    expect(usValidarEinFormato('12-3456789')).toBe(true);
  });

  it('rechaza un prefijo que el IRS nunca asigna', () => {
    expect(usValidarEinFormato('07-3456789')).toBe(false);
    expect(usValidarEinFormato('00-3456789')).toBe(false);
  });

  it('rechaza formato invalido', () => {
    expect(usValidarEinFormato('123456789')).toBe(false);
  });
});

describe('USA - SSN (formato + reglas SSA)', () => {
  it('acepta un SSN con formato y rangos validos', () => {
    expect(usValidarSsnFormato('123-45-6789')).toBe(true);
  });

  it('rechaza area 000, 666, o >=900', () => {
    expect(usValidarSsnFormato('000-45-6789')).toBe(false);
    expect(usValidarSsnFormato('666-45-6789')).toBe(false);
    expect(usValidarSsnFormato('901-45-6789')).toBe(false);
  });

  it('rechaza group 00 o serial 0000', () => {
    expect(usValidarSsnFormato('123-00-6789')).toBe(false);
    expect(usValidarSsnFormato('123-45-0000')).toBe(false);
  });
});

describe('Canada - SIN (Luhn)', () => {
  it('valida un SIN de prueba conocido (046 454 286)', () => {
    expect(caValidarSin('046454286')).toBe(true);
    expect(caValidarSin('046-454-286')).toBe(true);
  });

  it('rechaza un SIN con el ultimo digito alterado', () => {
    expect(caValidarSin('046454287')).toBe(false);
  });

  it('rechaza formato invalido', () => {
    expect(caValidarSin('123')).toBe(false);
  });
});

describe('Canada - Business Number (solo formato)', () => {
  it('acepta 9 digitos', () => {
    expect(caValidarBnFormato('123456789')).toBe(true);
  });

  it('rechaza otra longitud', () => {
    expect(caValidarBnFormato('123')).toBe(false);
  });
});
