// Importa la librería de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lee la clave de API desde las variables de entorno (más seguro)
// Deberás configurar esto en el entorno del servidor serverless.
const API_KEY = process.env.GEMINI_API_KEY;

// Si la API Key no está configurada, el servicio no puede funcionar.
if (!API_KEY) {
  // Exporta una función que siempre devuelve un error de configuración.
  module.exports = (req, res) => {
    res.status(500).json({ error: "La API Key de Google Gemini no está configurada en el servidor." });
  };
  // Detiene la ejecución del script aquí.
  return;
}

// Si la clave existe, procede a configurar la IA y a exportar la función principal.
const genAI = new GoogleGenerativeAI(API_KEY);

// Define el manejador principal de la función serverless
// (Compatible con Vercel, Netlify, Cloudflare Workers, etc.)
module.exports = async (req, res) => {
  // Configura los encabezados CORS para permitir peticiones desde cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si es una petición OPTIONS (pre-vuelo CORS), simplemente responde OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permite peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Parsea el cuerpo de la petición para obtener los datos
    const { pregunta, respuesta } = req.body;

    // Validación básica
    if (!pregunta || !respuesta) {
      return res.status(400).json({ error: "Faltan los parámetros 'pregunta' y 'respuesta'." });
    }

    // Obtiene el modelo de IA
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construye el prompt para la IA
    const prompt = `
      Eres un asistente de profesor para alumnos de primaria y secundaria.
      Tu tarea es evaluar la siguiente respuesta de un alumno a una pregunta de pensamiento crítico.

      Pregunta: "${pregunta}"
      Respuesta del alumno: "${respuesta}"

      Quiero que evalúes la respuesta y me devuelvas UNICAMENTE un objeto JSON con el siguiente formato:
      {"evaluacion": "Correcto" o "Incorrecto", "feedback": "Una retroalimentación breve y constructiva para el alumno."}

      Criterios de evaluación:
      - "Correcto": si la respuesta del alumno aborda la idea principal de la pregunta, aunque no sea perfecta. Sé flexible, son niños.
      - "Incorrecto": si la respuesta es claramente irrelevante, no responde a la pregunta o es un texto sin sentido.
      - El feedback debe ser positivo y animar al alumno a mejorar, explicando qué estuvo bien o qué podría añadir.
    `;

    // Envía el prompt a la IA y espera el resultado
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Intenta parsear la respuesta JSON de la IA
    let jsonResponse;
    try {
      // Limpia la respuesta de la IA por si viene con formato incorrecto (ej. ```json ... ```)
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
      // Si la IA no devuelve un JSON válido, crea un error
      console.error("Error al parsear JSON de la IA:", text);
      return res.status(500).json({ error: "La respuesta de la IA no tuvo un formato JSON válido." });
    }

    // Devuelve la respuesta parseada al cliente
    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
  }
};
