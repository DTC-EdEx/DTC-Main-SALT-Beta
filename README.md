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
| `examples/salt-component-showcase.html` | The approved component showcase page, ready to paste into the Canvas HTML editor | A component is added or changed |

The file names keep `4.0` so the Canvas theme never has to change.

## Canvas theme files (Admin → Themes → Upload)

Browser CSS file:

```css
@import url(https://designplus.ciditools.com/css/content.css);
@import url(https://designplus.ciditools.com/css/editor.css);
@import url("https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.EdEx.4.0.css?v=4.2");
```

Browser JavaScript file:

```js
(function () {
  var s = document.createElement("script");
  s.src = "https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.EdEx.4.0.js?v=4.2";
  document.head.appendChild(s);
})();
```

Mobile app CSS file:

```css
@import url(https://designplus.ciditools.com/css/mobile.css);
@import url("https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.Mobile.4.0.css?v=4.2");
```

Mobile app JavaScript file:

```js
(function () {
  var s = document.createElement("script");
  s.src = "https://durtschidtclsa.github.io/DTC-Main-SALT/Salt.Mobile.4.0.js?v=4.2";
  document.head.appendChild(s);
})();
```

### About `?v=`

The version number is only a cache-buster. Browsers and the app may keep an old copy of a file for a while; changing the number (for example `?v=4.2` to `?v=4.3`) makes them download a fresh copy right away. The JavaScript passes the same number on to `salt.js`. Without a change, updates still arrive on their own within about 10 minutes.

## Authoring rules

- Canvas removes `<button>`, `<input>`, and most scripts from page HTML. Author components with the `<div>` and `<span>` patterns in the showcase page; `salt.js` turns them into real, keyboard-accessible controls when the page loads.
- Every interactive control works with Tab, Enter, and Space. Test new pages with a keyboard and on a phone.
- Optional settings use `data-` attributes, which Canvas keeps:
  - `data-caption-lines="6"` on `.salt-image-card-grid`: caption lines shown before "Read more".
  - `data-question` and `data-choices-label` on `.salt-id-game`: the question shown for scenario games.
  - `data-salt-expand-all` on `.salt-reveal-group`: adds Open all / Close all.
  - `data-salt-filter="Filter components"` on `.salt-table-container`: adds a filter box.
  - `data-title` on `.salt-checklist`: the checklist heading.
