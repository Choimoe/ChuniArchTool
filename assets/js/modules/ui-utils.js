export function showAlert(container, message, type = "error") {
  container.innerHTML = `
        <div class="alert ${
          type === "error" ? "alert-error" : "alert-success"
        }">
            ${message}
        </div>
    `;
}

export function clearAlert(container) {
  container.innerHTML = "";
}
