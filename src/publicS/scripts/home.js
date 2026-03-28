const codeEditor = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
const output = document.getElementById("output");
const runBtn = document.querySelector(".btn-run");
const resetBtn = document.querySelector(".btn-reset");
const clearBtn = document.getElementById("clearBtn");

// ===============================
const tabs = document.querySelectorAll(".file-tab");
const editorContainer = document.querySelector(".editor-container");
const outputContent = document.getElementById("output");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const selectedTab = tab.dataset.tab;

    if (window.innerWidth <= 768) {
      if (selectedTab === "editor") {
        if (!editorContainer.contains(codeEditor)) {
          const currentChild = editorContainer.querySelector(
            "#codeEditor, #output",
          );
          if (currentChild) editorContainer.removeChild(currentChild);
          editorContainer.appendChild(codeEditor);
        }
      } else if (selectedTab === "output") {
        if (!editorContainer.contains(outputContent)) {
          const currentChild = editorContainer.querySelector(
            "#codeEditor, #output",
          );
          if (currentChild) editorContainer.removeChild(currentChild);
          editorContainer.appendChild(outputContent);
        }
      }
    }
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    if (!editorContainer.contains(codeEditor))
      editorContainer.appendChild(codeEditor);
  }
});

let lastWidth = window.innerWidth;

window.addEventListener("resize", () => {
  const currentWidth = window.innerWidth;
  if (
    (lastWidth <= 768 && currentWidth > 768) ||
    (lastWidth > 768 && currentWidth <= 768)
  ) {
    location.reload();
  }
  lastWidth = currentWidth;
});

//============================

function updateLineNumbers() {
  const lines = codeEditor.value.split("\n").length;
  let numbers = "";
  for (let i = 1; i <= lines; i++) numbers += i + "\n";
  lineNumbers.textContent = numbers;
}

codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
});

codeEditor.addEventListener("input", updateLineNumbers);

updateLineNumbers();

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

runBtn.addEventListener("click", async () => {
  const code = codeEditor.value.trim();
  if (!code) {
    output.textContent = "Nothing to run!";
    return;
  }

  output.textContent = "Running...";

  try {
    const response = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    output.innerHTML = `<pre>${escapeHTML(data.output)}</pre>`;
  } catch (err) {
    output.innerHTML = `<pre style="color:red;">Server Error</pre>`;
  }
});

resetBtn.addEventListener("click", () => {
  codeEditor.value = "";
  updateLineNumbers();
  output.innerHTML =
    '<div class="output-placeholder">Click "Run" to see the output here...</div>';
});

clearBtn.addEventListener("click", () => {
  output.innerHTML =
    '<div class="output-placeholder">Click "Run" to see the output here...</div>';
});

// debug toggle button:
const debugToggle = document.getElementById("debugToggle");

debugToggle.addEventListener("click", () => {
  const currentState = debugToggle.dataset.state;
  const newState = currentState === "off" ? "on" : "off";
  debugToggle.dataset.state = newState;
  debugToggle.querySelector(".debug-text").textContent = newState.toUpperCase();
});

runBtn.addEventListener("click", async () => {
  const code = codeEditor.value.trim();
  if (!code) {
    output.textContent = "Nothing to run!";
    return;
  }

  output.textContent = "Running...";

  try {
    const response = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        debug: debugToggle.dataset.state === "on",
      }),
    });

    const data = await response.json();
    output.innerHTML = `<pre>${escapeHTML(data.output)}</pre>`;
  } catch (err) {
    output.innerHTML = `<pre style="color:red;">Server Error</pre>`;
  }
});

// import button
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

importBtn.addEventListener("click", () => {
  fileInput.click(); // open file picker
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // only allow .spark files
  if (!file.name.endsWith(".spark")) {
    alert("Please select a .spark file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    codeEditor.value = e.target.result; // paste file contents into editor
    updateLineNumbers();
  };
  reader.readAsText(file);
});
