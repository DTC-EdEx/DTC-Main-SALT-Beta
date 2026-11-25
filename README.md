# SALT Learning Framework — Davis Tech

SALT is the set of reusable Canvas page components (cards, tabs, reveals, games, checklists, and more) used by the Educational Excellence team. The code is hosted on GitHub Pages and loaded by the Canvas theme, so a change merged into `main` reaches every Canvas page within about 10 minutes.

## Files

| File | What it holds | Edit it when… |
| --- | --- | --- |
| `salt.css` | All SALT component styles, shared by the browser and the mobile app | You change how a component looks |
| `salt.js` | All SALT component behavior, shared by the browser and the mobile app | You change how a component works |
| `Salt.EdEx.4.0.css` | Browser-only styles: DesignPlus colors, Canvas module colors, page navigation buttons. Loads `salt.css`. | Something should look different only in a web browser |
| `Salt.Mobile.4.0.css` | Mobile-app-only styles. Loads `salt.css`. | Something should look different only in the Canvas app |
| `Salt.EdEx.4.0.js` | Loads DesignPlus, ReadSpeaker, and Davis Tools, then `salt.js` | You change those browser add-ons |
| `Salt.Mobile.4.0.js` | Marks the page as the mobile app, then loads `salt.js` | Rarely |
| `tools/program-colors.json`, `tools/build-program-colors.js` | Each program's seven colors, and the script that turns them into CSS | A program's colors change |
| `examples/salt-component-showcase.html` | The approved component showcase page, ready to paste into the Canvas HTML editor | A component is added or changed |
| `examples/student-lounge/` | The Electrical Student Lounge home page and its pages (Advising and Support, Peer Mentorship, Faculty Contact Info, Course Completion Instructions), ready to paste | You set up a Student Lounge |
| `examples/home-page-plumbing.html` | A course home page (title bar, banner, quick links, welcome, module explorer), ready to paste into a course's Front Page | You start a new course home page |

The file names keep `4.0` so the Canvas theme never has to change.

## Canvas theme files (Admin → Themes → Upload)

Browser CSS file:

```css
@import url(https://designplus.ciditools.com/css/content.css);
@import url(https://designplus.ciditools.com/css/editor.css);
@import url("https://dtc-edex.github.io/DTC-Main-SALT/Salt.EdEx.4.0.css?v=4.2");
```

Browser JavaScript file:

```js
(function () {
  var s = document.createElement("script");
  s.src = "https://dtc-edex.github.io/DTC-Main-SALT/Salt.EdEx.4.0.js?v=4.2";
  document.head.appendChild(s);
})();
```

Mobile app CSS file:

```css
@import url(https://designplus.ciditools.com/css/mobile.css);
@import url("https://dtc-edex.github.io/DTC-Main-SALT/Salt.Mobile.4.0.css?v=4.2");
```

Mobile app JavaScript file:

```js
(function () {
  var s = document.createElement("script");
  s.src = "https://dtc-edex.github.io/DTC-Main-SALT/Salt.Mobile.4.0.js?v=4.2";
  document.head.appendChild(s);
})();
```

### About `?v=`

You do not need to change the version number. It is only a cache-buster: GitHub tells browsers to keep each file for 10 minutes, so every update reaches Canvas on its own within about 10 minutes. Changing the number (for example `?v=4.2` to `?v=4.3`) only matters if you need a change to show up sooner, and even then it refreshes `Salt.EdEx.4.0.css` and the JavaScript right away but not `salt.css`, which still follows the 10-minute rule. To see a change sooner on your own computer, do a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac). The Canvas mobile app can hold on to files longer; closing and reopening the app usually fixes that.

## Program colors

Each program has one **primary** color and six supporting colors. Every color in `salt.css` comes from these, so changing a program's look means changing only seven hex codes.

| Color | What it is used for | Plumbing | HVACR | Electrical |
| --- | --- | --- | --- | --- |
| `primary` | Banner, headings, table headers, buttons, focus outlines | `#144992` | `#144931` | `#484959` |
| `secondary` | Section labels, active tab and menu item, flip cards, accents | `#b32839` | `#3a3e41` (charcoal) | `#0062b8` (BYU Royal) |
| `light` | Light accent borders and highlights | `#c3d3e8` | `#c3d8ca` | `#bcc2ce` |
| `pale` | Tinted panels and backgrounds | `#eaf1fb` | `#eaf3ed` | `#e3e6ed` |
| `gray` | Card borders and dividers | `#dddddd` | `#e8e8e8` | `#bcc2ce` |
| `white` | Page and card background, text on dark colors | `#ffffff` | `#ffffff` | `#ffffff` |
| `text` | Body text | `#262626` | `#262626` | `#262626` |

Hover shades, darker and paler versions, and muted text are worked out from those seven automatically.

**Use a program's colors on a page** by adding its class to the page wrapper:

```html
<div class="salt-page salt-program-plumbing">
```

Programs so far: `salt-program-plumbing`, `salt-program-hvac`, `salt-program-electrical`. A program can skip the secondary color; its accents then use the primary color. `examples/salt-component-showcase-hvac.html` and `examples/salt-component-showcase-electrical.html` are the showcase page in those programs' colors.

**Optional style choices.** A program can also pick a look for some components by adding `"style"` to its entry in `tools/program-colors.json`:

- `"tabs": "folder"`: unselected tabs are filled with the pale color, and the selected tab is white and joins its panel. The selected tab also gets a primary-color bar and bold text, because white and pale alone are too close to tell apart.
- `"cards": "outlined"`: objective, fact, comparison, image and knowledge-check cards are white with a primary-color outline.

Electrical uses both: `"style": { "tabs": "folder", "cards": "outlined" }`.

A page with no program class uses the default colors (currently Plumbing). Answer feedback (correct green, incorrect red) stays the same in every program.

**Add or change a program:**

1. Add or edit the program in `tools/program-colors.json`.
2. Run `node tools/build-program-colors.js`. It rewrites the program colors block near the top of `salt.css` and prints a contrast report.
3. Bump `?v=` in the Canvas theme files if you need the change right away.

Accessibility is checked automatically against WCAG 2.2 AA (4.5:1 for text). If a requested color would be hard to read (for example white text on yellow), the script darkens it just enough to pass, uses that version, and notes it in the report and in `salt.css`.

## Authoring rules

- Canvas removes `<button>`, `<input>`, and most scripts from page HTML. Author components with the `<div>` and `<span>` patterns in the showcase page; `salt.js` turns them into real, keyboard-accessible controls when the page loads.
- Every interactive control works with Tab, Enter, and Space. Test new pages with a keyboard and on a phone.
- Optional settings use `data-` attributes, which Canvas keeps:
  - `data-caption-lines="6"` on `.salt-image-card-grid`: caption lines shown before "Read more".
  - `data-question` and `data-choices-label` on `.salt-id-game`: the question shown for scenario games.
  - `data-salt-expand-all` on `.salt-reveal-group`: adds Open all / Close all.
  - `data-salt-filter="Filter components"` on `.salt-table-container`: adds a filter box.
  - `data-title` on `.salt-checklist`: the checklist heading.

## Course home pages

`examples/home-page-plumbing.html` replaces the DesignPLUS home page. Paste it into the HTML editor of the course's Front Page, then change four things (they're listed at the top of the file): the program class, the course code and name, the banner image, and the description and objectives.

What happens on its own when the page loads (nothing to set up per course):

- **Welcome message.** `data-salt-welcome="Welcome {name} to TEPL 1120!"` swaps `{name}` for the student's short name, taken from Canvas itself (no API call). If the name isn't available, such as in the mobile app, the heading reads "Welcome to TEPL 1120!".
- **Module explorer.** `.salt-module-explorer` reads the course's modules through the Canvas API as the signed-in user, so students only see published modules and items, plus their own progress: a green check for finished requirements, an empty circle for unfinished ones, and a lock for locked modules or items. Module buttons are on the left; the selected module's items are on the right. On phones the buttons become a row you swipe sideways. It opens on the first module the student hasn't finished, and remembers the last module picked during the visit. New, renamed, or reordered modules show up without editing the page.
- **Links to this course.** A link with `data-salt-course-path="modules"` always opens this course's Modules page, even after a course copy.
- **Fallback.** If the API can't be reached (for example in some versions of the Canvas mobile app), the text inside the explorer stays: a link to Modules.

The Course Description and Course Objectives use `<details>`, which opens and closes without JavaScript, so they work everywhere, including the mobile app.

### Student Lounge pages

`examples/student-lounge/student-lounge-electrical.html` is the Student Lounge home page. It uses the same title bar, banner, quick links, and welcome card as a course home page, plus folder-style resource **tabs** (a sideways-swipe row on phones): each `.salt-home-tab-panel` becomes one tab, labeled by its `.salt-home-tab-title`, and holds `.salt-home-button` links, which stack full width so a tab can hold any number. Without JavaScript, every panel simply shows in order.

- `data-salt-welcome` can use `{fullname}` (from the Canvas API) or `{name}` (the short name).
- Back to top links (`.salt-home-top a`, `.salt-back-top a`, or any link with `data-salt-top`) scroll smoothly back to the top of the page and move keyboard focus there.
- Canvas's "external site" arrow is hidden on the quick links and resource buttons; its screen-reader text stays.

The other Student Lounge pages are regular SALT pages (`.salt-page`) and introduce these reusable components:

| Component | Markup | Notes |
| --- | --- | --- |
| Contact cards | `.salt-contact-grid` > `.salt-contact-card` with `.salt-contact-role`, `.salt-contact-name`, `.salt-contact-line` (`data-icon="phone"` or `"calendar"`; email is the default icon) | Raised, layered look that lifts on hover. A card with no `<img>` shows the person's initials. Every email link (`mailto:`) gets a copy button to its right that copies the address and shows "Copied!"; nothing to add in the HTML. Add `salt-contact-grid-wide` for side-by-side photo cards. |
| Steps | `<ol class="salt-steps">`, each `<li>` starting with a `<strong>` title | Numbered step cards |
| Alert callout | `.salt-callout.salt-callout-alert` | A callout in the secondary color for important notes |
| Embedded form | `.salt-embed` > `.salt-embed-label` + `<iframe>` | A framed form or guide with a label |
| Button link | `<a class="salt-button-link">` | A single call-to-action button |
