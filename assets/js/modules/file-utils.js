export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file, "UTF-8");
  });
}

export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function setupFileDropZone(
  dropZoneId,
  fileInputId,
  fileNameId,
  onFileSelect
) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const fileNameEl = document.getElementById(fileNameId);
  const originalLabel = fileNameEl.textContent;

  function handleFile(file) {
    if (file) {
      fileNameEl.textContent = file.name;
      fileNameEl.classList.add("file-name");
      onFileSelect(file);
    }
  }

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () =>
      dropZone.classList.add("dragover")
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () =>
      dropZone.classList.remove("dragover")
    );
  });

  dropZone.addEventListener("drop", (e) => {
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.value = "";
  fileNameEl.textContent = originalLabel;
  fileNameEl.classList.remove("file-name");
}
