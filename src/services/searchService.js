import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE BÚSQUEDA FULL-TEXT
// Búsqueda inteligente en expedientes
// ============================================

export async function searchExpedientes(expedientes, query) {
  if (!query || query.trim() === "") return expedientes;

  const q = query.toLowerCase();

  return expedientes.filter(exp => {
    // Búsqueda en múltiples campos
    const searchFields = [
      exp.title || "",
      exp.id || "",
      exp.solicitanteName || "",
      exp.otorganteName || "",
      exp.sector || "",
      exp.status || "",
      exp.description || "",
      (exp.amount || "").toString()
    ];

    // Score de relevancia
    let score = 0;

    // Coincidencia exacta = puntuación máxima
    if (searchFields.some(field => field.toLowerCase() === q)) score += 100;

    // Coincidencia al inicio = alta puntuación
    if (searchFields.some(field => field.toLowerCase().startsWith(q))) score += 50;

    // Coincidencia parcial = puntuación normal
    if (searchFields.some(field => field.toLowerCase().includes(q))) score += 10;

    return score > 0;
  });
}

export function searchDocuments(documents, query) {
  if (!query || query.trim() === "") return documents;

  const q = query.toLowerCase();

  return documents.filter(doc => {
    const searchFields = [
      doc.fileName || "",
      doc.documentType || "",
      doc.status || "",
      doc.description || "",
      doc.uploadedBy || ""
    ];

    return searchFields.some(field => field.toLowerCase().includes(q));
  });
}

export function searchRequirements(requirements, query) {
  if (!query || query.trim() === "") return requirements;

  const q = query.toLowerCase();

  return requirements.filter(req => {
    const searchFields = [
      req.title || "",
      req.description || "",
      req.status || "",
      req.priority || ""
    ];

    return searchFields.some(field => field.toLowerCase().includes(q));
  });
}

export function searchMessages(messages, query) {
  if (!query || query.trim() === "") return messages;

  const q = query.toLowerCase();

  return messages.filter(msg => {
    return (msg.body || "").toLowerCase().includes(q) ||
           (msg.fromUserName || "").toLowerCase().includes(q);
  });
}

// Búsqueda multi-tipo
export async function globalSearch(
  expedientes,
  documents,
  requirements,
  messages,
  query
) {
  if (!query || query.trim() === "") {
    return {
      expedientes: [],
      documents: [],
      requirements: [],
      messages: [],
      totalResults: 0
    };
  }

  const searchResults = {
    expedientes: searchExpedientes(expedientes, query),
    documents: searchDocuments(documents, query),
    requirements: searchRequirements(requirements, query),
    messages: searchMessages(messages, query),
    totalResults: 0
  };

  searchResults.totalResults =
    searchResults.expedientes.length +
    searchResults.documents.length +
    searchResults.requirements.length +
    searchResults.messages.length;

  return searchResults;
}

// Sugerencias de búsqueda (basadas en histórico)
export function getSearchSuggestions(items, field = "title") {
  const suggestions = new Set();

  items.forEach(item => {
    const value = item[field];
    if (value && typeof value === "string") {
      // Agregar el valor completo
      suggestions.add(value);

      // Agregar partes del valor
      value.split(" ").forEach(word => {
        if (word.length > 2) {
          suggestions.add(word);
        }
      });
    }
  });

  return Array.from(suggestions).sort();
}

// Búsqueda con filtros avanzados
export function advancedSearch(items, filters) {
  return items.filter(item => {
    // Aplicar cada filtro
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === "") continue;

      const itemValue = item[key];

      // Búsqueda de texto
      if (typeof value === "string") {
        if (!itemValue || !String(itemValue).toLowerCase().includes(String(value).toLowerCase())) {
          return false;
        }
      }
      // Búsqueda exacta
      else if (typeof value === "number" || typeof value === "boolean") {
        if (itemValue !== value) {
          return false;
        }
      }
      // Búsqueda en array
      else if (Array.isArray(value)) {
        if (!value.includes(itemValue)) {
          return false;
        }
      }
    }
    return true;
  });
}

// Resaltar términos de búsqueda en resultados
export function highlightSearchTerm(text, query) {
  if (!text || !query) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, i) =>
    regex.test(part) ? `<mark>${part}</mark>` : part
  ).join("");
}
