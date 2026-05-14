import fs from 'fs';
import fetch from 'node-fetch';

/**
 * Plate recognition service backed by Google Cloud Vision REST API.
 * We use the REST API directly to force API Key usage and avoid the SDK's 
 * stubborn dependency on Service Account JSON files.
 */
export async function readPlateFromImage(imagePath) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not defined");

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[plateRecognitionService] Vision API error:", data);
      throw new Error(`Vision API Error: ${data.error?.message || 'Unknown'}`);
    }

    const annotations = data.responses[0].textAnnotations;
    if (!annotations || annotations.length === 0) {
      return { success: true, plate: null, message: "No text detected" };
    }

    const rawText = annotations[0].description || "";
    const plate = pickBestPlate(rawText);

    return {
      success: true,
      plate,
      confidence: 100, 
      results: {
        text: rawText,
        engine: "google-cloud-vision-rest",
      },
    };
  } catch (err) {
    console.error("[plateRecognitionService] OCR error:", err);
    return {
      success: false,
      message: err?.message || "OCR service failed",
      plate: null,
    };
  }
}

function pickBestPlate(rawText) {
  if (!rawText) return null;
  const lines = rawText.toUpperCase().split('\n');
  
  const mexicanStates = [
    "CDMX", "MEXICO", "JALISCO", "NUEVO", "LEON", "PUEBLA", "VERACRUZ", 
    "CHIHUAHUA", "GUANAJUATO", "SONORA", "QUERETARO"
  ];

  for (const line of lines) {
    const cleaned = line.replace(/[^A-Z0-9-]/g, "");
    if (
      cleaned.length >= 6 && cleaned.length <= 9 &&
      !mexicanStates.includes(cleaned)
    ) {
      if (/[0-9]/.test(cleaned) && /[A-Z]/.test(cleaned)) {
        return cleaned;
      }
    }
  }

  const cleanedFull = rawText.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const matches = cleanedFull.match(/[A-Z0-9-]{6,9}/g);
  if (matches) {
     const validMatch = matches.find(m => /[0-9]/.test(m) && /[A-Z]/.test(m));
     if (validMatch) return validMatch;
  }
  
  return null;
}

export default { readPlateFromImage };
