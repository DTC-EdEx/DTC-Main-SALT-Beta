/* SALT mobile app. Shared code lives in salt.js. */
window.SALT_MOBILE_APP = true;

/* =========================================================
   SALT LEARNING FRAMEWORK
   Loads salt.js from the same folder as this file, passing on
   the ?v= version so a new version number refreshes both files.
   ========================================================= */
(function () {
    var current = document.currentScript;
    var base =
        current && current.src
            ? current.src
            : "https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.Mobile.4.0.js";
    var query = base.indexOf("?") > -1 ? base.slice(base.indexOf("?")) : "";
    var script = document.createElement("script");
    script.src = base.split("?")[0].replace(/[^/]*$/, "salt.js") + query;
    document.head.appendChild(script);
})();
