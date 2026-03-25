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

  // If switched between mobile and desktop
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
  for (let i = 1; i <= lines; i++) {
    numbers += i + "\n";
  }
  lineNumbers.textContent = numbers;
}

codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
});

codeEditor.addEventListener("input", updateLineNumbers);

updateLineNumbers();

runBtn.addEventListener("click", async () => {
  const code = codeEditor.value.trim();
  if (!code) {
    output.innerHTML = '<div class="output-placeholder">Nothing to run!</div>';
    return;
  }

  output.innerHTML = "Running...";

  try {
    const response = await fetch("/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: code }),
    });

    const data = await response.json();

    output.innerHTML = `<pre>${data.output}</pre>`;
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
