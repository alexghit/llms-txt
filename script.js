const $ = (id) => document.getElementById(id);
const urlInput = $("url");
const go = $("go");
const status = $("status");
const result = $("result");
const output = $("output");
const resultMeta = $("resultMeta");
const display = $("display");
let current = "";

function setStatus(msg, isError = false) {
  status.textContent = msg;
  status.classList.toggle("error", isError);
}

urlInput.addEventListener("input", () => {
  display.classList.toggle("on", urlInput.value.trim().length > 0);
});

async function generate() {
  const value = urlInput.value.trim();
  if (!value) { setStatus("Enter a website URL.", true); urlInput.focus(); return; }

  go.disabled = true;
  setStatus("Crawling site…");
  result.hidden = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");

    current = data.llmstxt;
    output.textContent = current;
    resultMeta.textContent = `LLMS.TXT · ${data.pages} PAGES`;
    result.hidden = false;
    setStatus("Done. Review the descriptions before publishing.");
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    go.disabled = false;
  }
}

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(current);
    $("copy").textContent = "Copied";
    setTimeout(() => ($("copy").textContent = "Copy"), 1400);
  } catch { setStatus("Couldn't copy.", true); }
});

$("download").addEventListener("click", () => {
  const blob = new Blob([current], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "llms.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

function reset() {
  urlInput.value = "";
  result.hidden = true;
  current = "";
  setStatus("");
  display.classList.remove("on");
  urlInput.focus();
}

go.addEventListener("click", generate);
urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });
$("wordmark").addEventListener("click", (e) => { e.preventDefault(); reset(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") reset(); });
urlInput.focus();
