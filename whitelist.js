// ELYSIUM PUNKS whitelist registration.
// Entries are posted to the collection endpoint (FormSubmit AJAX, delivered
// to the project inbox) and compiled into the guaranteed (GTD) list.
// The first 1,000 verified entries are guaranteed one free mint each.
const WL_ENDPOINT = "https://formsubmit.co/ajax/appurbanova@gmail.com";

(function () {
  const form = document.getElementById("wlForm");
  if (!form) return;
  const err = document.getElementById("wlErr");
  const ok = document.getElementById("wlOk");
  const btn = document.getElementById("wlSubmit");
  const qEl = document.getElementById("captchaQ");
  const aEl = document.getElementById("captchaA");
  let answer = 0;

  function newCaptcha() {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 8);
    answer = a + b;
    qEl.textContent = a + " + " + b + " = ?";
    aEl.value = "";
  }
  function fail(msg) {
    err.textContent = msg;
    err.classList.add("show");
    err.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function codeFor(addr, handle) {
    const s = (addr + "|" + handle).toLowerCase();
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return "EP-" + h.toString(16).toUpperCase().padStart(8, "0");
  }

  newCaptcha();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    err.classList.remove("show");
    const handle = document.getElementById("xHandle").value.trim();
    const addr = document.getElementById("wallet").value.trim();
    const hp = document.getElementById("hpField").value;
    if (hp) return; // honeypot: silent drop
    if (!/^@?[A-Za-z0-9_]{1,15}$/.test(handle)) return fail("That X username doesn't look right. Letters, numbers and underscores, up to 15 characters.");
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return fail("That wallet address isn't a valid EVM address. It starts with 0x and runs 42 characters.");
    const tasks = ["tFollow", "tRepost", "tComment"].map((id) => document.getElementById(id).checked);
    if (tasks.some((t) => !t)) return fail("All three X tasks need a tick: follow, repost, comment. Do them first, then tick the boxes.");
    if (parseInt(aEl.value, 10) !== answer) { newCaptcha(); return fail("The little math check missed. New question above, try again."); }
    const cleanHandle = handle.replace(/^@/, "");
    const key = "ep_wl_" + addr.toLowerCase();
    if (localStorage.getItem(key)) return fail("This wallet is already registered from this browser. One spot per wallet.");
    if (!WL_ENDPOINT) return fail("The registration desk is being wired up right now. Give us a few minutes and try again.");

    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      const res = await fetch(WL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "EP WHITELIST ENTRY: " + addr,
          _template: "table",
          wallet_address: addr,
          x_handle: "@" + cleanHandle,
          tasks_confirmed: "follow, repost, comment",
          registered_at_utc: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error("endpoint " + res.status);
      localStorage.setItem(key, "1");
      document.getElementById("wlCode").textContent = codeFor(addr, cleanHandle);
      form.style.display = "none";
      ok.classList.add("show");
      ok.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (ex) {
      btn.disabled = false;
      btn.textContent = "Claim my spot";
      return fail("The entry didn't go through. Check your connection and send it again.");
    }
  });
})();
