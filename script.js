const form = document.getElementById("emailForm");
const ventBox = document.getElementById("ventBox");
const message = document.getElementById("message");
const button = document.getElementById("releaseBtn");
const modal = document.getElementById("responseModal");
const closeBtn = document.getElementById("closeModal");

let typingInterval = null;

function typeText(element, text, speed = 30) {
  clearInterval(typingInterval);
  element.textContent = "";
  let i = 0;

  typingInterval = setInterval(() => {
    element.textContent += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(typingInterval);
  }, speed);
}
function closeModal() {
  modal.classList.remove("show");
  button.disabled = false;
}

closeBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = ventBox.value.trim();
  if (!text) return;

  ventBox.classList.add("fade-out");
  button.disabled = true;

  message.className = "loading";
  message.textContent = "Processing your thoughts...";
  modal.classList.add("show");

  try {
    const res = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json();

    setTimeout(() => {
      form.reset();
      ventBox.classList.remove("fade-out");

      message.className = data.level;
      typeText(message, data.reply || "No response generated.");
    }, 600);

  } catch (err) {
    message.className = "";
    message.textContent = "Something went wrong. Try again.";
    modal.classList.add("show");
  }
});