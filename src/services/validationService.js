// ============================================
// SERVICIO DE VALIDACIÓN
// Validación de formularios y datos
// ============================================

const RULES = {
  required: (value, field) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${field} es requerido`;
    }
    return null;
  },

  minLength: (min) => (value, field) => {
    if (value && value.length < min) {
      return `${field} debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max) => (value, field) => {
    if (value && value.length > max) {
      return `${field} no puede exceder ${max} caracteres`;
    }
    return null;
  },

  email: (value, field) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return `${field} no es un email válido`;
    }
    return null;
  },

  number: (value, field) => {
    if (value && isNaN(value)) {
      return `${field} debe ser un número`;
    }
    return null;
  },

  min: (min) => (value, field) => {
    if (value && Number(value) < min) {
      return `${field} debe ser al menos ${min}`;
    }
    return null;
  },

  max: (max) => (value, field) => {
    if (value && Number(value) > max) {
      return `${field} no puede exceder ${max}`;
    }
    return null;
  },

  phone: (value, field) => {
    const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
    if (value && !phoneRegex.test(value)) {
      return `${field} no es un teléfono válido`;
    }
    return null;
  },

  url: (value, field) => {
    try {
      new URL(value);
      return null;
    } catch {
      return `${field} no es una URL válida`;
    }
  },

  date: (value, field) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (value && !dateRegex.test(value)) {
      return `${field} debe ser una fecha válida (YYYY-MM-DD)`;
    }
    return null;
  },

  match: (fieldToMatch) => (value, field, formData) => {
    if (value && value !== formData[fieldToMatch]) {
      return `${field} debe coincidir con ${fieldToMatch}`;
    }
    return null;
  },

  custom: (fn) => (value, field) => {
    const error = fn(value);
    return error ? error : null;
  }
};

export function createValidator(schema) {
  return (formData) => {
    const errors = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = formData[fieldName];

      for (const rule of rules) {
        const error = rule(value, fieldName, formData);
        if (error) {
          errors[fieldName] = error;
          break; // Solo mostrar el primer error por campo
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
}

// Validadores predefinidos

export const expedienteValidator = createValidator({
  title: [RULES.required],
  solicitanteName: [RULES.required, RULES.minLength(2)],
  otorganteName: [RULES.required, RULES.minLength(2)],
  amount: [RULES.required, RULES.number, RULES.min(0)],
  sector: [RULES.required],
  description: [RULES.minLength(5), RULES.maxLength(500)]
});

export const documentValidator = createValidator({
  fileName: [RULES.required, RULES.minLength(3)],
  documentType: [RULES.required],
  file: [RULES.required]
});

export const requirementValidator = createValidator({
  title: [RULES.required, RULES.minLength(5), RULES.maxLength(100)],
  description: [RULES.required, RULES.minLength(10), RULES.maxLength(1000)],
  priority: [RULES.required],
  dueDate: [RULES.date]
});

export const messageValidator = createValidator({
  body: [RULES.required, RULES.minLength(1), RULES.maxLength(2000)]
});

// Validación real-time
export function validateField(fieldName, value, schema) {
  const rules = schema[fieldName] || [];

  for (const rule of rules) {
    const error = rule(value, fieldName);
    if (error) {
      return error;
    }
  }

  return null;
}

// Validación con debounce (para búsqueda en tiempo real)
export function createDebouncedValidator(schema, delayMs = 300) {
  let timeoutId;

  return {
    validate: (fieldName, value, callback) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const error = validateField(fieldName, value, schema);
        callback(error);
      }, delayMs);
    },

    cancel: () => clearTimeout(timeoutId)
  };
}

// Validación asincrónica
export async function validateAsync(fieldName, value, asyncValidator) {
  try {
    const error = await asyncValidator(value);
    return error;
  } catch (err) {
    console.error("Error en validación asincrónica:", err);
    return "Error en validación";
  }
}

// Mensajes de error personalizados
export const ERROR_MESSAGES = {
  required: "Este campo es requerido",
  minLength: (min) => `Mínimo ${min} caracteres`,
  maxLength: (max) => `Máximo ${max} caracteres`,
  email: "Email inválido",
  number: "Debe ser un número",
  phone: "Teléfono inválido",
  url: "URL inválida",
  date: "Fecha inválida (YYYY-MM-DD)"
};

// Sanitización de inputs
export function sanitizeInput(value) {
  if (typeof value !== "string") return value;

  // Remover scripts y tags peligrosos
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

// Validar archivo
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB por defecto
    allowedTypes = ["pdf", "doc", "docx", "xlsx", "xls"],
    required = true
  } = options;

  if (!file && required) {
    return "Archivo es requerido";
  }

  if (!file) return null;

  // Validar tamaño
  if (file.size > maxSize) {
    return `Archivo demasiado grande (máximo ${(maxSize / 1024 / 1024).toFixed(0)}MB)`;
  }

  // Validar tipo
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(", ")}`;
  }

  return null;
}
