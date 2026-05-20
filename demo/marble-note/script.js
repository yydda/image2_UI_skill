const phones = Array.from(document.querySelectorAll(".phone"));
const toast = document.querySelector(".toast");
let timer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove("show"), 1400);
}

function setActive(screen) {
  phones.forEach((phone) => {
    phone.classList.toggle("is-active", phone.dataset.screen === screen);
  });
  const target = document.querySelector(`[data-screen="${screen}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.go) {
    setActive(button.dataset.go);
    showToast(`${button.dataset.go} opened`);
    return;
  }

  if (button.dataset.toast) {
    showToast(button.dataset.toast);
  }
});

document.addEventListener("keydown", (event) => {
  const index = phones.findIndex((phone) => phone.classList.contains("is-active"));
  if (event.key === "ArrowRight") {
    setActive(phones[(index + 1) % phones.length].dataset.screen);
  }
  if (event.key === "ArrowLeft") {
    setActive(phones[(index - 1 + phones.length) % phones.length].dataset.screen);
  }
});
