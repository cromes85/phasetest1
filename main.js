document
  .getElementById("file-input")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      document.getElementById("image").src = imageUrl;

      const processedImage = await preprocessImage(file);
      const { text: extractedText, lang: detectedLang } = await performOcr(
        processedImage
      );
      const correctedText = await autoCorrectText(extractedText);
      document.getElementById("extracted-text").value = correctedText;
      document.getElementById("detected-language").value = detectedLang;
      resizeLanguageBox(detectedLang);

      if (!containsCode(correctedText)) {
        showCorrectionDialog(file, correctedText);
      } else {
        saveExtractedText(file.name, correctedText);
      }
    }
  });

async function preprocessImage(file) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // red
    data[i + 1] = avg; // green
    data[i + 2] = avg; // blue
  }

  // Increase contrast
  const contrast = 50; // You can adjust the contrast value
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = truncate(factor * (data[i] - 128) + 128);
    data[i + 1] = truncate(factor * (data[i + 1] - 128) + 128);
    data[i + 2] = truncate(factor * (data[i + 2] - 128) + 128);
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function truncate(value) {
  return Math.min(255, Math.max(0, value));
}

async function performOcr(image) {
  const result = await Tesseract.recognize(image, "eng", {
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.:;'\"()!? /",
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });
  const detectedLang = detectLanguage(result.data.text);
  const cleanedText = result.data.text.replace(/\n/g, " ").trim();
  return { text: cleanedText, lang: detectedLang };
}

function detectLanguage(text) {
  const frenchWords = ["et", "le", "la", "les", "des", "un", "une"];
  const englishWords = ["and", "the", "is", "in", "on", "at"];

  let frenchCount = 0;
  let englishCount = 0;

  frenchWords.forEach((word) => {
    if (text.includes(word)) frenchCount++;
  });

  englishWords.forEach((word) => {
    if (text.includes(word)) englishCount++;
  });

  return frenchCount > englishCount ? "French" : "English";
}

function resizeLanguageBox(text) {
  const languageBox = document.getElementById("detected-language");
  languageBox.style.width = `${text.length + 2}ch`;
}

function containsCode(text) {
  const regex = /\b\d{1,3}\/\d{1,3}\b/;
  return regex.test(text);
}

function showCorrectionDialog(file, extractedText) {
  const correctedText = prompt(
    "The extracted text doesn't contain a valid code. Please correct it:",
    extractedText
  );
  if (correctedText !== null) {
    saveCorrection(file.name, correctedText);
    document.getElementById("extracted-text").value = correctedText;
  }
}

function saveExtractedText(imageName, text) {
  localStorage.setItem(imageName, text);
}

function saveCorrection(imageName, correctText) {
  localStorage.setItem(imageName, correctText);
}

async function autoCorrectText(text) {
  let correctedText = text;
  const corrections = {
    "6n": "on",
    "R ": "",
    "®": "",
    "oy =": "",
    llus: "Illus.",
    Ninenda: "Nintendo",
  };

  for (const [wrong, right] of Object.entries(corrections)) {
    const regex = new RegExp(wrong, "g");
    correctedText = correctedText.replace(regex, right);
  }

  const validatedText = await validateCardCode(correctedText);
  return validatedText;
}

async function validateCardCode(text) {
  const regex = /\b\d{1,3}\/\d{1,3}\b/;
  const matches = text.match(regex);
  if (matches) {
    const code = matches[0];
    const [number, total] = code.split("/");
    const response = await fetch(`https://tcgdex.dev/fr/rest/set-card`);
    const data = await response.json();
    const validCodes = data.map((card) => card.number + "/" + card.total);
    if (!validCodes.includes(code)) {
      const correctedCode = validCodes.find((validCode) =>
        validCode.startsWith(number + "/")
      );
      if (correctedCode) {
        text = text.replace(code, correctedCode);
      }
    }
  }
  return text;
}

document.getElementById("save-correction").addEventListener("click", () => {
  const imageName = document.getElementById("image").src.split("/").pop();
  const correctedText = document.getElementById("extracted-text").value;
  saveCorrection(imageName, correctedText);
});
