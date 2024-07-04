document
  .getElementById("file-input")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      document.getElementById("image").src = imageUrl;

      const extractedText = await performOcr(file);
      document.getElementById("extracted-text").value = extractedText;

      if (!containsCode(extractedText)) {
        showCorrectionDialog(file, extractedText);
      } else {
        saveExtractedText(file.name, extractedText);
      }
    }
  });

async function performOcr(file) {
  const result = await Tesseract.recognize(file, "eng");
  return result.data.text;
}

function containsCode(text) {
  const regex = /\b\d{3}\/\d{3}\b/;
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

document.getElementById("save-correction").addEventListener("click", () => {
  const imageName = document.getElementById("image").src.split("/").pop();
  const correctedText = document.getElementById("extracted-text").value;
  saveCorrection(imageName, correctedText);
});
