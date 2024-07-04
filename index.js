document.getElementById("file-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageUrl = URL.createObjectURL(file);
    document.getElementById("image").src = imageUrl;

    const processedImage = await preprocessImage(file);
    const extractedText = await performOcr(processedImage);
    const correctedText = autoCorrectText(extractedText);
    document.getElementById("extracted-text").value = correctedText;

    if (!containsCode(correctedText)) {
      showCorrectionDialog(file, correctedText);
    } else {
      saveExtractedText(file.name, correctedText);
    }
  }
});

async function preprocessImage(file) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
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
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

async function performOcr(image) {
  const result = await Tesseract.recognize(image, "eng");
  return result.data.text;
}

function containsCode(text) {
  const regex = /\b\d{3}\/\d{3}\b/;
  return regex.test(text);
}

function showCorrectionDialog(file, extractedText) {
  const correctedText = prompt("The extracted text doesn\'t contain a valid code. Please correct it:", extractedText);
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

function autoCorrectText(text) {
  let correctedText = text;
  const corrections = {
    "6n": "on",
    "R ": "",
    "®": "",
    "oy =": "",
    "llus": "Illus.",
    "Ninenda": "Nintendo"
    // Add more corrections as needed
  };

  for (const [wrong, right] of Object.entries(corrections)) {
    const regex = new RegExp(wrong, 'g');
    correctedText = correctedText.replace(regex, right);
  }

  return correctedText;
}

document.getElementById("save-correction").addEventListener("click", () => {
  const imageName = document.getElementById("image").src.split("/").pop();
  const correctedText = document.getElementById("extracted-text").value;
  saveCorrection(imageName, correctedText);
});
