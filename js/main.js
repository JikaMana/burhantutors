(function () {
  var r = document.documentElement;
  try {
    var s = localStorage.getItem("bt-theme");
    if (s) r.dataset.theme = s;
  } catch (e) {}
  document.getElementById("theme").addEventListener("click", function () {
    var d = r.dataset.theme
        ? r.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme:dark)").matches,
      n = d ? "light" : "dark";
    r.dataset.theme = n;
    try {
      localStorage.setItem("bt-theme", n);
    } catch (e) {}
  });
  var m = document.getElementById("menu"),
    l = document.getElementById("links");
  m.addEventListener("click", function () {
    var o = l.classList.toggle("open");
    m.setAttribute("aria-expanded", o);
  });
  l.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      l.classList.remove("open");
      m.setAttribute("aria-expanded", false);
    }
  });
  document.querySelectorAll("[data-pick]").forEach(function (a) {
    a.addEventListener("click", function () {
      document.getElementById("prog").value = a.dataset.pick;
    });
  });
  document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("name").value.trim(),
      er = document.getElementById("err");
    if (!n) {
      er.hidden = false;
      document.getElementById("name").focus();
      return;
    }
    er.hidden = true;
    window.open(
      "https://wa.me/2348165689362?text=" +
        encodeURIComponent(
          "Hello Burhan Tutors, my name is " +
            n +
            ". I would like to enrol in the " +
            document.getElementById("prog").value +
            " bootcamp.",
        ),
      "_blank",
      "noopener",
    );
  });
})();
