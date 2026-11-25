/* =========================================================
   DESIGNPLUS CONFIGURATION
   ========================================================= */

DpPrimary = {
    lms: "canvas",
    templateCourse: "613234",
    hideButton: true,
    enableWizard: false,
    hideLti: false,
    extendedCourse: "",
    sharedCourse: "",
    courseFormats: [],
    canvasRoles: [],
    canvasUsers: ["1681565", "2053778", "2124885", "2212481", "2261108", "2192875", "2209332"],
    canvasCourseIds: [],
    plugins: [],
    excludedModules: [],
    includedModules: [],
    lang: "en"
};

DpConfig = Object.assign({}, DpPrimary, window.DpConfig || {});

$(function () {
    var uriPrefix = location.href.includes(".beta.") ? "beta." : "";

    var toolsUri = DpConfig.toolsUri
        ? DpConfig.toolsUri
        : "https://" + uriPrefix + "designplus.ciditools.com/";

    $.getScript(toolsUri + "js/controller.js")
        .done(function () {
            console.log("DesignPLUS controller loaded");
        })
        .fail(function () {
            console.error("DesignPLUS controller failed to load");
        });
});

/* =========================================================
   READSPEAKER
   ========================================================= */

window.rsConf = {
    docReader: {}
};

(function () {
    jQuery
        .ajax({
            url: "//cdn-na.readspeaker.com/script/14220/webReaderForEducation/canvas/current/ReadSpeaker.Canvas.js",
            dataType: "script",
            async: true,
            cache: true
        })
        .done(function () {
            console.log("ReadSpeaker loaded");
        })
        .fail(function () {
            console.error("ReadSpeaker failed to load");
        });
})();

/* =========================================================
   DAVIS TECH TOOLS
   ========================================================= */

$.getScript("https://davistools.davistech.edu/scripts/loader.js")
    .done(function () {
        console.log("Davis Tools loader loaded");
    })
    .fail(function () {
        console.error("Davis Tools loader failed to load");
    });

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
            : "https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.EdEx.4.0.js";
    var query = base.indexOf("?") > -1 ? base.slice(base.indexOf("?")) : "";
    var script = document.createElement("script");
    script.src = base.split("?")[0].replace(/[^/]*$/, "salt.js") + query;
    document.head.appendChild(script);
})();
