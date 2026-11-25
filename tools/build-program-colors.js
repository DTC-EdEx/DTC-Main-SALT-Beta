#!/usr/bin/env node
/*
 * Builds the PROGRAM COLORS block in salt.css from tools/program-colors.json.
 *
 *   node tools/build-program-colors.js          rewrite salt.css and print a contrast report
 *   node tools/build-program-colors.js --check  only print the report (salt.css is not changed)
 *
 * Each program gives seven colors. Every other shade SALT needs (hover, dark,
 * pale backgrounds, muted text, ...) is worked out from those seven, so changing
 * a program's look means changing only its seven hex codes.
 *
 * Accessibility: every text/background pair SALT uses is checked against
 * WCAG 2.2 AA (4.5:1 for text, 3:1 for focus rings and control borders).
 *
 * Optional style choices (tab and card looks) are listed in STYLES below.
 * When a color a program asked for would fail, the script darkens it just
 * enough to pass, uses the adjusted color, and says so in the report.
 */
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var CONFIG = path.join(__dirname, "program-colors.json");
var CSS = path.join(ROOT, "salt.css");
var START = "/* PROGRAM COLORS:START";
var END = "/* PROGRAM COLORS:END */";

var TEXT_AA = 4.5;
var UI_AA = 3;
var INPUTS = ["primary", "secondary", "light", "pale", "gray", "white", "text"];

/* ---------- color math ---------- */

function parse(hex) {
    var h = String(hex).trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, "$&$&");
    if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error("Not a hex color: " + hex);
    return [0, 2, 4].map(function (i) {
        return parseInt(h.slice(i, i + 2), 16);
    });
}

function hex(rgb) {
    return (
        "#" +
        rgb
            .map(function (v) {
                return Math.round(Math.max(0, Math.min(255, v)))
                    .toString(16)
                    .padStart(2, "0");
            })
            .join("")
    );
}

/* Mix color a toward color b by amount t (0 = all a, 1 = all b). */
function mix(a, b, t) {
    var x = parse(a),
        y = parse(b);
    return hex(
        x.map(function (v, i) {
            return v + (y[i] - v) * t;
        })
    );
}

function luminance(color) {
    var c = parse(color).map(function (v) {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
    var l1 = luminance(a),
        l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function passesAll(color, backgrounds, ratio) {
    return backgrounds.every(function (bg) {
        return contrast(color, bg) >= ratio;
    });
}

/* Darken (or lighten) a color in small steps until it passes on every background. */
function fix(color, backgrounds, ratio, toward) {
    toward = toward || "#000000";
    for (var t = 0; t <= 1.0001; t += 0.01) {
        var c = mix(color, toward, t);
        if (passesAll(c, backgrounds, ratio)) return c;
    }
    return toward;
}

/* The lightest mix of a toward b that still passes on every background. */
function lightestPassing(a, b, backgrounds, ratio) {
    var best = a;
    for (var t = 0; t <= 1.0001; t += 0.01) {
        var c = mix(a, b, t);
        if (passesAll(c, backgrounds, ratio)) best = c;
        else break;
    }
    return best;
}

function rgbList(color) {
    return parse(color).join(", ");
}

/* ---------- build one program ---------- */

function build(key, program) {
    var notes = [];
    var c = {};
    // A program with no accent color uses its primary color for accents too.
    if (!program.secondary) {
        program.secondary = program.primary;
        notes.push("NOTE: no secondary color given, so accents use the primary color");
    }
    INPUTS.forEach(function (name) {
        if (!program[name]) throw new Error(key + " is missing its " + name + " color");
        c[name] = hex(parse(program[name]));
    });

    function adjust(name, value, why) {
        if (value !== c[name]) {
            notes.push(
                name + " " + c[name] + " -> " + value + " (" + why + ")"
            );
            c[name] = value;
        }
    }

    // Body text must read on every light background SALT uses.
    adjust(
        "text",
        fix(c.text, [c.white, c.pale, c.light, c.gray], TEXT_AA),
        "body text needs 4.5:1 on white, pale, light and gray backgrounds"
    );

    // Primary and secondary are used as text on white/pale and as button
    // backgrounds behind white text.
    adjust(
        "primary",
        fix(c.primary, [c.white, c.pale, c.light], TEXT_AA),
        "primary is used for headings, links and buttons with white text"
    );
    var secondaryPale = mix(c.secondary, c.white, 0.92);
    adjust(
        "secondary",
        fix(c.secondary, [c.white, c.pale, secondaryPale], TEXT_AA),
        "secondary is used for labels, active tabs and buttons with white text"
    );

    var t = {};
    t["primary"] = c.primary;
    t["primary-dark"] = mix(c.primary, "#000000", 0.3);
    t["primary-darker"] = mix(c.primary, "#000000", 0.55);
    // Lightest blend of primary toward light that keeps white text readable (banner gradients).
    t["primary-bright"] = lightestPassing(c.primary, c.light, [c.white], TEXT_AA);
    t["primary-rgb"] = rgbList(c.primary);

    t["secondary"] = c.secondary;
    t["secondary-dark"] = mix(c.secondary, "#000000", 0.2);
    t["secondary-darker"] = mix(c.secondary, "#000000", 0.45);
    t["secondary-light"] = mix(c.secondary, c.white, 0.55);
    t["secondary-tint"] = mix(c.secondary, c.white, 0.8);
    t["secondary-pale"] = mix(c.secondary, c.white, 0.92);
    t["secondary-paler"] = mix(c.secondary, c.white, 0.96);
    t["secondary-rgb"] = rgbList(c.secondary);

    t["light"] = c.light;
    t["pale"] = c.pale;
    t["surface-soft"] = mix(c.pale, c.white, 0.5);

    t["gray"] = c.gray;
    t["gray-light"] = mix(c.gray, c.white, 0.5);
    t["gray-mid"] = mix(c.gray, c.text, 0.3);
    // Meaningful borders and icons (inputs, checkboxes, arrows) need 3:1; it is
    // also used for small hint text, so it is held to 4.5:1.
    t["gray-strong"] = fix(c.gray, [c.white, t["surface-soft"], c.pale], TEXT_AA, c.text);

    t["white"] = c.white;
    t["text"] = c.text;
    // Lightest muted text that still passes on every pale background.
    t["text-muted"] = lightestPassing(
        c.text,
        c.white,
        [c.white, c.pale, t["surface-soft"], t["secondary-pale"], t["gray-light"]],
        TEXT_AA + 0.3
    );
    t["text-rgb"] = rgbList(c.text);

    // Report every pairing SALT relies on.
    var checks = [
        ["text on white", t.text, t.white, TEXT_AA],
        ["text on pale", t.text, t.pale, TEXT_AA],
        ["text on light", t.text, t.light, TEXT_AA],
        ["text on gray", t.text, t.gray, TEXT_AA],
        ["muted text on white", t["text-muted"], t.white, TEXT_AA],
        ["muted text on pale", t["text-muted"], t.pale, TEXT_AA],
        ["primary on white / white on primary", t.primary, t.white, TEXT_AA],
        ["primary on pale", t.primary, t.pale, TEXT_AA],
        ["primary on light", t.primary, t.light, TEXT_AA],
        ["white on primary-bright (banner)", t.white, t["primary-bright"], TEXT_AA],
        ["white on primary-dark", t.white, t["primary-dark"], TEXT_AA],
        ["secondary on white / white on secondary", t.secondary, t.white, TEXT_AA],
        ["secondary on pale", t.secondary, t.pale, TEXT_AA],
        ["secondary on secondary-pale", t.secondary, t["secondary-pale"], TEXT_AA],
        ["white on secondary-dark", t.white, t["secondary-dark"], TEXT_AA],
        ["gray-strong on white (controls)", t["gray-strong"], t.white, TEXT_AA],
        ["focus ring: primary on white", t.primary, t.white, UI_AA],
        ["focus ring: primary-dark on pale", t["primary-dark"], t.pale, UI_AA]
    ].map(function (row) {
        var ratio = contrast(row[1], row[2]);
        return {
            pair: row[0],
            fg: row[1],
            bg: row[2],
            ratio: Math.round(ratio * 100) / 100,
            pass: ratio >= row[3]
        };
    });

    return { key: key, name: program.name || key, tokens: t, notes: notes, checks: checks };
}

/* ---------- CSS output ---------- */

function block(selector, result, inputs) {
    var lines = [];
    lines.push(selector + " {");
    lines.push("    /* " + result.name + ": the seven program colors */");
    INPUTS.forEach(function (name) {
        var given = hex(parse(inputs[name]));
        var used = result.tokens[name];
        lines.push(
            "    --salt-" +
                name +
                ": " +
                used +
                ";" +
                (given !== used ? " /* asked for " + given + "; adjusted for contrast */" : "")
        );
    });
    lines.push("    /* Worked out from the seven colors above */");
    Object.keys(result.tokens).forEach(function (name) {
        if (INPUTS.indexOf(name) !== -1) return;
        lines.push("    --salt-" + name + ": " + result.tokens[name] + ";");
    });
    lines.push("}");
    return lines.join("\n");
}

/* ---------- optional style choices ----------
 * A program can add "style": { "tabs": "folder", "cards": "outlined" } to its
 * entry in program-colors.json. Each choice adds the rules below for that
 * program only. "P" stands for the program's page, wherever its class is.
 */
var STYLES = {
    tabs: {
        // Unselected tabs are filled with the pale color and the selected tab is
        // white, joined to its panel. White and pale are too close to tell
        // apart (about 1.2:1), so the selected tab also gets a primary-color bar
        // and bold text: the selection never depends on fill color alone.
        folder: [
            "P .salt-tab-buttons {",
            "    gap: 4px !important;",
            "    border-bottom: 1px solid var(--salt-light) !important;",
            "}",
            "P .salt-tab-button {",
            "    margin-bottom: -1px !important;",
            "    border: 1px solid var(--salt-light) !important;",
            "    border-radius: 8px 8px 0 0 !important;",
            "    background: var(--salt-pale) !important;",
            "    color: var(--salt-text) !important;",
            "    box-shadow: inset 0 3px 0 transparent !important;",
            "}",
            "P .salt-tab-button:hover {",
            "    background: var(--salt-white) !important;",
            "    color: var(--salt-primary) !important;",
            "}",
            'P .salt-tab-button.active,',
            'P .salt-tab-button[aria-selected="true"] {',
            "    border-color: var(--salt-light) !important;",
            "    border-bottom-color: var(--salt-white) !important;",
            "    background: var(--salt-white) !important;",
            "    color: var(--salt-primary) !important;",
            "    font-weight: 800 !important;",
            "    box-shadow: inset 0 4px 0 var(--salt-primary) !important;",
            "}",
            "P .salt-tab-content {",
            "    border-color: var(--salt-light) !important;",
            "}",
            'P .salt-vtabs .salt-vtab:not([aria-selected="true"]) {',
            "    border-color: var(--salt-light) !important;",
            "    background: var(--salt-pale) !important;",
            "    color: var(--salt-text) !important;",
            "    box-shadow: none !important;",
            "}",
            'P .salt-vtabs .salt-vtab:not([aria-selected="true"]):hover {',
            "    background: var(--salt-white) !important;",
            "    color: var(--salt-primary) !important;",
            "}"
        ]
    },
    cards: {
        // White cards with a primary-color outline.
        outlined: [
            "P :is(.salt-objective, .salt-fact, .salt-comparison-card, .salt-image-card, .salt-scenario) {",
            "    border: 1px solid var(--salt-primary) !important;",
            "    background: var(--salt-white) !important;",
            "}",
            "P .salt-checklist {",
            "    border-color: var(--salt-primary) !important;",
            "}"
        ]
    }
};

function styleRules(key, style) {
    var page = ":is(.salt-page.salt-program-" + key + ", .salt-program-" + key + " .salt-page)";
    var lines = [];
    Object.keys(style || {}).forEach(function (part) {
        var rules = STYLES[part] && STYLES[part][style[part]];
        if (!rules) {
            throw new Error(
                key + ': unknown style "' + part + '": "' + style[part] + '". Choices: ' +
                    Object.keys(STYLES)
                        .map(function (p) {
                            return p + " = " + Object.keys(STYLES[p]).join(" / ");
                        })
                        .join("; ")
            );
        }
        lines.push("/* " + key + ": " + part + " = " + style[part] + " */");
        rules.forEach(function (line) {
            lines.push(line.replace(/^P /, page + " "));
        });
    });
    return lines.join("\n");
}

function render(config, results) {
    var out = [];
    out.push(
        START +
            " — generated by tools/build-program-colors.js from tools/program-colors.json.\n" +
            "   Do not edit by hand: change the JSON file and run the script.\n" +
            "   Use a program's colors by adding its class to the page wrapper:\n" +
            '   <div class="salt-page salt-program-plumbing"> */'
    );
    var def = results.filter(function (r) {
        return r.key === config.default;
    })[0];
    if (!def) throw new Error('"default" must name one of the programs');
    out.push("");
    out.push(
        block(":root", def, config.programs[def.key]).replace(
            "the seven program colors",
            "default colors (pages with no program class)"
        )
    );
    results.forEach(function (r) {
        out.push("");
        out.push(block(".salt-program-" + r.key, r, config.programs[r.key]));
        if (config.programs[r.key].style) {
            out.push("");
            out.push(styleRules(r.key, config.programs[r.key].style));
        }
    });
    out.push("");
    out.push(END);
    return out.join("\n");
}

/* ---------- main ---------- */

var config = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
var results = Object.keys(config.programs).map(function (key) {
    if (!/^[a-z0-9-]+$/.test(key)) throw new Error("Program keys use lowercase letters, numbers and dashes: " + key);
    return build(key, config.programs[key]);
});

var failed = false;
results.forEach(function (r) {
    console.log("\n" + r.name + "  (class: salt-program-" + r.key + ")");
    r.notes.forEach(function (n) {
        console.log(n.indexOf("NOTE: ") === 0 ? "  " + n : "  ADJUSTED  " + n);
    });
    r.checks.forEach(function (c) {
        if (!c.pass) failed = true;
        console.log(
            "  " + (c.pass ? "pass" : "FAIL") + "  " + String(c.ratio.toFixed(2)).padStart(5) + ":1  " + c.pair + "  (" + c.fg + " / " + c.bg + ")"
        );
    });
});

if (process.argv.indexOf("--check") === -1) {
    var css = fs.readFileSync(CSS, "utf8");
    var a = css.indexOf(START),
        b = css.indexOf(END);
    if (a === -1 || b === -1) throw new Error("salt.css is missing the PROGRAM COLORS markers");
    css = css.slice(0, a) + render(config, results) + css.slice(b + END.length);
    fs.writeFileSync(CSS, css);
    console.log("\nUpdated salt.css");
}

process.exit(failed ? 1 : 0);
