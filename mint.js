/* ELYSIUM PUNKS - public mint wiring (index page only)
   Plain EIP-1193, no libraries. Reads state over the public RPC,
   mints through the visitor's own wallet on the Elysium chain. */
(function () {
  "use strict";

  var NFT = "0xEd52500CD7698fDE43Bd4fD3f6044baDF2B60039";
  var RPC = "https://rpc.elyscan.live";
  var CHAIN_ID = "0x1863d"; // 99901
  var EXPLORER = "https://elyscan.live";
  var SEL = {
    minted: "0xa2309ff8", // totalMinted()
    open: "0xba70c515",   // publicOpen()
    price: "0x5d463810",  // publicPriceWei()
    mint: "0xefd0cbf9"    // mintPublic(uint256)
  };
  var MAX_SUPPLY = 9999;
  var MAX_QTY = 20;

  var connectBtn = document.getElementById("connectBtn");
  var heroBtn = document.getElementById("mintBtn");
  var goBtn = document.getElementById("mintGo");
  var statusEl = document.getElementById("mintStatus");
  var countEl = document.getElementById("mintCount");
  var totalEl = document.getElementById("mintTotal");
  var qtyEl = document.getElementById("qtyVal");
  var minusBtn = document.getElementById("qtyMinus");
  var plusBtn = document.getElementById("qtyPlus");
  if (!goBtn && !heroBtn) { return; }

  var account = null;
  var qty = 1;
  var priceWei = null; // BigInt
  var busy = false;

  function setStatus(msg, isHtml) {
    if (!statusEl) { return; }
    if (isHtml) { statusEl.innerHTML = msg; } else { statusEl.textContent = msg; }
  }
  function shortAddr(a) { return a.slice(0, 6) + "…" + a.slice(-4); }
  function fmtHype(wei) {
    // wei BigInt -> HYPE string, up to 6 decimals trimmed
    var s = wei.toString().padStart(19, "0");
    var whole = s.slice(0, s.length - 18);
    var frac = s.slice(s.length - 18, s.length - 12).replace(/0+$/, "");
    return frac ? whole + "." + frac : whole;
  }
  function padQty(n) {
    var h = n.toString(16);
    return "0".repeat(64 - h.length) + h;
  }

  function rpcEthCall(data) {
    return fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: NFT, data: data }, "latest"] })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.result) { throw new Error("rpc"); }
      return BigInt(j.result);
    });
  }
  function walletEthCall(data) {
    return window.ethereum.request({ method: "eth_call", params: [{ to: NFT, data: data }, "latest"] })
      .then(function (r) { return BigInt(r); });
  }
  function readState() {
    var read = window.ethereum && account ? walletEthCall : rpcEthCall;
    return Promise.all([read(SEL.minted), read(SEL.open), read(SEL.price)]).then(function (v) {
      var minted = Number(v[0]), open = v[1] === 1n;
      priceWei = v[2];
      if (countEl) {
        countEl.textContent = minted.toLocaleString("en-US") + " / " + MAX_SUPPLY.toLocaleString("en-US") +
          " minted · Public mint " + (open ? "is open" : "is closed") +
          " · Price " + fmtHype(priceWei) + " HYPE a punk";
      }
      updateTotal();
      if (heroBtn) {
        heroBtn.disabled = !open;
        heroBtn.textContent = open ? "Mint a punk" : "Mint is closed";
      }
      if (goBtn) {
        goBtn.disabled = !open || busy;
        goBtn.textContent = account ? "Mint now" : "Connect and mint";
      }
      return open;
    }).catch(function () {
      if (countEl) { countEl.textContent = "Could not read the chain. Connect a wallet to mint."; }
      if (heroBtn) { heroBtn.disabled = false; heroBtn.textContent = "Mint a punk"; }
    });
  }
  function updateTotal() {
    if (qtyEl) { qtyEl.textContent = String(qty); }
    if (totalEl && priceWei !== null) {
      totalEl.textContent = "Total " + fmtHype(priceWei * BigInt(qty)) + " HYPE + gas";
    }
  }
  if (minusBtn) { minusBtn.addEventListener("click", function () { if (qty > 1) { qty--; updateTotal(); } }); }
  if (plusBtn) { plusBtn.addEventListener("click", function () { if (qty < MAX_QTY) { qty++; updateTotal(); } }); }

  function ensureChain() {
    return window.ethereum.request({ method: "eth_chainId" }).then(function (id) {
      if (id === CHAIN_ID) { return; }
      return window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID }] })
        .catch(function (e) {
          if (e && e.code === 4902) {
            return window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: CHAIN_ID, chainName: "Elysium",
                nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
                rpcUrls: [RPC], blockExplorerUrls: [EXPLORER]
              }]
            });
          }
          throw e;
        });
    });
  }
  function connect() {
    if (!window.ethereum) {
      setStatus("No wallet found. Install MetaMask or any EVM wallet, then reload this page.");
      scrollToPanel();
      return Promise.reject(new Error("no wallet"));
    }
    return window.ethereum.request({ method: "eth_requestAccounts" }).then(function (accs) {
      account = accs && accs[0] ? accs[0] : null;
      if (!account) { throw new Error("no account"); }
      return ensureChain();
    }).then(function () {
      if (connectBtn) { connectBtn.textContent = shortAddr(account); }
      return readState();
    });
  }
  function scrollToPanel() {
    var p = document.getElementById("mintPanel");
    if (p) { p.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  function mint() {
    if (busy) { return; }
    scrollToPanel();
    var start = account ? Promise.resolve() : connect();
    start.then(function () {
      if (priceWei === null) { return readState(); }
    }).then(function () {
      busy = true;
      if (goBtn) { goBtn.disabled = true; goBtn.textContent = "Minting…"; }
      setStatus("Confirm the mint in your wallet…");
      var value = priceWei * BigInt(qty);
      return window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: account, to: NFT,
          data: SEL.mint + padQty(qty),
          value: "0x" + value.toString(16)
        }]
      });
    }).then(function (hash) {
      setStatus("Sent. Waiting for the chain… <a href=\"" + EXPLORER + "/tx/" + hash + "\" target=\"_blank\" rel=\"noopener\">View transaction</a>", true);
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        window.ethereum.request({ method: "eth_getTransactionReceipt", params: [hash] }).then(function (rcpt) {
          if (!rcpt) { if (tries > 30) { clearInterval(iv); busy = false; readState(); } return; }
          clearInterval(iv);
          busy = false;
          if (rcpt.status === "0x1") {
            setStatus("Minted. Your punk" + (qty > 1 ? "s reveal" : " reveals") + " exactly 24 hours from now. <a href=\"" + EXPLORER + "/tx/" + hash + "\" target=\"_blank\" rel=\"noopener\">View transaction</a>", true);
          } else {
            setStatus("The transaction failed on chain. No punk was minted.");
          }
          readState();
        }).catch(function () { /* keep polling */ });
      }, 2500);
    }).catch(function (e) {
      busy = false;
      if (goBtn) { goBtn.disabled = false; goBtn.textContent = account ? "Mint now" : "Connect and mint"; }
      if (e && e.code === 4001) { setStatus("You rejected the request in your wallet. Nothing was minted."); }
      else if (e && e.message && e.message !== "no wallet") { setStatus("Mint failed: " + e.message); }
    });
  }

  if (connectBtn) {
    connectBtn.addEventListener("click", function () {
      if (account) { return; }
      connect().catch(function (e) {
        if (e && e.code === 4001) { setStatus("You rejected the connection request."); scrollToPanel(); }
      });
    });
  }
  if (goBtn) { goBtn.addEventListener("click", mint); }
  if (heroBtn) { heroBtn.addEventListener("click", mint); }
  if (window.ethereum) {
    window.ethereum.on && window.ethereum.on("accountsChanged", function (accs) {
      account = accs && accs[0] ? accs[0] : null;
      if (connectBtn) { connectBtn.textContent = account ? shortAddr(account) : "Connect Wallet"; }
      readState();
    });
    window.ethereum.on && window.ethereum.on("chainChanged", function () { readState(); });
  }
  readState();
})();
