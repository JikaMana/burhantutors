(function () {
  var PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  var box = document.getElementById("pg");
  if (!box) return;
  var code = document.getElementById("pg-code"),
    con = document.getElementById("pg-con"),
    frame = document.getElementById("pg-frame"),
    status = document.getElementById("pg-status"),
    runBtn = document.getElementById("pg-run"),
    stopBtn = document.getElementById("pg-stop"),
    files = box.querySelector(".pg-files");

  var START = {
    python:
      'import random\n\nsecret = random.randint(1, 10)\nprint("I picked a number between 1 and 10.")\n\nfor guess in range(1, 11):\n    if guess == secret:\n        print(f"Found it: {secret}!")\n        break\n    print(f"{guess} is not it...")\n',
    html: '<h1>Hello, builder</h1>\n<p>Click the button.</p>\n<button id="btn">Clicked 0 times</button>\n',
    css: "body{font-family:system-ui,sans-serif;display:grid;place-content:center;min-height:100vh;margin:0;background:#081423;color:#f7f6f3;text-align:center}\nbutton{padding:12px 22px;border:0;border-radius:6px;background:#c15f3c;color:#fff;font-size:1rem;cursor:pointer}\n",
    js: 'let n = 0;\nconst btn = document.getElementById("btn");\nbtn.addEventListener("click", () => {\n  n++;\n  btn.textContent = "Clicked " + n + " times";\n  console.log("count is", n);\n});\n',
  };
  var store = {
    python: START.python,
    html: START.html,
    css: START.css,
    js: START.js,
  };
  var mode = "python",
    file = "html",
    worker = null,
    ready = false,
    running = false;

  function key() {
    return mode === "python" ? "python" : file;
  }
  function log(text, cls) {
    var d = document.createElement("div");
    if (cls) d.className = cls;
    d.textContent = text;
    con.appendChild(d);
    con.scrollTop = con.scrollHeight;
  }
  function setRunning(v) {
    running = v;
    runBtn.disabled = v;
    stopBtn.hidden = !(v && mode === "python");
    status.textContent = v ? "running…" : "";
  }

  /* ---- tabs ---- */
  function load() {
    code.value = store[key()];
  }
  function save() {
    store[key()] = code.value;
  }
  box.querySelectorAll("[data-mode]").forEach(function (b) {
    if (b.tagName !== "BUTTON") return;
    b.addEventListener("click", function () {
      save();
      mode = b.dataset.mode;
      box.dataset.mode = mode;
      box.querySelectorAll(".pg-tabs:first-child button").forEach(function (x) {
        var on = x === b;
        x.setAttribute("aria-selected", on);
        x.tabIndex = on ? 0 : -1;
      });
      files.hidden = mode !== "web";
      con.textContent = "";
      setRunning(false);
      load();
    });
  });
  files.querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      save();
      file = b.dataset.file;
      files.querySelectorAll("button").forEach(function (x) {
        var on = x === b;
        x.setAttribute("aria-selected", on);
        x.tabIndex = on ? 0 : -1;
      });
      load();
    });
  });
  document.getElementById("pg-reset").addEventListener("click", function () {
    code.value = store[key()] = START[key()];
  });

  /* ---- editor: Tab inserts spaces, Esc releases focus trap ---- */
  var trap = true;
  code.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      trap = false;
      return;
    }
    if (e.key === "Tab" && trap && !e.shiftKey) {
      e.preventDefault();
      var s = code.selectionStart,
        pad = mode === "python" ? "    " : "  ";
      code.setRangeText(pad, s, code.selectionEnd, "end");
    } else if (e.key !== "Shift") {
      trap = true;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });

  /* ---- Python (Pyodide in a worker) ---- */
  var WORKER =
    "importScripts('" +
    PYODIDE +
    "');" +
    "let py;const ready=loadPyodide().then(p=>{py=p;" +
    "py.setStdout({batched:s=>postMessage({t:'out',s})});" +
    "py.setStderr({batched:s=>postMessage({t:'err',s})});" +
    "py.setStdin({stdin:()=>{throw new Error('input() is not supported in this playground')}});" +
    "postMessage({t:'ready'})}).catch(()=>postMessage({t:'err',s:'Could not load the Python runtime. Check your internet connection.'}));" +
    "onmessage=async e=>{await ready;if(!py){postMessage({t:'done'});return}" +
    "try{await py.runPythonAsync(e.data)}catch(err){postMessage({t:'err',s:String(err.message||err)})}postMessage({t:'done'})};";

  function startWorker() {
    ready = false;
    worker = new Worker(
      URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" })),
    );
    worker.onmessage = function (e) {
      var m = e.data;
      if (m.t === "out") log(m.s);
      else if (m.t === "err") log(m.s, "e");
      else if (m.t === "ready") {
        ready = true;
        log("Python ready.", "ok");
      } else if (m.t === "done") setRunning(false);
    };
    worker.onerror = function () {
      log("Runtime error.", "e");
      setRunning(false);
    };
  }
  stopBtn.addEventListener("click", function () {
    if (worker) worker.terminate();
    log("Stopped.", "w");
    setRunning(false);
    startWorker();
  });

  /* ---- Web (sandboxed iframe + console bridge) ---- */
  var BRIDGE =
    '<script>(function(){function s(t,a){parent.postMessage({pg:1,t:t,s:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}' +
    '["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});' +
    'addEventListener("error",function(e){s("error",[e.message])})})()<\/script>';
  window.addEventListener("message", function (e) {
    if (e.source !== frame.contentWindow || !e.data || !e.data.pg) return;
    log(e.data.s, e.data.t === "error" ? "e" : e.data.t === "warn" ? "w" : "");
  });

  function run() {
    if (running) return;
    save();
    con.textContent = "";
    if (mode === "web") {
      frame.srcdoc =
        '<!doctype html><meta charset="utf-8">' +
        BRIDGE +
        "<style>" +
        store.css +
        "</style>" +
        store.html +
        "<script>" +
        store.js +
        "<\/script>";
      log("Rendered.", "i");
      return;
    }
    if (!window.Worker) {
      log("Your browser does not support Web Workers.", "e");
      return;
    }
    if (!worker) startWorker();
    setRunning(true);
    if (!ready) log("Loading Python (first time takes a few seconds)…", "i");
    worker.postMessage(store.python);
  }
  runBtn.addEventListener("click", run);
  load();
})();
