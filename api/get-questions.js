// Importa la función 'fetch' si usas una versión de Node que no la tiene globalmente (necesario para Vercel)
const fetch = require('node-fetch');

// La URL pública del Google Sheet en formato CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaN_VzM1TVypabkDvbGNuF6TBdwdKy7PIKHR3g0VgT1TCMiQXm59brQhDQ3Vesemn7LdFmZEpWKzCP/pub?output=csv';

// Define el manejador principal de la función serverless
module.exports = async (req, res) => {
  // Configura los encabezados CORS para permitir peticiones desde cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es una petición OPTIONS (pre-vuelo CORS), simplemente responde OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permite peticiones GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Realiza la petición fetch al Google Sheet
    const response = await fetch(CSV_URL);

    // Si la petición a Google falla, devuelve un error
    if (!response.ok) {
      throw new Error(`Error al obtener el CSV de Google: ${response.statusText}`);
    }

    // Obtiene el contenido del CSV como texto
    const csvText = await response.text();

    // Establece el tipo de contenido de la respuesta como texto CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    // Envía el contenido del CSV como respuesta
    return res.status(200).send(csvText);

  } catch (error) {
    console.error("Error en la función serverless (get-questions):", error);
    return res.status(500).json({ error: "Ocurrió un error interno al obtener las preguntas." });
  }
};
