// === Simple admin password gate ===
// Change this to your own password BEFORE uploading:
const ADMIN_PASSWORD = "Siman!2025";  // <-- edit me
let ADMIN_ON = false;
function requireAdmin() {
  if (ADMIN_ON) return true;
  const entered = prompt("Enter admin password:");
  if (entered === ADMIN_PASSWORD) {
    ADMIN_ON = true;
    try { sessionStorage.setItem("siman_admin_on", "1"); } catch {}
    updateUI();
    return true;
  }
  alert("Incorrect password.");
  return false;
}
try { ADMIN_ON = sessionStorage.getItem("siman_admin_on") === "1"; } catch {}

function updateUI() {
  const toggle = document.getElementById('adminToggle');
  const panel = document.getElementById('adminPanel');
  if (ADMIN_ON) {
    toggle.textContent = "Admin: On";
    panel.style.display = "block";
  } else {
    toggle.textContent = "Admin: Off";
    panel.style.display = "none";
  }
}

document.getElementById('adminToggle').addEventListener('click', ()=>{
  if (!ADMIN_ON) { if (!requireAdmin()) return; }
  else { ADMIN_ON = false; sessionStorage.removeItem("siman_admin_on"); }
  updateUI();
});

// Initial state
updateUI();
