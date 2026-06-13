import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function testOCR() {
  const args = process.argv.slice(2);
  const pdfPath = args[0];

  if (!pdfPath) {
    console.log("=== Smoke Test PDF OCR ===");
    console.log("Uso: node scripts/smoke-ocr.js <ruta-al-archivo-pdf>");
    console.log("\nPor favor proporciona la ruta de un PDF real para probar la extracción.");
    return;
  }

  const absolutePath = path.resolve(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: El archivo no existe en la ruta: ${absolutePath}`);
    return;
  }

  try {
    console.log(`Leyendo archivo: ${absolutePath}...`);
    const dataBuffer = fs.readFileSync(absolutePath);
    
    console.log("Iniciando extracción con pdf-parse...");
    const data = await pdf(dataBuffer);
    
    console.log("\n=== Información del PDF ===");
    console.log(`Páginas: ${data.numpages}`);
    console.log(`Metadatos del PDF:`, data.info);
    
    console.log("\n=== Muestra del Texto Extraído (primeros 500 caracteres) ===");
    console.log(data.text ? data.text.slice(0, 500) + "..." : "[Sin texto extraíble]");
    
    console.log("\n=== Extracción Exitosa! ===");
  } catch (error) {
    console.error("Error al procesar el PDF:", error);
  }
}

testOCR();
