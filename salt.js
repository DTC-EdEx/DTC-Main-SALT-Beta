/* =========================================================
   SALT LEARNING FRAMEWORK
   CANVAS-SAFE INTERACTION SCRIPT
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       FRAMEWORK STATE
       ===================================================== */

    window.SALTFrameworkState = window.SALTFrameworkState || {};

    window.SALTFrameworkState.initialized = false;

    window.SALTFrameworkState.controlsRebuilt = false;

    window.SALTFrameworkState.eventsBound = false;

    window.SALTFrameworkState.lightboxEventsBound = false;

    /* =====================================================
       UTILITY FUNCTIONS
       ===================================================== */

    function createElement(tag, className, text) {
        var element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = text;
        }

        return element;
    }

    function getDirectTextNodes(element) {
        var results = [];

        Array.prototype.slice.call(element.childNodes).forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent.replace(/\s+/g, " ").trim();

                if (text) {
                    results.push({
                        node: node,
                        text: text
                    });
                }
            }
        });

        return results;
    }

    /*
     * Canvas sometimes removes <button> elements
     * but leaves their text behind.
     *
     * This function attempts to recover a list of
     * choices from that remaining text.
     *
     * It works particularly well when choices are
     * written as separate phrases beginning with
     * capital letters.
     */
    function recoverTextChoices(text) {
        if (!text) {
            return [];
        }

        text = text.replace(/\s+/g, " ").trim();

        /*
         * First try common Canvas-safe separators.
         */
        var choices = text
            .split(/\s*(?:\||•|·)\s*/)
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);

        if (choices.length > 1) {
            return choices;
        }

        /*
         * Fall back to detecting new phrases that
         * begin with a capitalized word.
         *
         * Example:
         *
         * Start installing the pipe
         * Verify required protection and safe access
         * Enter quickly and finish the work
         */
        choices = text
            .split(/\s+(?=[A-Z][a-z])/)
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);

        return choices;
    }
    /* =========================================================
   SALT SCROLL REVEAL
   ========================================================= */

    /* =====================================================
       PROGRESS BAR
       ===================================================== */

    function setupProgressBar() {
        var progress = document.getElementById("salt-progress");

        if (!progress) {
            return;
        }

        var fill = progress.querySelector(".salt-progress-fill");

        if (!fill) {
            fill = createElement("div", "salt-progress-fill");

            progress.appendChild(fill);
        }

        function updateProgress() {
            var page = document.querySelector(".salt-page");

            if (!page) {
                return;
            }

            var rect = page.getBoundingClientRect();

            var pageHeight = page.scrollHeight - window.innerHeight;

            if (pageHeight <= 0) {
                fill.style.width = "0%";

                return;
            }

            var distance = Math.max(0, -rect.top);

            var percent = Math.min(100, Math.max(0, (distance / pageHeight) * 100));

            fill.style.width = percent + "%";
        }

        window.addEventListener("scroll", updateProgress, {
            passive: true
        });

        window.addEventListener("resize", updateProgress);

        updateProgress();
    }

    /* =====================================================
       CANVAS-SAFE REVEALS
       ===================================================== */

    function rebuildRevealControls() {
        document.querySelectorAll(".salt-reveal").forEach(function (reveal) {
            var content = reveal.querySelector(".salt-reveal-content");

            if (!content) {
                return;
            }

            var button = reveal.querySelector(".salt-reveal-button");

            /*
             * If the HTML contains a div-based reveal control,
             * convert it into a real button.
             */
            if (button && button.tagName !== "BUTTON") {
                var newButton = document.createElement("button");

                newButton.type = "button";

                newButton.className = button.className;

                newButton.innerHTML = button.innerHTML;

                button.replaceWith(newButton);

                button = newButton;
            }

            /*
             * If Canvas removed the original control,
             * rebuild it from the remaining text.
             */
            if (!button) {
                var directText = getDirectTextNodes(reveal);

                var labelParts = [];

                directText.forEach(function (item) {
                    if (item.text !== "+" && item.text !== "−" && item.text !== "-") {
                        labelParts.push(item.text);
                    }
                });

                var label = labelParts.join(" ").replace(/\s+/g, " ").trim();

                if (!label) {
                    return;
                }

                directText.forEach(function (item) {
                    reveal.removeChild(item.node);
                });

                var oldIcon = reveal.querySelector(".salt-reveal-icon");

                if (oldIcon) {
                    oldIcon.remove();
                }

                button = document.createElement("button");

                button.type = "button";
                button.className = "salt-reveal-button";

                var labelSpan = createElement("span", "salt-reveal-title", label);

                var icon = createElement("span", "salt-reveal-icon", "+");

                icon.setAttribute("aria-hidden", "true");

                button.appendChild(labelSpan);
                button.appendChild(icon);

                reveal.insertBefore(button, content);
            }

            configureReveal(reveal, button, content);
        });
    }

    function configureReveal(reveal, button, content) {
        /*
         * Make every reveal control a real button.
         */
        button.type = "button";

        button.removeAttribute("role");
        button.removeAttribute("tabindex");

        button.setAttribute("aria-expanded", "false");

        reveal.classList.remove("open");

        content.hidden = true;

        content.style.height = "0px";

        var icon = button.querySelector(".salt-reveal-icon");

        if (icon) {
            icon.textContent = "▶";
            button.insertBefore(icon, button.firstChild);
            icon.setAttribute("aria-hidden", "true");
        }
    }

    function toggleReveal(reveal) {
        var button = reveal.querySelector(".salt-reveal-button");
        var content = reveal.querySelector(".salt-reveal-content");
        if (!button || !content) return;

        var opening = !reveal.classList.contains("open");
        var currentHeight = content.hidden ? 0 : content.getBoundingClientRect().height;

        // Continue smoothly if clicked during an animation.
        if (content._saltAnimation) {
            content._saltAnimation.cancel();
            content._saltAnimation = null;
        }

        var inner = content.querySelector(":scope > .salt-reveal-inner");

        if (!inner) {
            inner = document.createElement("div");
            inner.className = "salt-reveal-inner";

            while (content.firstChild) {
                inner.appendChild(content.firstChild);
            }

            content.appendChild(inner);
        }

        content.hidden = false;
        reveal.classList.toggle("open", opening);
        button.setAttribute("aria-expanded", String(opening));

        var icon = button.querySelector(".salt-reveal-icon");
        if (icon) icon.textContent = "▶";

        if (!opening && content.contains(document.activeElement)) {
            button.focus({ preventScroll: true });
        }

        var targetHeight = opening ? inner.getBoundingClientRect().height : 0;

        content.style.height = targetHeight + "px";

        function finish() {
            content.hidden = !opening;
            content.style.height = opening ? "auto" : "0px";
            content._saltAnimation = null;
        }

        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduced || typeof content.animate !== "function") {
            finish();
            return;
        }

        var animation = content.animate(
            [{ height: currentHeight + "px" }, { height: targetHeight + "px" }],
            {
                duration: 500,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)"
            }
        );

        content._saltAnimation = animation;
        animation.onfinish = finish;
    }

    /* =====================================================
       CANVAS-SAFE FLASHCARDS
       ===================================================== */

    function rebuildFlashcardControls() {
        document.querySelectorAll(".salt-flashcard").forEach(function (card) {
            /*
             * If the control survived Canvas,
             * configure it normally.
             */
            var existingToggle = card.querySelector(".salt-flashcard-toggle");

            if (existingToggle) {
                configureFlashcard(card, existingToggle);

                return;
            }

            /*
             * Canvas removed the button and left
             * "Reveal Answer" as plain text.
             */
            var directText = getDirectTextNodes(card);

            var label = "";

            directText.forEach(function (item) {
                if (/reveal|answer|show/i.test(item.text)) {
                    if (!label) {
                        label = item.text;
                    }

                    card.removeChild(item.node);
                }
            });

            /*
             * If there was no recognizable text,
             * still create a usable control.
             */
            if (!label) {
                label = "Reveal Answer";
            }

            var toggle = createElement("button", "salt-flashcard-toggle", label);

            toggle.type = "button";

            card.appendChild(toggle);

            configureFlashcard(card, toggle);
        });
    }

    function configureFlashcard(card, toggle) {
        // Always a real button so Enter and Space flip the card exactly once.
        if (toggle.tagName !== "BUTTON") {
            var button = createElement("button", toggle.className, toggle.textContent.trim());
            toggle.replaceWith(button);
            toggle = button;
        }

        toggle.type = "button";
        toggle.removeAttribute("role");
        toggle.removeAttribute("tabindex");

        toggle.setAttribute("aria-pressed", card.classList.contains("flipped") ? "true" : "false");
    }

    function toggleFlashcard(card) {
        var flipped = card.classList.toggle("flipped");

        var toggle = card.querySelector(".salt-flashcard-toggle");

        if (!toggle) {
            return;
        }

        toggle.setAttribute("aria-pressed", flipped ? "true" : "false");

        toggle.textContent = flipped ? "Hide Answer" : "Reveal Answer";
    }

    /* =====================================================
       EXISTING SALT FLIP CARDS
       ===================================================== */

    function setupFlipCards() {
        document.querySelectorAll(".salt-flip").forEach(function (card) {
            card.setAttribute("tabindex", "0");

            card.setAttribute("role", "button");

            card.setAttribute(
                "aria-pressed",
                card.classList.contains("flipped") ? "true" : "false"
            );

            /*
             * Prevent duplicate keyboard
             * listeners if SALT initializes
             * more than once.
             */
            if (card.dataset.saltKeyboardReady === "true") {
                return;
            }

            card.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();

                toggleFlip(card);
            });

            card.dataset.saltKeyboardReady = "true";
        });
    }

    function toggleFlip(card) {
        var flipped = card.classList.toggle("flipped");

        card.setAttribute("aria-pressed", flipped ? "true" : "false");
    }

    function setupTermReveals() {
        document
            .querySelectorAll(".salt-term-reveal:not([data-salt-ready])")
            .forEach(function (placeholder, index) {
                const answer = placeholder.dataset.answer;
                if (!answer) return;

                const button = document.createElement("button");
                button.type = "button";
                button.className = "salt-blank";
                button.setAttribute("aria-expanded", "false");
                // No aria-label: it would hide the revealed answer from screen readers.

                const blank = document.createElement("span");
                blank.className = "salt-blank-text";
                blank.textContent = "＋ Reveal term";

                const answerSpan = document.createElement("span");
                answerSpan.className = "salt-blank-answer";
                answerSpan.textContent = answer;
                answerSpan.hidden = true;

                button.appendChild(blank);
                button.appendChild(answerSpan);

                button.addEventListener("click", function () {
                    const revealed = button.getAttribute("aria-expanded") === "true";

                    button.setAttribute("aria-expanded", String(!revealed));

                    blank.hidden = !revealed;
                    answerSpan.hidden = revealed;
                    if (!revealed && window.SALTAnnounce) window.SALTAnnounce("Term: " + answer);
                });

                placeholder.dataset.saltReady = "true";
                placeholder.replaceWith(button);
            });
    }

    /* =====================================================
       CANVAS-SAFE TABS
       ===================================================== */

    function setupTabs() {
        document.querySelectorAll(".salt-tabs").forEach(function (tabs) {
            var container = tabs.querySelector(".salt-tab-buttons");

            var panels = Array.prototype.slice.call(tabs.querySelectorAll(".salt-tab-content"));

            if (!container || !panels.length) {
                return;
            }

            /*
             * If buttons survived Canvas, keep them.
             */
            var existingButtons = container.querySelectorAll(".salt-tab-button");

            if (existingButtons.length === panels.length) {
                configureExistingTabs(tabs, existingButtons, panels);

                return;
            }

            /*
             * Canvas removed the buttons and left
             * their text as one text node.
             *
             * Rather than trying to recover those
             * labels, use each panel's <h3> as the
             * authoritative tab label.
             */
            container.innerHTML = "";

            panels.forEach(function (panel, index) {
                var heading = panel.querySelector("h3");

                var label = heading ? heading.textContent.trim() : "Tab " + (index + 1);

                var panelId = panel.id || "salt-tab-panel-" + (index + 1);

                panel.id = panelId;

                var button = createElement("div", "salt-tab-button", label);

                button.setAttribute("role", "tab");

                button.setAttribute("tabindex", index === 0 ? "0" : "-1");

                button.setAttribute("aria-controls", panelId);

                button.setAttribute("aria-selected", index === 0 ? "true" : "false");

                container.appendChild(button);
            });

            configureExistingTabs(tabs, container.querySelectorAll(".salt-tab-button"), panels);
        });
    }

    function configureExistingTabs(tabs, buttons, panels) {
        var activeIndex = 0;

        buttons.forEach(function (button, index) {
            button.setAttribute("role", "tab");

            button.setAttribute("tabindex", index === 0 ? "0" : "-1");

            if (button.getAttribute("aria-selected") === "true") {
                activeIndex = index;
            }
        });

        activateTab(tabs, activeIndex);
    }

    function activateTab(tabs, index) {
        var buttons = tabs.querySelectorAll(".salt-tab-button");

        var panels = tabs.querySelectorAll(".salt-tab-content");

        if (index < 0 || index >= buttons.length) {
            return;
        }

        buttons.forEach(function (button, buttonIndex) {
            var active = buttonIndex === index;

            button.classList.toggle("active", active);

            button.setAttribute("aria-selected", active ? "true" : "false");

            button.setAttribute("tabindex", active ? "0" : "-1");
        });

        panels.forEach(function (panel, panelIndex) {
            var active = panelIndex === index;

            panel.classList.toggle("active", active);

            panel.hidden = !active;
        });
    }

    /* =====================================================
       DIALOGS
       ===================================================== */

    function setupDialogs() {
        document.querySelectorAll(".salt-dialog").forEach(function (dialog) {
            dialog.setAttribute("role", "dialog");

            dialog.setAttribute("aria-modal", "true");

            /*
             * Every dialog MUST begin closed.
             * This is intentionally unconditional so
             * Canvas/DesignPLUS cannot leave a dialog open.
             */
            dialog.hidden = true;
            dialog.classList.remove("open");
            dialog.setAttribute("aria-hidden", "true");

            var close = dialog.querySelector(".salt-dialog-close");

            var panel = dialog.querySelector(".salt-dialog-panel");

            /*
             * Canvas may strip the original close control
             * and leave only the × text. Remove that text
             * and replace it with a real control.
             */
            if (panel && !close) {
                var directText = getDirectTextNodes(panel);

                directText.forEach(function (item) {
                    if (item.text.trim() === "×") {
                        panel.removeChild(item.node);
                    }
                });

                close = document.createElement("button");

                close.type = "button";
                close.className = "salt-dialog-close";
                close.setAttribute("aria-label", "Close dialog");
                close.textContent = "×";

                panel.insertBefore(close, panel.firstChild);
            }

            /*
             * If a close control already exists, make sure
             * it is a real keyboard-accessible button.
             */
            if (close) {
                if (close.tagName.toLowerCase() === "button") {
                    close.type = "button";
                } else {
                    close.setAttribute("role", "button");
                    close.setAttribute("tabindex", "0");
                }
                close.setAttribute("aria-label", "Close dialog");
            }
        });

        rebuildDialogTriggers();
    }

    function rebuildDialogTriggers() {
        document.querySelectorAll(".salt-dialog").forEach(function (dialog) {
            if (!dialog.id) {
                return;
            }

            var targetSelector = "#" + dialog.id;

            /*
             * If a trigger already exists,
             * do not create another one.
             */
            var existing = document.querySelector(
                '[data-salt-dialog-target="' + targetSelector + '"]'
            );

            if (existing) {
                return;
            }

            /*
             * Look for the trigger container
             * immediately before the dialog.
             */
            var container = dialog.previousElementSibling;

            if (container && container.classList.contains("salt-dialog-trigger-container")) {
                var label = container.textContent.replace(/\s+/g, " ").trim();

                if (!label) {
                    return;
                }

                /*
                 * Remove the placeholder text.
                 */
                container.innerHTML = "";

                /*
                 * Create the actual dialog button.
                 */
                var trigger = createElement("button", "salt-dialog-trigger", label);

                trigger.type = "button";

                trigger.setAttribute("data-salt-dialog-target", targetSelector);

                container.appendChild(trigger);

                return;
            }

            /*
             * Fallback for older SALT HTML where
             * the trigger is plain text immediately
             * before the dialog.
             */
            var previous = dialog.previousSibling;

            while (
                previous &&
                previous.nodeType === Node.TEXT_NODE &&
                !previous.textContent.trim()
            ) {
                previous = previous.previousSibling;
            }

            if (!previous || previous.nodeType !== Node.TEXT_NODE) {
                return;
            }

            var label = previous.textContent.replace(/\s+/g, " ").trim();

            if (!label) {
                return;
            }

            previous.parentNode.removeChild(previous);

            var trigger = createElement("button", "salt-dialog-trigger", label);

            trigger.type = "button";

            trigger.setAttribute("data-salt-dialog-target", targetSelector);

            dialog.parentNode.insertBefore(trigger, dialog);
        });
    }

    function openSaltDialog(dialog, trigger) {
        if (!dialog) {
            return;
        }

        /*
         * Remember the trigger so focus can be
         * returned when the dialog closes.
         */
        dialog._saltTrigger = trigger || null;

        /*
         * Remember the current page scroll position.
         */
        dialog._saltScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

        /*
         * Move the dialog directly into <body>.
         *
         * This is important in Canvas because an ancestor
         * element can interfere with position: fixed.
         */
        if (dialog.parentNode !== document.body) {
            document.body.appendChild(dialog);
        }

        /*
         * Show the dialog.
         */
        dialog.hidden = false;

        dialog.classList.add("open");

        dialog.setAttribute("aria-hidden", "false");

        /*
         * Lock the page in its current position.
         *
         * This prevents the page from jumping upward
         * when the dialog opens.
         */
        document.body.style.position = "fixed";

        document.body.style.top = "-" + dialog._saltScrollY + "px";

        document.body.style.left = "0";

        document.body.style.right = "0";

        document.body.style.width = "100%";

        /*
         * Prevent the scrollbar from disappearing
         * and causing the page to shift sideways.
         */
        var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = scrollbarWidth + "px";
        }

        document.body.classList.add("salt-dialog-open");

        /*
         * Move focus to the close button.
         */
        var close = dialog.querySelector(".salt-dialog-close");

        if (close) {
            window.requestAnimationFrame(function () {
                close.focus({
                    preventScroll: true
                });
            });
        }
    }

    function closeSaltDialog(dialog) {
        if (!dialog) {
            return;
        }

        /*
         * Remember the original scroll position
         * before restoring the page.
         */
        var scrollY = dialog._saltScrollY || 0;

        /*
         * Hide the dialog.
         */
        dialog.hidden = true;

        dialog.classList.remove("open");

        dialog.setAttribute("aria-hidden", "true");

        /*
         * Remove the page lock.
         */
        if (!document.querySelector(".salt-dialog.open")) {
            document.body.classList.remove("salt-dialog-open");

            /*
             * Clear the temporary body styles.
             */
            document.body.style.position = "";

            document.body.style.top = "";

            document.body.style.left = "";

            document.body.style.right = "";

            document.body.style.width = "";

            document.body.style.paddingRight = "";

            /*
             * Restore the exact page position.
             */
            window.scrollTo(0, scrollY);
        }

        /*
         * Return focus to the button that
         * opened the dialog.
         */
        if (dialog._saltTrigger && typeof dialog._saltTrigger.focus === "function") {
            window.requestAnimationFrame(function () {
                dialog._saltTrigger.focus({
                    preventScroll: true
                });
            });
        }
    }

    /* =====================================================
       SCENARIOS / KNOWLEDGE CHECKS
       ===================================================== */

    function setupScenarios() {
        document.querySelectorAll(".salt-scenario").forEach(function (scenario) {
            var container = scenario.querySelector(".salt-choice-buttons");

            if (!container) {
                return;
            }

            /*
             * If proper choices survived, configure them.
             */
            var existing = container.querySelectorAll("button, .salt-choice");

            if (existing.length) {
                existing.forEach(function (choice, index) {
                    configureScenarioChoice(choice, index);
                });
            } else {
                /*
                 * Canvas stripped the choice controls.
                 * Recover the remaining text.
                 */
                var rawText = container.textContent.replace(/\s+/g, " ").trim();

                var choices = recoverTextChoices(rawText);

                container.innerHTML = "";

                choices.forEach(function (text, index) {
                    var choice = createElement("div", "salt-choice", text);
                    container.appendChild(choice);
                    configureScenarioChoice(choice, index);
                });
            }

            /*
             * Hide ALL feedback when the page first loads.
             */
            var correctFeedback = scenario.querySelector(".salt-feedback-correct");

            var incorrectFeedback = scenario.querySelector(".salt-feedback-incorrect");

            if (correctFeedback) {
                correctFeedback.hidden = true;

                correctFeedback.classList.remove("salt-feedback-visible");
            }

            if (incorrectFeedback) {
                incorrectFeedback.hidden = true;

                incorrectFeedback.classList.remove("salt-feedback-visible");
            }
        });
    }

    /*
     * Canvas saves choices as <div>s. Replace each with a real <button>:
     * Enter and Space then activate it exactly once. (Canvas also turns
     * Enter on role="button" into a click, which opened and immediately
     * closed div-based choices.)
     */
    function configureScenarioChoice(choice, index) {
        var button = choice;

        if (choice.tagName !== "BUTTON") {
            button = document.createElement("button");
            button.className = choice.className || "salt-choice";
            Object.keys(choice.dataset).forEach(function (key) {
                button.dataset[key] = choice.dataset[key];
            });
            while (choice.firstChild) {
                button.appendChild(choice.firstChild);
            }
            choice.replaceWith(button);
        }

        button.type = "button";
        button.classList.add("salt-choice");
        button.removeAttribute("role");
        button.removeAttribute("tabindex");

        if (!button.hasAttribute("aria-pressed")) {
            button.setAttribute("aria-pressed", "false");
        }

        if (!button.dataset.answer) {
            button.dataset.answer = String(index + 1);
        }

        return button;
    }

    function handleScenarioChoice(choice) {
        var scenario = choice.closest(".salt-scenario");

        if (!scenario) {
            return;
        }

        /* Selecting the same answer again resets the question. */
        if (choice.getAttribute("aria-pressed") === "true") {
            scenario
                .querySelectorAll(".salt-choice-buttons button, .salt-choice-buttons .salt-choice")
                .forEach(function (item) {
                    item.classList.remove("selected", "correct", "incorrect");
                    item.setAttribute("aria-pressed", "false");
                });

            scenario.querySelectorAll(".salt-choice-inline-feedback").forEach(function (feedback) {
                feedback.remove();
            });

            scenario
                .querySelectorAll(".salt-feedback-correct, .salt-feedback-incorrect")
                .forEach(function (feedback) {
                    feedback.hidden = true;
                    feedback.classList.remove("salt-feedback-visible");
                });

            scenario.classList.remove("answered", "answered-correct", "answered-incorrect");

            return;
        }

        scenario.querySelectorAll(".salt-choice-inline-feedback").forEach(function (el) {
            el.remove();
        });
        var buttons = scenario.querySelectorAll(
            ".salt-choice-buttons button, .salt-choice-buttons .salt-choice"
        );

        /*
         * Reset all choices.
         */
        buttons.forEach(function (item) {
            item.classList.remove("selected", "correct", "incorrect");

            item.setAttribute("aria-pressed", "false");
        });

        /*
         * Reset both feedback boxes.
         */
        var correctFeedback = scenario.querySelector(".salt-feedback-correct");

        var incorrectFeedback = scenario.querySelector(".salt-feedback-incorrect");

        if (correctFeedback) {
            correctFeedback.hidden = true;

            correctFeedback.classList.remove("salt-feedback-visible");
        }

        if (incorrectFeedback) {
            incorrectFeedback.hidden = true;

            incorrectFeedback.classList.remove("salt-feedback-visible");
        }

        /*
         * Mark the selected choice.
         */
        choice.classList.add("selected");

        choice.setAttribute("aria-pressed", "true");

        /*
         * Determine the selected and correct answers.
         */
        var correctAnswer = (scenario.dataset.correctAnswer || "").trim().toLowerCase();

        var selectedAnswer = (choice.dataset.answer || "").trim().toLowerCase();

        /*
         * Show ONLY the appropriate feedback.
         */
        if (correctAnswer && selectedAnswer === correctAnswer) {
            choice.classList.add("correct");

            scenario.classList.add("answered-correct");

            scenario.classList.remove("answered-incorrect");

            if (correctFeedback) {
                correctFeedback.hidden = false;

                correctFeedback.classList.add("salt-feedback-visible");
            }
        } else {
            choice.classList.add("incorrect");

            scenario.classList.add("answered-incorrect");

            scenario.classList.remove("answered-correct");

            if (incorrectFeedback) {
                incorrectFeedback.hidden = false;

                incorrectFeedback.classList.add("salt-feedback-visible");
            }
        }

        var activeFeedback = selectedAnswer === correctAnswer ? correctFeedback : incorrectFeedback;
        if (activeFeedback) {
            var inline = document.createElement("span");
            inline.className = "salt-choice-inline-feedback";
            inline.textContent = activeFeedback.textContent.trim();
            choice.appendChild(inline);
            if (window.SALTAnnounce) window.SALTAnnounce(inline.textContent);
            activeFeedback.hidden = true;
            activeFeedback.classList.remove("salt-feedback-visible");
        }
        scenario.classList.add("answered");
    }

    /* =====================================================
       IMAGE LIGHTBOX
       ===================================================== */

    function createLightbox() {
        var overlay = document.getElementById("salt-lightbox-overlay");

        if (overlay) {
            return overlay;
        }

        overlay = createElement("div", "salt-lightbox-overlay");

        overlay.id = "salt-lightbox-overlay";

        overlay.setAttribute("aria-hidden", "true");

        var close = createElement("button", "salt-lightbox-close", "×");

        close.type = "button";

        close.setAttribute("aria-label", "X");

        var image = createElement("img", "salt-lightbox-large");

        image.alt = "";

        var caption = createElement("div", "salt-lightbox-caption");

        overlay.appendChild(close);

        overlay.appendChild(image);

        overlay.appendChild(caption);

        document.body.appendChild(overlay);

        close.addEventListener("click", function () {
            closeLightbox();
        });

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closeLightbox();
            }
        });

        return overlay;
    }

    function openLightbox(sourceImage) {
        var overlay = createLightbox();
        var large = overlay.querySelector(".salt-lightbox-large");
        var caption = overlay.querySelector(".salt-lightbox-caption");
        var close = overlay.querySelector(".salt-lightbox-close");

        overlay._saltReturnFocus = sourceImage;

        large.src = sourceImage.currentSrc || sourceImage.src;
        large.alt = sourceImage.alt || "";

        if (caption) {
            caption.textContent = sourceImage.dataset.caption || "";
        }

        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Enlarged image");
        overlay.setAttribute("aria-hidden", "false");
        overlay.classList.add("open");

        document.body.classList.add("salt-lightbox-open");

        close.setAttribute("aria-label", "Close enlarged image");
        close.focus({ preventScroll: true });
    }

    function closeLightbox() {
        var overlay = document.getElementById("salt-lightbox-overlay");

        if (!overlay || !overlay.classList.contains("open")) return;

        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        overlay.removeAttribute("aria-modal");

        document.body.classList.remove("salt-lightbox-open");

        var original = overlay._saltReturnFocus;

        if (original && original.isConnected) {
            original.focus({ preventScroll: true });
        }

        overlay._saltReturnFocus = null;
    }

    function setupImageLightbox() {
        if (window.SALTFrameworkState.lightboxEventsBound) return;

        function prepareImages() {
            document.querySelectorAll(".salt-page img.salt-lightbox").forEach(function (image) {
                // Cards and the image game have their own controls.
                if (image.closest(".salt-image-card, .salt-id-game, button, a")) return;

                image.tabIndex = 0;
                image.setAttribute("role", "button");
                image.setAttribute("aria-haspopup", "dialog");
                image.setAttribute(
                    "aria-label",
                    "Enlarge image" + (image.alt ? ": " + image.alt : "")
                );
            });
        }

        document.addEventListener(
            "click",
            function (event) {
                if (!(event.target instanceof Element)) return;

                var image = event.target.closest("img.salt-lightbox");
                if (!image) return;

                event.preventDefault();
                openLightbox(image);
            },
            true
        );

        document.addEventListener("keydown", function (event) {
            var overlay = document.getElementById("salt-lightbox-overlay");

            if (overlay && overlay.classList.contains("open")) {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeLightbox();
                    return;
                }

                // Keep keyboard focus on the available Close control.
                if (event.key === "Tab") {
                    event.preventDefault();

                    overlay.querySelector(".salt-lightbox-close").focus();

                    return;
                }

                // Holding Enter should not immediately close the image.
                if (event.repeat && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                }

                // Enter on the focused Close button works naturally.
                return;
            }

            if (!(event.target instanceof Element)) return;

            var image = event.target.closest("img.salt-lightbox[role='button']");

            if (!image) return;

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                if (!event.repeat) {
                    image.click();
                }
            }
        });

        prepareImages();

        // Prepare images that Canvas inserts after initial loading.
        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return record.addedNodes.length > 0;
                })
            ) {
                prepareImages();
            }
        }).observe(document.body, {
            childList: true,
            subtree: true
        });

        window.SALTFrameworkState.lightboxEventsBound = true;
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    function setupNavigation() {
        var page = document.querySelector(".salt-page");
        if (!page || page._saltNavigationReady) return;

        var items = Array.from(page.querySelectorAll(".salt-sidebar nav a[href^='#']"))
            .map(function (link) {
                var id = link.getAttribute("href").slice(1);

                var section = Array.from(page.querySelectorAll(".salt-section[id]")).find(
                    function (section) {
                        return section.id === id;
                    }
                );

                return section ? { link: link, section: section } : null;
            })
            .filter(Boolean);

        if (!items.length) return;
        page._saltNavigationReady = true;

        var clickedItem = null;
        var scheduled = false;

        function highlight(activeItem) {
            items.forEach(function (item) {
                var active = item === activeItem;

                item.link.classList.toggle("salt-active", active);

                if (active) {
                    item.link.setAttribute("aria-current", "location");
                } else {
                    item.link.removeAttribute("aria-current");
                }
            });
        }

        function update() {
            scheduled = false;

            // Keep the clicked link selected during anchor scrolling.
            if (clickedItem) return;

            var activeItem = items[0];

            items.forEach(function (item) {
                var margin = parseFloat(getComputedStyle(item.section).scrollMarginTop);

                var activationLine = (Number.isFinite(margin) ? margin : 90) + 4;

                if (item.section.getBoundingClientRect().top <= activationLine) {
                    activeItem = item;
                }
            });

            highlight(activeItem);
        }

        function scheduleUpdate() {
            if (scheduled) return;

            scheduled = true;
            requestAnimationFrame(update);
        }

        items.forEach(function (item) {
            item.link.addEventListener("click", function (event) {
                if (
                    event.defaultPrevented ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                )
                    return;

                clickedItem = item;
                highlight(item);

                // Let the browser follow the anchor normally.
            });
        });

        function resumeScrollTracking() {
            clickedItem = null;
            scheduleUpdate();
        }

        // Resume automatic highlighting when the user scrolls.
        window.addEventListener("wheel", resumeScrollTracking, {
            passive: true
        });

        window.addEventListener("touchmove", resumeScrollTracking, {
            passive: true
        });

        document.addEventListener("keydown", function (event) {
            if (
                event.target.closest(
                    "input, textarea, select, button, " +
                        "[role='button'], [contenteditable='true']"
                )
            )
                return;

            if (
                ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
                    event.key
                )
            ) {
                resumeScrollTracking();
            }
        });

        // Also supports dragging the browser scrollbar.
        document.addEventListener("pointerdown", function (event) {
            if (!event.target.closest(".salt-sidebar")) {
                resumeScrollTracking();
            }
        });

        window.addEventListener("scroll", scheduleUpdate, {
            passive: true
        });

        window.addEventListener("resize", resumeScrollTracking);

        update();
    }

    /* =========================================================
   COLLAPSIBLE COURSE NAVIGATION
   ========================================================= */

    /* =====================================================
   COLLAPSIBLE COURSE NAVIGATION
   CANVAS-SAFE RECONSTRUCTION
   ===================================================== */

    function setupDesktopNavigation() {
        var navigation = document.querySelector(".salt-mobile-navigation");

        if (!navigation) {
            return;
        }

        if (window.innerWidth >= 901) {
            navigation.open = true;
        }
    }

    /* =====================================================
       KEYBOARD ACCESSIBILITY
       ===================================================== */

    function setupKeyboardEvents() {
        document.addEventListener("keydown", function (event) {
            var target = event.target;

            /*
             * DIALOG CLOSE
             */
            var close = target.closest(".salt-dialog-close");

            if (close && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();

                var dialog = close.closest(".salt-dialog");

                closeSaltDialog(dialog);

                return;
            }

            /*
             * TABS
             */
            var tab = target.closest(".salt-tab-button");

            if (tab && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();

                var tabSet = tab.closest(".salt-tabs");

                var tabButtons = tabSet.querySelectorAll(".salt-tab-button");

                var tabIndex = Array.prototype.indexOf.call(tabButtons, tab);

                activateTab(tabSet, tabIndex);

                return;
            }

            /*
             * TAB ARROW NAVIGATION
             */
            if (tab && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
                event.preventDefault();

                var parent = tab.closest(".salt-tabs");

                var tabList = Array.prototype.slice.call(
                    parent.querySelectorAll(".salt-tab-button")
                );

                var current = tabList.indexOf(tab);

                var next;

                if (event.key === "ArrowRight") {
                    next = (current + 1) % tabList.length;
                } else {
                    next = (current - 1 + tabList.length) % tabList.length;
                }

                activateTab(parent, next);

                tabList[next].focus();
            }
        });
    }

    /* =====================================================
       CLICK EVENTS
       ===================================================== */

    function setupClickEvents() {
        if (window.SALTFrameworkState.eventsBound) {
            return;
        }

        document.addEventListener("click", function (event) {
            /* -----------------------------
                   REVEALS
                   ----------------------------- */

            var revealButton = event.target.closest(".salt-reveal-button");

            if (revealButton) {
                var reveal = revealButton.closest(".salt-reveal");

                if (reveal) {
                    event.preventDefault();

                    toggleReveal(reveal);

                    return;
                }
            }

            /* -----------------------------
                   FLIP CARDS
                   ----------------------------- */

            var flip = event.target.closest(".salt-flip");

            if (flip && !event.target.closest("a, button, input, select, textarea")) {
                event.preventDefault();

                toggleFlip(flip);

                return;
            }

            /* -----------------------------
                   FLASHCARDS
                   ----------------------------- */

            var flashcardToggle = event.target.closest(".salt-flashcard-toggle");

            if (flashcardToggle) {
                event.preventDefault();

                var flashcard = flashcardToggle.closest(".salt-flashcard");

                toggleFlashcard(flashcard);

                return;
            }

            /* -----------------------------
                   TABS
                   ----------------------------- */

            var tab = event.target.closest(".salt-tab-button");

            if (tab) {
                event.preventDefault();

                var tabs = tab.closest(".salt-tabs");

                var buttons = Array.prototype.slice.call(tabs.querySelectorAll(".salt-tab-button"));

                var index = buttons.indexOf(tab);

                activateTab(tabs, index);

                return;
            }

            /* -----------------------------
                   SCENARIOS
                   ----------------------------- */

            var choice = event.target.closest(
                ".salt-choice-buttons button, .salt-choice-buttons .salt-choice"
            );

            if (choice) {
                event.preventDefault();

                handleScenarioChoice(choice);

                return;
            }

            /* -----------------------------
                   DIALOG TRIGGER
                   ----------------------------- */

            var trigger = event.target.closest("[data-salt-dialog-target]");

            if (trigger) {
                event.preventDefault();

                var selector = trigger.getAttribute("data-salt-dialog-target");

                if (!selector) {
                    return;
                }

                var dialog = document.querySelector(selector);

                if (dialog) {
                    openSaltDialog(dialog, trigger);
                }

                return;
            }

            /* -----------------------------
                   DIALOG CLOSE
                   ----------------------------- */

            var close = event.target.closest(".salt-dialog-close");

            if (close) {
                event.preventDefault();

                var dialog = close.closest(".salt-dialog");

                closeSaltDialog(dialog);

                return;
            }

            /* -----------------------------
                   DIALOG BACKDROP
                   ----------------------------- */

            var dialogBackground = event.target;

            if (dialogBackground.classList && dialogBackground.classList.contains("salt-dialog")) {
                closeSaltDialog(dialogBackground);

                return;
            }
        });

        /*
         * Escape closes dialogs.
         */
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            document.querySelectorAll(".salt-dialog").forEach(function (dialog) {
                if (!dialog.hidden) {
                    closeSaltDialog(dialog);
                }
            });
        });

        window.SALTFrameworkState.eventsBound = true;
    }

    /* =====================================================
       CANVAS-SAFE CONTROL RECONSTRUCTION
       ===================================================== */

    function rebuildCanvasControls() {
        /*
         * Run these in this order.
         *
         * Some controls depend on elements created
         * by earlier reconstruction steps.
         */

        setupTabs();

        rebuildRevealControls();

        rebuildFlashcardControls();

        setupScenarios();

        setupDialogs();

        setupFlipCards();

        setupTermReveals();

        window.SALTFrameworkState.controlsRebuilt = true;
    }

    /* =========================================================
   SALT SCROLL REVEAL
   ========================================================= */

    function setupSALTScrollReveal() {
        var page = document.querySelector(".salt-page");

        if (!page) {
            return;
        }

        var sections = document.querySelectorAll(".salt-section");

        var sidebar = document.querySelector(".salt-sidebar");

        var navigationLinks = document.querySelectorAll(".salt-sidebar-nav > a");

        /*
         * Respect reduced-motion preferences.
         */
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            page.classList.add("salt-initialized");

            return;
        }

        /* =====================================================
       INITIAL PAGE FADE
       ===================================================== */

        page.classList.add("salt-initializing");

        requestAnimationFrame(function () {
            page.classList.remove("salt-initializing");

            page.classList.add("salt-initialized");
        });

        /* =====================================================
       SIDEBAR FADE
       ===================================================== */

        if (sidebar) {
            sidebar.classList.add("salt-navigation-initializing");

            window.setTimeout(
                function () {
                    sidebar.classList.remove("salt-navigation-initializing");

                    sidebar.classList.add("salt-navigation-initialized");

                    /*
                     * Bring navigation links in
                     * one at a time.
                     */
                    navigationLinks.forEach(function (link, index) {
                        window.setTimeout(
                            function () {
                                link.classList.add("salt-nav-item-visible");
                            },

                            20 + index * 35
                        );
                    });
                },

                80
            );
        }

        /* =====================================================
       SECTION SETUP
       ===================================================== */

        sections.forEach(function (section, index) {
            /*
             * The first section is already visible.
             */
            if (index === 0) {
                section.classList.add("salt-scroll-visible");

                return;
            }

            /*
             * All remaining sections wait
             * for the learner to scroll to them.
             */
            section.classList.add("salt-scroll-hidden");
        });

        /* =====================================================
       INTERSECTION OBSERVER
       ===================================================== */

        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.remove("salt-scroll-hidden");

                        entry.target.classList.add("salt-scroll-visible");

                        /*
                         * Only animate each section
                         * the first time it enters view.
                         */
                        observer.unobserve(entry.target);
                    });
                },

                {
                    /*
                     * Start the animation slightly
                     * before the section reaches the
                     * center of the screen.
                     */
                    rootMargin: "0px 0px 180px 0px",

                    threshold: 0
                }
            );

            sections.forEach(function (section, index) {
                if (index === 0) {
                    return;
                }

                observer.observe(section);
            });
        } else {
            /*
             * Older browsers simply show
             * everything normally.
             */
            sections.forEach(function (section) {
                section.classList.remove("salt-scroll-hidden");

                section.classList.add("salt-scroll-visible");
            });
        }
    }

    /* =====================================================
       PROGRAM COLORS
       A page picks its program with a class on the wrapper,
       e.g. <div class="salt-page salt-program-plumbing">.
       Dialogs, the lightbox and the progress bar live outside
       the wrapper, so the class is copied to <html> too.
       ===================================================== */

    function applyProgramColors(page) {
        var holder = page.closest('[class*="salt-program-"]');
        var match = holder && holder.className.match(/(?:^|\s)(salt-program-[a-z0-9-]+)/);
        var root = document.documentElement;

        Array.prototype.slice.call(root.classList).forEach(function (name) {
            if (name.indexOf("salt-program-") === 0 && (!match || name !== match[1])) {
                root.classList.remove(name);
            }
        });

        if (match) root.classList.add(match[1]);
    }

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function initializeSALT() {
        var page = document.querySelector(".salt-page");

        if (!page) {
            return false;
        }

        applyProgramColors(page);

        var firstSection = page.querySelector(".salt-section");
        if (firstSection) firstSection.classList.add("salt-entry-first");

        if (!window.SALT_MOBILE_APP) setupSALTScrollReveal();
        /*
         * Core framework
         */
        if (!window.SALT_MOBILE_APP) setupProgressBar();

        setupNavigation();

        setupDesktopNavigation();

        /*
         * Canvas-safe controls
         */
        rebuildCanvasControls();

        /*
         * Event delegation
         */
        setupClickEvents();

        setupKeyboardEvents();

        setupImageLightbox();

        window.SALTFrameworkState.initialized = true;

        return true;
    }

    /* =====================================================
   START SALT
   ===================================================== */

    function startSALT() {
        var attempts = 0;

        function attempt() {
            attempts++;

            if (initializeSALT()) {
                return;
            }

            if (attempts < 20) {
                setTimeout(attempt, 500);
            }
        }

        attempt();

        /*
         * Canvas and DesignPLUS can modify the DOM
         * after the initial page load.
         *
         * Only watch for the SALT page itself.
         * Do NOT continuously inspect or rebuild
         * individual controls.
         */
        if (window.MutationObserver) {
            var observer = new MutationObserver(function () {
                if (
                    document.querySelector(".salt-page") &&
                    !window.SALTFrameworkState.initialized
                ) {
                    initializeSALT();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /* =====================================================
       DOCUMENT READY
       ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startSALT);
    } else {
        startSALT();
    }
})();

(function () {
    "use strict";
    if (window.SALTSidebarToggle) return;
    var sequence = 0;

    function initialize() {
        document.querySelectorAll(".salt-page .salt-layout").forEach(function (layout) {
            var sidebar = Array.from(layout.children).find(function (child) {
                return child.classList.contains("salt-sidebar");
            });
            if (!sidebar || layout._saltSidebarControl) return;
            if (!sidebar.id) {
                do {
                    sequence += 1;
                } while (document.getElementById("salt-sidebar-panel-" + sequence));
                sidebar.id = "salt-sidebar-panel-" + sequence;
            }

            var toolbar = document.createElement("div");
            toolbar.className = "salt-sidebar-toolbar";
            var button = document.createElement("button");
            button.type = "button";
            button.className = "salt-sidebar-visibility-toggle";
            button.setAttribute("aria-controls", sidebar.id);
            var icon = document.createElement("span");
            icon.className = "salt-sidebar-menu-icon";
            icon.setAttribute("aria-hidden", "true");
            for (var i = 0; i < 3; i += 1) icon.appendChild(document.createElement("span"));
            var label = document.createElement("span");
            button.appendChild(icon);
            button.appendChild(label);
            toolbar.appendChild(button);
            layout.before(toolbar);
            layout._saltSidebarControl = button;

            function setHidden(hidden) {
                // Return focus before hiding if an external caller hid the panel.
                if (hidden && sidebar.contains(document.activeElement)) button.focus();
                layout.classList.toggle("salt-sidebar-is-hidden", hidden);
                sidebar.hidden = hidden;
                button.setAttribute("aria-expanded", String(!hidden));
                label.textContent = hidden ? "Show sidebar" : "Hide sidebar";
                button.setAttribute(
                    "aria-label",
                    hidden
                        ? "Show page navigation and resources"
                        : "Hide page navigation and resources"
                );
            }
            setHidden(layout.classList.contains("salt-sidebar-is-hidden"));
            button.addEventListener("click", function () {
                setHidden(!layout.classList.contains("salt-sidebar-is-hidden"));
            });
        });
    }

    window.SALTSidebarToggle = { initialize: initialize };
    function start() {
        initialize();
        var observer = new MutationObserver(function (records) {
            var relevant = records.some(function (record) {
                return Array.from(record.addedNodes).some(function (node) {
                    return (
                        node.nodeType === 1 &&
                        (node.matches(".salt-page, .salt-layout, .salt-sidebar") ||
                            node.querySelector(".salt-layout, .salt-sidebar"))
                    );
                });
            });
            if (relevant) initialize();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* SALT inline paragraph reveals — Canvas-safe authoring */
(function () {
    "use strict";

    if (window.SALTInlineRevealsLoaded) return;
    window.SALTInlineRevealsLoaded = true;

    var selector = ".salt-inline-practice .salt-inline-reveal";

    function widen(button) {
        if (button.dataset.saltWidened) return;
        var width = button.getBoundingClientRect().width;
        if (width > 0) {
            button.style.minWidth = width * 1.7 + "px";
            button.dataset.saltWidened = "true";
        }
    }
    function prepareControls() {
        document.querySelectorAll(selector).forEach(function (source) {
            if (source.tagName === "BUTTON") {
                widen(source);
                return;
            }

            var answer = source.getAttribute("data-answer");
            if (!answer || !answer.trim()) return;

            var button = document.createElement("button");

            button.type = "button";
            button.className = source.className;
            button.setAttribute("data-answer", answer);
            button.setAttribute("aria-pressed", "false");
            button.textContent = "Click to Reveal";

            source.replaceWith(button);
            widen(button);
        });
    }

    document.addEventListener("click", function (event) {
        if (!(event.target instanceof Element)) return;

        var control = event.target.closest(selector);
        if (!control || control.tagName !== "BUTTON") return;

        var answer = control.getAttribute("data-answer");
        if (!answer || !answer.trim()) return;

        event.preventDefault();

        var revealed = control.getAttribute("aria-pressed") !== "true";

        control.setAttribute("aria-pressed", String(revealed));
        control.textContent = revealed ? answer : "Click to Reveal";
    });

    function start() {
        prepareControls();

        // Also prepare content Canvas inserts after initial page load.
        var observer = new MutationObserver(function (records) {
            var contentAdded = records.some(function (record) {
                return record.addedNodes.length > 0;
            });

            if (contentAdded) prepareControls();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }
})();

/* IMAGE / SCENARIO GAME (.salt-id-game) */
(function () {
    "use strict";
    if (window.SALTImagePractice) return;
    function shuffled(values) {
        var copy = values.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = copy[i];
            copy[i] = copy[j];
            copy[j] = temp;
        }
        return copy;
    }
    function createRound(items) {
        var order = shuffled(items),
            index = 0,
            correct = 0,
            answered = 0,
            missed = [],
            locked = false,
            attempted = false;
        return {
            current: function () {
                return order[index];
            },
            snapshot: function () {
                return {
                    index: index,
                    total: order.length,
                    correct: correct,
                    answered: answered,
                    locked: locked,
                    missed: missed.slice()
                };
            },
            answer: function (term) {
                if (locked || index >= order.length) return null;
                var item = order[index];
                if ([item.term].concat(item.distractors).indexOf(term) === -1) return null;
                var right = term === item.term;
                if (!attempted) {
                    answered++;
                    if (right) correct++;
                    else missed.push(item);
                    attempted = true;
                }
                locked = right;
                return right;
            },
            next: function () {
                if (!locked) return false;
                index++;
                locked = false;
                attempted = false;
                return true;
            }
        };
    }
    function node(tag, cls, text) {
        var el = document.createElement(tag);
        el.className = cls || "";
        if (text !== undefined) el.textContent = text;
        return el;
    }
    function button(text, cls) {
        var el = node("button", cls, text);
        el.type = "button";
        return el;
    }
    function initialize() {
        document.querySelectorAll(".salt-id-game").forEach(function (host) {
            if (host.dataset.saltIdReady) return;
            var source = host.querySelector(".salt-id-source");
            if (!source) return;
            var entries = Array.from(source.children).filter(function (el) {
                return el.classList.contains("salt-id-item");
            });
            var items = entries.map(function (el) {
                var term = (el.dataset.term || "").trim();
                var distractors = [
                    (el.dataset.wrongOne || "").trim(),
                    (el.dataset.wrongTwo || "").trim()
                ];
                var visual = el.querySelector(".salt-id-visual");
                var explanation = el.querySelector(".salt-id-explanation");
                return {
                    term: term,
                    distractors: distractors,
                    visual: visual,
                    explanation: explanation ? explanation.textContent.trim() : ""
                };
            });
            if (
                items.length < 5 ||
                items.length > 40 ||
                items.some(function (item) {
                    return (
                        !item.term ||
                        !item.visual ||
                        !item.explanation ||
                        item.distractors.some(function (v) {
                            return !v;
                        }) ||
                        new Set(
                            [item.term].concat(item.distractors).map(function (v) {
                                return v.toLowerCase();
                            })
                        ).size !== 3
                    );
                })
            ) {
                if (!host.querySelector(".salt-id-error"))
                    host.prepend(
                        node(
                            "p",
                            "salt-id-error",
                            "Activity setup needs attention: include 5–40 items, each with a visual, explanation, correct term, and two distinct incorrect terms."
                        )
                    );
                return;
            }
            host.dataset.saltIdReady = "true";
            var panel = node("div", "salt-id-panel");
            var top = node("div", "salt-id-top");
            var progress = node("p", "salt-id-progress");
            var score = node("div", "salt-id-score");
            var scoreValue = node("strong", "", "0 answered");
            score.append(node("span", "", "First-attempt score"), scoreValue);
            top.append(progress, score);
            var questionText = (host.dataset.question || "Which item is pictured?").trim();
            var heading = node("h3", "salt-id-question", questionText);
            heading.tabIndex = -1;
            // Scenario text stays outside the image button so screen readers can read it.
            var scenarioBox = node("div", "salt-id-scenario-box");
            scenarioBox.hidden = true;
            var visualArea = button("", "salt-id-picture");
            visualArea.setAttribute("aria-label", "Enlarge current image");
            var enlarge = button("Enlarge image", "salt-id-enlarge");
            var choices = node("div", "salt-id-choices");
            choices.setAttribute("role", "group");
            choices.setAttribute(
                "aria-label",
                host.dataset.choicesLabel || "Choose the name of the pictured item"
            );
            var feedback = node("div", "salt-id-feedback");
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-atomic", "true");
            var actions = node("div", "salt-id-actions");
            var next = button("Next item", "salt-id-next");
            next.disabled = true;
            var again = button("Play again", "salt-id-again");
            var review = button("Practice missed items", "salt-id-review");
            var restart = button("Start Over", "salt-id-next salt-id-restart");
            actions.append(restart, next, review, again);
            restart.addEventListener("click", function () {
                start(items, "full", true);
            });
            panel.append(
                top,
                heading,
                scenarioBox,
                visualArea,
                enlarge,
                choices,
                feedback,
                actions
            );
            var dialog = node("dialog", "salt-id-dialog");
            dialog.setAttribute("aria-label", "Enlarged practice image");
            var close = button("Close", "salt-id-close");
            var largeVisual = node("div", "salt-id-large");
            dialog.append(close, largeVisual);
            host.append(panel, dialog);
            source.hidden = true;
            var round, mode;
            function showGameImage(item) {
                var visual = item.visual.cloneNode(true);

                var scenarioText = visual.querySelectorAll(".salt-id-scenario");
                scenarioBox.replaceChildren();
                scenarioText.forEach(function (text) {
                    scenarioBox.appendChild(text);
                });
                scenarioBox.hidden = !scenarioText.length;
                visualArea.classList.toggle("salt-id-has-scenario", scenarioText.length > 0);

                visual.querySelectorAll(".salt-lightbox").forEach(function (img) {
                    img.classList.remove("salt-lightbox");
                });

                visualArea.classList.add("is-loading");
                visualArea.classList.remove("has-image-error");
                visualArea.disabled = true;
                visualArea.hidden = false;
                visualArea.setAttribute("aria-busy", "true");
                visualArea.setAttribute("aria-label", "Loading practice image");

                // Keep answer controls in place, but unavailable during loading.
                choices.inert = true;
                visualArea.replaceChildren(visual);

                var img = visual.querySelector("img");

                function isCurrent() {
                    return visualArea.contains(visual);
                }

                function ready() {
                    if (!isCurrent()) return;

                    visualArea.classList.remove("is-loading");
                    visualArea.disabled = false;
                    visualArea.removeAttribute("aria-busy");
                    visualArea.setAttribute("aria-label", "Enlarge current image");
                    choices.inert = false;
                }

                function failed() {
                    if (!isCurrent()) return;

                    visualArea.classList.remove("is-loading");
                    visualArea.classList.add("has-image-error");
                    visualArea.disabled = false;
                    visualArea.removeAttribute("aria-busy");
                    visualArea.setAttribute("aria-label", "Image unavailable. Retry loading");

                    var message = node("span", "salt-id-stage-message");
                    message.append(
                        node("strong", "", "Image unavailable"),
                        node("span", "", "Select here to try loading it again.")
                    );

                    visualArea.replaceChildren(message);
                }

                function loaded() {
                    if (!img.naturalWidth) {
                        failed();
                        return;
                    }

                    // Decode before fading the image into view.
                    if (typeof img.decode === "function") {
                        img.decode()
                            .catch(function () {})
                            .then(ready);
                    } else {
                        ready();
                    }
                }

                if (!img) {
                    ready();
                    return;
                }

                img.loading = "eager";
                img.addEventListener("load", loaded, { once: true });
                img.addEventListener("error", failed, { once: true });

                if (img.complete) loaded();
            }
            function updateScore() {
                var s = round.snapshot();
                scoreValue.textContent = s.answered
                    ? s.correct + " of " + s.answered + " correct"
                    : "0 answered";
            }
            function showItem(focus) {
                var s = round.snapshot(),
                    item = round.current();
                progress.textContent =
                    (mode === "review" ? "Missed-item practice · " : "") +
                    "Item " +
                    (s.index + 1) +
                    " of " +
                    s.total;
                heading.textContent = questionText;
                showGameImage(item);
                enlarge.hidden = false;
                visualArea.hidden = false;
                choices.hidden = false;
                choices.replaceChildren();
                feedback.replaceChildren();
                next.hidden = false;
                next.disabled = true;
                next.textContent = s.index === s.total - 1 ? "See results" : "Next item";
                again.hidden = true;
                review.hidden = true;
                shuffled([item.term].concat(item.distractors)).forEach(function (term) {
                    var choice = button(term, "salt-id-choice");

                    choice.addEventListener("click", function () {
                        if (choice.getAttribute("aria-disabled") === "true") return;
                        var result = round.answer(term);
                        if (result === null) return;

                        if (choice.classList.contains("salt-id-incorrect")) return;
                        feedback.className = "salt-id-feedback salt-id-announcement";
                        if (result) {
                            choice.classList.add("salt-id-correct");
                            choice.append(
                                node("span", "salt-id-mark", " ✓ Correct"),
                                node("span", "salt-id-explanation-inline", item.explanation)
                            );
                            choices.querySelectorAll("button").forEach(function (other) {
                                other.setAttribute("aria-disabled", "true");
                            });
                            feedback.textContent = "Correct. " + item.explanation;
                            next.disabled = false;
                        } else {
                            choice.classList.add("salt-id-incorrect");
                            choice.setAttribute("aria-disabled", "true");
                            choice.append(node("span", "salt-id-mark", " ✕ Try again"));
                            feedback.textContent = "Not quite. Try another option.";
                        }
                        updateScore();
                    });

                    choices.append(choice);
                });
                // Reserve feedback space so Next Item does not move.
                choices.style.minHeight = "0px";

                var measure = choices.cloneNode(true);
                measure.setAttribute("aria-hidden", "true");
                measure.setAttribute("inert", "");

                measure.style.cssText =
                    "position:absolute;visibility:hidden;pointer-events:none;" +
                    "height:auto;min-height:0;box-sizing:border-box;" +
                    "width:" +
                    choices.getBoundingClientRect().width +
                    "px;";

                measure.querySelectorAll("button").forEach(function (option) {
                    if (option.textContent === item.term) {
                        option.classList.add("salt-id-correct");

                        option.append(
                            node("span", "salt-id-mark", " ✓ Correct"),
                            node("span", "salt-id-explanation-inline", item.explanation)
                        );
                    } else {
                        // Include the possible incorrect-answer marker in sizing.
                        option.append(node("span", "salt-id-mark", " ✕ Try again"));
                    }
                });

                panel.append(measure);

                choices.style.minHeight = Math.ceil(measure.getBoundingClientRect().height) + "px";

                measure.remove();
                updateScore();
                if (focus) heading.focus();
            }
            function start(values, nextMode, focus) {
                round = createRound(values);
                mode = nextMode;
                showItem(focus);
            }
            next.addEventListener("click", function () {
                if (!round.next()) return;
                var s = round.snapshot();
                if (s.index < s.total) {
                    showItem(true);
                    return;
                }
                heading.textContent = "Round complete";
                scenarioBox.hidden = true;
                progress.textContent =
                    mode === "review" ? "Missed-item practice complete" : "Practice complete";
                choices.hidden = true;
                enlarge.hidden = true;
                next.hidden = true;

                visualArea.hidden = false;
                visualArea.disabled = true;
                visualArea.classList.remove("is-loading", "has-image-error");
                visualArea.removeAttribute("aria-busy");
                visualArea.setAttribute("aria-label", "Round complete");

                var completeMessage = node("span", "salt-id-stage-message");

                completeMessage.append(
                    node("strong", "", "✓ Round Complete"),
                    node("span", "", "Review your results, then practice again.")
                );

                visualArea.replaceChildren(completeMessage);
                feedback.className = "salt-id-feedback";
                feedback.replaceChildren(
                    node(
                        "p",
                        "",
                        "You identified " +
                            s.correct +
                            " of " +
                            s.total +
                            " correctly on your first attempt in this round."
                    )
                );
                review.hidden = !s.missed.length;
                again.hidden = false;
                heading.focus();
            });
            again.addEventListener("click", function () {
                start(items, "full", true);
            });
            review.addEventListener("click", function () {
                start(round.snapshot().missed, "review", true);
            });
            visualArea.addEventListener("click", function () {
                if (visualArea.classList.contains("has-image-error")) {
                    showGameImage(round.current());
                    return;
                }

                if (!visualArea.disabled) enlarge.click();
            });
            enlarge.addEventListener("click", function () {
                largeVisual.replaceChildren(round.current().visual.cloneNode(true));
                largeVisual.querySelectorAll(".salt-lightbox").forEach(function (img) {
                    img.classList.remove("salt-lightbox");
                });
                if (typeof dialog.showModal === "function") {
                    dialog.showModal();
                    close.focus();
                }
            });
            close.addEventListener("click", function () {
                dialog.close();
            });
            dialog.addEventListener("close", function () {
                visualArea.focus({ preventScroll: true });
            });
            start(items, "full", false);
        });
    }
    window.SALTImagePractice = {
        version: "1.0.0",
        initialize: initialize,
        createRound: createRound
    };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (r) {
                    return Array.from(r.addedNodes).some(function (el) {
                        return (
                            el.nodeType === 1 &&
                            (el.matches(".salt-id-game") || el.querySelector(".salt-id-game"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* Tables are informational; row-selection handlers removed. */

/* SALT full image-card lightbox */
(function () {
    "use strict";

    if (window.SALTCardLightboxLoaded) return;
    window.SALTCardLightboxLoaded = true;

    var selector = ".salt-page .salt-image-card";
    var dialog;
    var content;
    var closeButton;
    var returnFocus;

    var fitQueued = false;
    var cardWidths = new WeakMap();
    var cardResize =
        typeof ResizeObserver === "function"
            ? new ResizeObserver(function (entries) {
                  entries.forEach(function (entry) {
                      var width = entry.target.getBoundingClientRect().width;
                      if (Math.abs(width - (cardWidths.get(entry.target) || 0)) > 0.5) {
                          cardWidths.set(entry.target, width);
                          scheduleCardFit();
                      }
                  });
              })
            : null;

    function scheduleCardFit() {
        if (fitQueued) return;
        fitQueued = true;
        requestAnimationFrame(function () {
            fitQueued = false;
            fitCards();
        });
    }

    function fitCards() {
        var groups = new Map();
        document.querySelectorAll(selector).forEach(function (card) {
            if (!card.dataset.saltCardReady || !card.getBoundingClientRect().width) return;
            var parent = card.closest(".salt-image-card-grid") || card.parentElement;
            if (!groups.has(parent)) groups.set(parent, []);
            groups.get(parent).push(card);
        });
        groups.forEach(function (cards, parent) {
            // data-caption-lines on the grid sets how many caption lines show before "Read more".
            var lines = parseInt(parent && parent.dataset ? parent.dataset.captionLines : "", 10);
            if (lines >= 2 && lines <= 20)
                parent.style.setProperty("--salt-card-caption-lines", String(lines));
            // Keep the existing component footprint: header, slim explainer,
            // image area and the original CSS minimum caption area.
            // Measure offscreen in the same styling context, without a text cap.
            var heights = cards.map(function (card) {
                var probe = card.cloneNode(true);
                probe.classList.remove("salt-card-fit-ready");
                probe.removeAttribute("id");
                probe.querySelectorAll("[id]").forEach(function (el) {
                    el.removeAttribute("id");
                });
                probe.setAttribute("aria-hidden", "true");
                probe.inert = true;
                probe.style.cssText =
                    "position:absolute!important;visibility:hidden!important;pointer-events:none!important;left:-100000px!important;top:0!important;width:" +
                    card.getBoundingClientRect().width +
                    "px!important;height:auto!important;min-height:0!important;max-height:none!important;transform:none!important;";
                var caption = probe.querySelector(".salt-image-card-caption");
                if (caption) caption.textContent = "";
                card.parentElement.appendChild(probe);
                var height = Math.ceil(probe.getBoundingClientRect().height);
                probe.remove();
                return height;
            });
            var height = Math.max.apply(Math, heights);
            cards.forEach(function (card) {
                if (!height) return;
                card.style.setProperty("--salt-card-fit-height", height + "px");
                card.classList.add("salt-card-fit-ready");
                var caption = card.querySelector(".salt-image-card-caption");
                if (!caption) return;
                var full = card.dataset.saltFullCaption || "";
                caption.textContent = full;
                if (caption.scrollHeight <= caption.clientHeight + 1) return;
                var more = document.createElement("span");
                more.className = "salt-card-read-more";
                more.textContent = "Read more";
                more.setAttribute("aria-hidden", "true");
                var chars = Array.from(full),
                    low = 0,
                    high = chars.length;
                function show(count) {
                    var excerpt = chars.slice(0, count).join("").replace(/\s+$/, "");
                    // Prefer a complete word when shortening a multiword caption.
                    if (count < chars.length && /\s/.test(full) && /\S/.test(chars[count] || ""))
                        excerpt = excerpt.replace(/\s+\S*$/, "");
                    caption.replaceChildren(document.createTextNode(excerpt + "…"), more);
                }
                while (low < high) {
                    var middle = Math.ceil((low + high) / 2);
                    show(middle);
                    if (caption.scrollHeight <= caption.clientHeight + 1) low = middle;
                    else high = middle - 1;
                }
                show(low);
            });
        });
    }

    function prepareCards() {
        document.querySelectorAll(selector).forEach(function (card) {
            if (
                card.dataset.saltCardReady ||
                card.closest('[contenteditable="true"], .mce-content-body')
            )
                return;

            var header = card.querySelector(".salt-image-card-header");
            if (!header) return;

            var caption = card.querySelector(".salt-image-card-caption");
            if (caption) card.dataset.saltFullCaption = caption.textContent.trim();
            var title = header.querySelector("h3");
            var button = document.createElement("span");

            button.className = "salt-card-expand-icon";
            button.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg"' +
                ' viewBox="0 0 24 24" fill="none"' +
                ' stroke="currentColor" stroke-width="1.8"' +
                ' stroke-linecap="round" stroke-linejoin="round"' +
                ' aria-hidden="true" focusable="false">' +
                '<path d="M14 4h6v6M20 4l-7 7' +
                'M10 20H4v-6M4 20l7-7"/>' +
                "</svg>";

            button.setAttribute("aria-hidden", "true");
            card.setAttribute("role", "button");
            card.tabIndex = 0;
            card.setAttribute("aria-haspopup", "dialog");
            card.setAttribute(
                "aria-label",
                "Enlarge card: " + (title ? title.textContent.trim() : "image")
            );
            card.dataset.saltCardReady = "true";
            card.querySelectorAll("img.salt-lightbox").forEach(function (image) {
                image.tabIndex = -1;
                image.removeAttribute("role");
                image.removeAttribute("aria-haspopup");
            });
            header.appendChild(button);
            if (cardResize) cardResize.observe(card);
            scheduleCardFit();
        });
    }

    function createDialog() {
        if (dialog) return;

        dialog = document.createElement("dialog");
        dialog.className = "salt-card-dialog";

        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "salt-card-close";
        closeButton.textContent = "Close";

        content = document.createElement("div");

        dialog.append(closeButton, content);
        document.body.appendChild(dialog);

        closeButton.addEventListener("click", function () {
            dialog.close();
        });

        // Close when the dark background is clicked.
        dialog.addEventListener("click", function (event) {
            if (event.target !== dialog) return;

            var bounds = dialog.getBoundingClientRect();
            var outside =
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom;

            if (outside) dialog.close();
        });

        dialog.addEventListener("close", function () {
            content.replaceChildren();

            if (returnFocus && returnFocus.isConnected) {
                returnFocus.focus({ preventScroll: true });
            }
        });
    }

    function openCard(card) {
        createDialog();

        returnFocus = card.contains(document.activeElement) ? document.activeElement : card;

        var copy = card.cloneNode(true);

        // Avoid duplicate IDs and enlargement controls.
        copy.removeAttribute("id");
        copy.classList.remove("salt-card-fit-ready");
        copy.style.removeProperty("--salt-card-fit-height");
        copy.removeAttribute("role");
        copy.removeAttribute("tabindex");
        copy.removeAttribute("aria-label");
        copy.removeAttribute("aria-haspopup");
        copy.removeAttribute("data-salt-card-ready");

        copy.querySelectorAll("[id]").forEach(function (element) {
            element.removeAttribute("id");
        });

        copy.querySelectorAll(
            ".salt-card-expand-icon, .salt-card-open, .salt-card-read-more"
        ).forEach(function (button) {
            button.remove();
        });

        var fullCaption = copy.querySelector(".salt-image-card-caption");
        if (fullCaption && card.dataset.saltFullCaption)
            fullCaption.textContent = card.dataset.saltFullCaption;
        copy.querySelectorAll("img").forEach(function (image) {
            image.classList.remove("salt-lightbox");
            image.removeAttribute("tabindex");
            image.removeAttribute("role");
            image.removeAttribute("aria-haspopup");
            image.loading = "eager";
        });

        var title = card.querySelector(".salt-image-card-header h3");

        dialog.setAttribute(
            "aria-label",
            "Enlarged card: " + (title ? title.textContent.trim() : "image")
        );

        content.replaceChildren(copy);

        if (!dialog.open) dialog.showModal();
        closeButton.focus();
    }

    // Window capture runs before the existing image-lightbox handler.
    window.addEventListener(
        "click",
        function (event) {
            if (!(event.target instanceof Element)) return;

            var card = event.target.closest(selector);
            if (!card || card.closest('[contenteditable="true"], .mce-content-body')) return;
            // Preserve any author-added links, inputs, and other embedded controls.
            var interactive = event.target.closest(
                'a, button, input, select, textarea, summary, [contenteditable="true"]'
            );
            if (interactive && card.contains(interactive)) return;

            event.preventDefault();
            event.stopPropagation();

            openCard(card);
        },
        true
    );

    window.addEventListener(
        "keydown",
        function (event) {
            if (!(event.target instanceof Element)) return;
            var card = event.target.closest(selector);
            if (!card || event.target !== card || event.altKey || event.ctrlKey || event.metaKey)
                return;
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) openCard(card);
        },
        true
    );

    function start() {
        prepareCards();
        window.addEventListener("resize", scheduleCardFit, { passive: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleCardFit);

        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return record.addedNodes.length > 0;
                })
            ) {
                prepareCards();
            }
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }
})();

/* SALT flip cards — contained definitions with minimum text size */
(function () {
    "use strict";

    if (window.SALTFlipTextFitLoaded) return;
    window.SALTFlipTextFitLoaded = true;

    var selector = ".salt-page .salt-flip";
    var scheduled = false;

    function fitCard(card) {
        var copy = card.querySelector(".salt-flip-back > .salt-flip-copy");

        if (!copy || !copy.clientHeight) return;

        // Relative units preserve scaling with browser text settings.
        var minimum = 10 / 12; // About 10pt at the default root size.
        var size = 1;

        copy.style.setProperty("--salt-definition-size", size + "rem");

        while (copy.scrollHeight > copy.clientHeight + 1 && size > minimum) {
            size = Math.max(minimum, size - 0.025);

            copy.style.setProperty("--salt-definition-size", size + "rem");
        }

        copy.scrollTop = 0;
    }

    function fitAll() {
        scheduled = false;
        document.querySelectorAll(selector).forEach(fitCard);
    }

    function scheduleFit() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(fitAll);
    }

    var resizeObserver =
        typeof ResizeObserver === "function" ? new ResizeObserver(scheduleFit) : null;

    function prepareCards() {
        document.querySelectorAll(selector).forEach(function (card) {
            if (card.dataset.saltTextFitReady) return;

            card.querySelectorAll(".salt-flip-front, .salt-flip-back").forEach(function (face) {
                if (face.querySelector(":scope > .salt-flip-copy")) {
                    return;
                }

                var copy = document.createElement("div");
                copy.className = "salt-flip-copy";

                while (face.firstChild) {
                    copy.appendChild(face.firstChild);
                }

                face.appendChild(copy);
            });

            card.dataset.saltTextFitReady = "true";

            if (resizeObserver) resizeObserver.observe(card);
        });

        scheduleFit();
    }

    function start() {
        prepareCards();
        window.addEventListener("resize", scheduleFit);

        if (document.fonts) {
            document.fonts.ready.then(scheduleFit);
        }

        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return record.addedNodes.length > 0;
                })
            ) {
                prepareCards();
            }
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }
})();

/* SORTING GAME (.salt-sort) */
(function () {
    "use strict";
    if (window.SALTSorting) return;
    var ready = new WeakSet(),
        count = 0;
    function initialize() {
        document.querySelectorAll(".salt-sort").forEach(function (game) {
            if (ready.has(game) || game.closest('[contenteditable="true"], .mce-content-body'))
                return;
            // Canvas saves ordinary spans; real controls are created only after page load.
            game.querySelectorAll(".salt-sort-term, .salt-sort-check, .salt-sort-reset").forEach(
                function (placeholder) {
                    if (placeholder.tagName === "BUTTON") return;
                    var button = document.createElement("button");
                    button.type = "button";
                    Array.from(placeholder.attributes).forEach(function (attribute) {
                        if (attribute.name === "class" || attribute.name.indexOf("data-") === 0)
                            button.setAttribute(attribute.name, attribute.value);
                    });
                    button.textContent = placeholder.textContent.trim();
                    placeholder.replaceWith(button);
                }
            );
            var pool = game.querySelector(".salt-sort-pool");
            var bins = Array.from(game.querySelectorAll(".salt-sort-bin"));
            var terms = Array.from(game.querySelectorAll(".salt-sort-term"));
            if (
                !pool ||
                bins.length < 2 ||
                bins.length > 4 ||
                !terms.length ||
                !game.querySelector(".salt-sort-check") ||
                !game.querySelector(".salt-sort-reset") ||
                !game.querySelector(".salt-sort-feedback") ||
                bins.some(function (bin) {
                    return (
                        !bin.querySelector(".salt-sort-place") ||
                        !bin.querySelector(".salt-sort-items")
                    );
                })
            )
                return;
            ready.add(game);
            // Keep keyboard navigation in the same left-to-right order as the actions.
            var actions = game.querySelector(".salt-sort-actions");
            if (actions) {
                actions.appendChild(game.querySelector(".salt-sort-reset"));
                actions.appendChild(game.querySelector(".salt-sort-check"));
            }
            var notice = game.querySelector(".salt-sort-startup");
            if (notice) notice.hidden = true;
            var selected = null,
                target = 0,
                dragging = null;
            var uid = "salt-sort-" + ++count;
            var instructions = game.querySelector(".salt-sort-instructions");
            if (instructions) instructions.id = uid + "-instructions";
            var live = document.createElement("p");
            live.className = "salt-sort-live";
            live.setAttribute("role", "status");
            live.setAttribute("aria-atomic", "true");
            game.appendChild(live);
            var feedback = game.querySelector(".salt-sort-feedback");
            hideFeedback();
            function hideFeedback() {
                feedback.hidden = true;
                feedback.classList.remove("salt-sort-feedback-visible");
                feedback.textContent = "";
            }
            function say(message) {
                live.textContent = message;
            }
            function name(bin) {
                return bin.getAttribute("data-label");
            }
            function clearFeedback() {
                hideFeedback();
                terms.forEach(function (term) {
                    term.classList.remove("salt-sort-wrong");
                    term.setAttribute(
                        "aria-label",
                        term.getAttribute("aria-label").replace(/\. Try again\.$/, "")
                    );
                    var mark = term.querySelector(".salt-sort-error");
                    if (mark) mark.remove();
                });
            }
            function clearSelection() {
                if (selected) selected.setAttribute("aria-pressed", "false");
                selected = null;
                bins.forEach(function (bin) {
                    bin.classList.remove("salt-sort-target");
                });
            }
            function choose(index, prefix) {
                target = (index + bins.length) % bins.length;
                bins.forEach(function (bin, i) {
                    bin.classList.toggle("salt-sort-target", i === target);
                });
                say(
                    (prefix || "") +
                        selected.dataset.term +
                        " picked up. Destination: " +
                        name(bins[target]) +
                        ". Use Left or Right to choose; Enter to drop; Escape to cancel."
                );
            }
            function pick(term, prefix) {
                clearSelection();
                selected = term;
                term.setAttribute("aria-pressed", "true");
                var current = bins.indexOf(term.closest(".salt-sort-bin"));
                choose(current < 0 ? 0 : current, prefix);
            }
            function refreshDropdowns() {
                var unsorted = terms.filter(function (term) {
                    return term.parentElement === pool;
                });
                bins.forEach(function (bin) {
                    var dropdown = bin.querySelector("select.salt-sort-place");
                    if (!dropdown) return;
                    dropdown.textContent = "";
                    var prompt = document.createElement("option");
                    prompt.value = "";
                    prompt.textContent = unsorted.length
                        ? "Place or select term here"
                        : "All terms placed";
                    dropdown.appendChild(prompt);
                    unsorted.forEach(function (term) {
                        var option = document.createElement("option");
                        option.value = String(terms.indexOf(term));
                        option.textContent = term.dataset.term;
                        dropdown.appendChild(option);
                    });
                    dropdown.value = "";
                });
            }
            function move(term, destination, focus, advance) {
                hideFeedback();
                destination.appendChild(term);
                var location =
                    destination === pool
                        ? "Unsorted terms"
                        : name(destination.closest(".salt-sort-bin"));
                term.setAttribute(
                    "aria-label",
                    term.dataset.term +
                        ". Location: " +
                        location +
                        (term.classList.contains("salt-sort-wrong") ? ". Try again." : "")
                );
                clearSelection();
                dragging = null;
                refreshDropdowns();
                var placed = term.dataset.term + " placed in " + location + ". ";
                var next = advance ? pool.querySelector(".salt-sort-term") : null;
                if (next) {
                    next.focus();
                    pick(next, placed + "Next unsorted term: ");
                } else {
                    if (focus) term.focus();
                    say(
                        placed +
                            (advance
                                ? "No unsorted terms remain. Use Check answers when ready."
                                : "")
                    );
                }
            }
            terms.forEach(function (term) {
                term.type = "button";
                term.draggable = true;
                term.dataset.term = term.textContent.trim();
                term.setAttribute("aria-pressed", "false");
                term.setAttribute("aria-label", term.dataset.term + ". Location: Unsorted terms");
                if (instructions) term.setAttribute("aria-describedby", instructions.id);
                var grip = document.createElement("span");
                grip.className = "salt-sort-grip";
                grip.setAttribute("aria-hidden", "true");
                for (var i = 0; i < 8; i++) grip.appendChild(document.createElement("i"));
                var label = document.createElement("span");
                label.className = "salt-sort-term-label";
                label.textContent = term.dataset.term;
                term.textContent = "";
                term.append(grip, label);
                term.addEventListener("click", function (event) {
                    if (selected === term)
                        move(
                            term,
                            bins[target].querySelector(".salt-sort-items"),
                            true,
                            event.detail === 0
                        );
                    else pick(term);
                });
                term.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (event.repeat) return;
                        if (selected === term)
                            move(term, bins[target].querySelector(".salt-sort-items"), true, true);
                        else pick(term);
                        return;
                    }
                    if (event.key === "Tab" && selected === term) {
                        clearSelection();
                        say("Selection cancelled.");
                    }
                    if (selected !== term) return;
                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                        event.preventDefault();
                        choose(target + (event.key === "ArrowRight" ? 1 : -1));
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        clearSelection();
                        say("Selection cancelled.");
                    }
                });
                term.addEventListener("dragstart", function (event) {
                    pick(term);
                    dragging = term;
                    event.dataTransfer.setData("text/plain", term.dataset.term);
                    event.dataTransfer.effectAllowed = "move";
                });
                term.addEventListener("dragend", function () {
                    dragging = null;
                    clearSelection();
                });
            });
            bins.forEach(function (bin) {
                var placeholder = bin.querySelector(".salt-sort-place");
                var dropdown = document.createElement("select");
                dropdown.className = "salt-sort-place salt-sort-dropdown";
                dropdown.setAttribute(
                    "aria-label",
                    "Choose an unsorted term to place in " +
                        name(bin) +
                        ". Selecting a term moves it immediately."
                );
                placeholder.replaceWith(dropdown);
                var expanded = false;
                function collapseDropdown() {
                    expanded = false;
                    dropdown.removeAttribute("size");
                }
                function commitDropdown() {
                    var value = dropdown.value;
                    var term = terms[Number(value)];
                    collapseDropdown();
                    if (value === "" || !term || term.parentElement !== pool) return;
                    move(term, bin.querySelector(".salt-sort-items"), false, false);
                }
                function openDropdownWithEnter(event) {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (event.repeat) return;
                    if (expanded) {
                        commitDropdown();
                        return;
                    }
                    if (typeof dropdown.showPicker === "function") {
                        try {
                            dropdown.showPicker();
                            return;
                        } catch (error) {
                            /* Fall back to an inline native list. */
                        }
                    }
                    // Native picker opening is unavailable in some browsers/embedded contexts.
                    expanded = true;
                    dropdown.size = Math.min(6, Math.max(2, dropdown.options.length));
                    say(
                        "Choose a term for " +
                            name(bin) +
                            " with Up and Down arrows, then Enter to place it. Escape cancels."
                    );
                }
                dropdown.addEventListener("keydown", function (event) {
                    if (event.key === "Escape" && expanded) {
                        event.preventDefault();
                        collapseDropdown();
                        dropdown.value = "";
                        say("Selection cancelled.");
                        return;
                    }
                    openDropdownWithEnter(event);
                });
                dropdown.addEventListener("change", function () {
                    if (!expanded) commitDropdown();
                });
                dropdown.addEventListener("click", function () {
                    if (expanded && dropdown.value !== "") commitDropdown();
                });
                dropdown.addEventListener("blur", function () {
                    if (expanded) {
                        collapseDropdown();
                        dropdown.value = "";
                    }
                });
                bin.addEventListener("dragover", function (event) {
                    if (!dragging) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    bins.forEach(function (other) {
                        other.classList.toggle("salt-sort-target", other === bin);
                    });
                });
                bin.addEventListener("drop", function (event) {
                    if (!dragging) return;
                    event.preventDefault();
                    move(dragging, bin.querySelector(".salt-sort-items"), true);
                });
            });
            refreshDropdowns();
            game.querySelector(".salt-sort-check").addEventListener("click", function () {
                clearSelection();
                clearFeedback();
                var incorrect = 0;
                terms.forEach(function (term) {
                    var bin = term.closest(".salt-sort-bin");
                    if (!bin || bin.dataset.category !== term.dataset.category) {
                        incorrect++;
                        term.classList.add("salt-sort-wrong");
                        var error = document.createElement("span");
                        error.className = "salt-sort-error";
                        error.textContent = "Try again";
                        term.appendChild(error);
                        term.setAttribute(
                            "aria-label",
                            term.getAttribute("aria-label") + ". Try again."
                        );
                    }
                });
                feedback.textContent = incorrect
                    ? incorrect +
                      " term" +
                      (incorrect === 1 ? " needs" : "s need") +
                      " another try. Move each marked term to a different container. Unsorted terms also need a container."
                    : "Correct! You placed all of the terms into the proper container!";
                feedback.classList.toggle("salt-sort-success", !incorrect);
                feedback.hidden = false;
                feedback.classList.add("salt-sort-feedback-visible");
                say(feedback.textContent);
            });
            game.querySelector(".salt-sort-reset").addEventListener("click", function () {
                clearSelection();
                clearFeedback();
                terms.forEach(function (term) {
                    pool.appendChild(term);
                    term.setAttribute(
                        "aria-label",
                        term.dataset.term + ". Location: Unsorted terms"
                    );
                });
                refreshDropdowns();
                say("Game reset. All terms are back in Unsorted terms.");
            });
        });
    }
    window.SALTSorting = { initialize: initialize, version: "1.5" };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return Array.from(record.addedNodes).some(function (node) {
                        return (
                            node.nodeType === 1 &&
                            (node.matches(".salt-sort") || node.querySelector(".salt-sort"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* VERTICAL TABS (.salt-vtabs) */
(function () {
    "use strict";
    if (window.SALTVerticalTabs) return;
    var initialized = new WeakSet(),
        serial = 0;
    function initialize() {
        document.querySelectorAll(".salt-vtabs").forEach(function (root) {
            if (
                initialized.has(root) ||
                root.closest('[contenteditable="true"], .mce-content-body')
            )
                return;
            var content = Array.from(root.children).find(function (node) {
                return node.classList.contains("salt-vtabs-content");
            });
            if (!content) return;
            var panels = Array.from(content.children).filter(function (node) {
                return node.classList.contains("salt-vtab-panel");
            });
            if (panels.length < 2) return;
            var labels = panels.map(function (panel) {
                var heading = panel.querySelector("h2,h3,h4,h5,h6");
                return (panel.dataset.tabLabel || (heading && heading.textContent) || "").trim();
            });
            if (
                labels.some(function (label) {
                    return !label;
                })
            )
                return;
            initialized.add(root);
            var prefix;
            do {
                prefix = "salt-vtabs-" + ++serial;
            } while (document.querySelector('[id^="' + prefix + '-"]'));
            var list = document.createElement("div");
            list.className = "salt-vtabs-list";
            list.setAttribute("role", "tablist");
            list.setAttribute("aria-orientation", "vertical");
            list.setAttribute("aria-label", root.getAttribute("data-label") || "Learning topics");
            var tabs = panels.map(function (panel, i) {
                var tab = document.createElement("button");
                tab.type = "button";
                tab.className = "salt-vtab";
                tab.textContent = labels[i];
                tab.id = prefix + "-tab-" + i;
                panel.id = prefix + "-panel-" + i;
                tab.setAttribute("role", "tab");
                tab.setAttribute("aria-controls", panel.id);
                panel.setAttribute("role", "tabpanel");
                panel.setAttribute("aria-labelledby", tab.id);
                panel.tabIndex = 0;
                tab.addEventListener("click", function () {
                    activate(i, false);
                });
                tab.addEventListener("keydown", function (event) {
                    var target = keyTarget(event.key, i, panels.length);
                    if (target === null || event.altKey || event.ctrlKey || event.metaKey) return;
                    event.preventDefault();
                    activate(target, true);
                });
                list.appendChild(tab);
                return tab;
            });
            function activate(index, focus) {
                tabs.forEach(function (tab, i) {
                    tab.setAttribute("aria-selected", String(i === index));
                    tab.tabIndex = i === index ? 0 : -1;
                    panels[i].hidden = i !== index;
                });
                if (focus) tabs[index].focus();
            }
            root.insertBefore(list, content);
            activate(0, false);
            root.classList.add("salt-vtabs-ready");
        });
    }
    function keyTarget(key, index, length) {
        if (key === "ArrowDown") return (index + 1) % length;
        if (key === "ArrowUp") return (index + length - 1) % length;
        if (key === "Home") return 0;
        if (key === "End") return length - 1;
        return null;
    }
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return Array.from(record.addedNodes).some(function (node) {
                        return (
                            node.nodeType === 1 &&
                            (node.matches(".salt-vtabs") || node.querySelector(".salt-vtabs"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    window.SALTVerticalTabs = { initialize: initialize, version: "1.0" };
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* VERTICAL TABS — connected outline drawing */
(function () {
    "use strict";
    if (window.SALTVerticalTabJoins) return;
    var ready = new WeakSet(),
        serial = 0;
    var ns = "http://www.w3.org/2000/svg";
    function make(tag, attrs) {
        var el = document.createElementNS(ns, tag);
        Object.keys(attrs || {}).forEach(function (key) {
            el.setAttribute(key, attrs[key]);
        });
        return el;
    }
    // One continuous outline eliminates mismatched corners between two boxes.
    function outline(p, tab, first, last) {
        var x = p.x,
            y = p.y,
            right = p.right,
            bottom = p.bottom;
        var left = tab.x,
            top = first ? y : tab.y,
            base = last ? bottom : tab.bottom;
        var r = Math.min(12, (right - x) / 4, (bottom - y) / 4);
        var a = Math.min(9, (base - top) / 4);
        // Each interior junction has its own radius, including near very short panels.
        var jt = Math.max(0, Math.min(9, (top - y - r) / 2));
        var jb = Math.max(0, Math.min(9, (bottom - base - r) / 2));
        var d = first ? "M " + (left + a) + " " + y : "M " + (x + r) + " " + y;
        d += " H " + (right - r) + " Q " + right + " " + y + " " + right + " " + (y + r);
        d += " V " + (bottom - r) + " Q " + right + " " + bottom + " " + (right - r) + " " + bottom;
        if (last) {
            d += " H " + (left + a) + " Q " + left + " " + bottom + " " + left + " " + (bottom - a);
        } else {
            d += " H " + (x + r) + " Q " + x + " " + bottom + " " + x + " " + (bottom - r);
            d += " V " + (base + jb) + " Q " + x + " " + base + " " + (x - jb) + " " + base;
            d += " H " + (left + a) + " Q " + left + " " + base + " " + left + " " + (base - a);
        }
        d += " V " + (top + a) + " Q " + left + " " + top + " " + (left + a) + " " + top;
        if (!first) {
            d += " H " + (x - jt) + " Q " + x + " " + top + " " + x + " " + (top - jt);
            d += " V " + (y + r) + " Q " + x + " " + y + " " + (x + r) + " " + y;
        }
        return d + " Z";
    }
    function initialize() {
        document.querySelectorAll(".salt-vtabs-ready").forEach(function (root) {
            if (ready.has(root)) return;
            var list = root.querySelector(".salt-vtabs-list");
            var content = root.querySelector(".salt-vtabs-content");
            if (!list || !content) return;
            ready.add(root);
            var id;
            do {
                id = "salt-vtabs-join-gradient-" + ++serial;
            } while (document.getElementById(id));
            var svg = make("svg", {
                class: "salt-vtabs-outline",
                "aria-hidden": "true",
                focusable: "false"
            });
            var defs = make("defs"),
                gradient = make("linearGradient", { id: id, gradientUnits: "userSpaceOnUse" });
            gradient.append(
                make("stop", { offset: "0", style: "stop-color: var(--salt-secondary-dark, #8f202e)" }),
                make("stop", { offset: "1", style: "stop-color: var(--salt-gray-strong, #6d6d6d)" })
            );
            defs.append(gradient);
            var path = make("path", {
                fill: "#f5f8fd",
                stroke: "url(#" + id + ")",
                "stroke-width": "2",
                "stroke-linejoin": "round"
            });
            svg.append(defs, path);
            root.prepend(svg);
            root.classList.add("salt-joint-ready");
            var queued = false;
            function draw() {
                queued = false;
                if (!root.isConnected || !window.matchMedia("(min-width: 651px)").matches) return;
                var selected = list.querySelector('[aria-selected="true"]');
                var panel = content.querySelector(".salt-vtab-panel:not([hidden])");
                if (!selected || !panel) return;
                var b = root.getBoundingClientRect(),
                    t = selected.getBoundingClientRect(),
                    p = panel.getBoundingClientRect();
                if (!b.width || !p.height) return;
                var tabs = Array.from(list.querySelectorAll(".salt-vtab"));
                // Use local layout coordinates, unaffected by the section entrance transform.
                var sx = root.offsetWidth / b.width,
                    sy = root.offsetHeight / b.height;
                var box = {
                    x: (p.left - b.left) * sx + 1,
                    y: (p.top - b.top) * sy + 1,
                    right: (p.right - b.left) * sx - 1,
                    bottom: (p.bottom - b.top) * sy - 1
                };
                var tab = {
                    x: (t.left - b.left) * sx + 1,
                    y: (t.top - b.top) * sy + 1,
                    bottom: (t.bottom - b.top) * sy - 1
                };
                svg.setAttribute("viewBox", "0 0 " + root.offsetWidth + " " + root.offsetHeight);
                gradient.setAttribute("x1", tab.x);
                gradient.setAttribute("x2", box.x + 4);
                gradient.setAttribute("y1", "0");
                gradient.setAttribute("y2", "0");
                /* Only join the bottom edges when they actually align. */
                var lastTabAtBottom =
                    selected === tabs[tabs.length - 1] && Math.abs(tab.bottom - box.bottom) <= 2;

                path.setAttribute("d", outline(box, tab, selected === tabs[0], lastTabAtBottom));
            }
            function schedule() {
                if (!queued) {
                    queued = true;
                    requestAnimationFrame(draw);
                }
            }
            new MutationObserver(schedule).observe(list, {
                subtree: true,
                attributes: true,
                attributeFilter: ["aria-selected"]
            });
            if ("ResizeObserver" in window) {
                var resize = new ResizeObserver(schedule);
                resize.observe(root);
                resize.observe(list);
                resize.observe(content);
            }
            window.addEventListener("resize", schedule);
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
            schedule();
        });
    }
    window.SALTVerticalTabJoins = { initialize: initialize, outline: outline };
    function start() {
        initialize();
        new MutationObserver(initialize).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* IMAGE CAROUSEL (.salt-carousel) */
(function () {
    "use strict";
    if (window.SALTImageCarousel) return;
    var initialized = new WeakSet();
    function nearestIndex(positions, offset) {
        return positions.reduce(function (best, value, index) {
            return Math.abs(value - offset) < Math.abs(positions[best] - offset) ? index : best;
        }, 0);
    }
    function visibleFraction(left, width, viewportLeft, viewportWidth) {
        return width > 0
            ? Math.max(
                  0,
                  Math.min(left + width, viewportLeft + viewportWidth) -
                      Math.max(left, viewportLeft)
              ) / width
            : 0;
    }
    function chooseActive(fractions, previous, current, direction) {
        var candidates = fractions
            .map(function (v, i) {
                return i;
            })
            .filter(function (i) {
                return (
                    i !== current &&
                    fractions[i] >= 0.5 &&
                    (previous[i] === undefined || previous[i] < 0.5) &&
                    (direction > 0 ? i > current : direction < 0 ? i < current : true)
                );
            });
        if (candidates.length)
            return candidates.reduce(function (a, b) {
                return fractions[b] > fractions[a] ? b : a;
            });
        if (current < 0 || fractions[current] < 0.5) {
            var best = fractions.reduce(function (a, v, i) {
                return v > fractions[a] ? i : a;
            }, 0);
            if (fractions[best] >= 0.5) return best;
        }
        return current;
    }
    function button(label, className, text) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = className;
        el.setAttribute("aria-label", label);
        el.textContent = text || "";
        return el;
    }
    function initialize() {
        document.querySelectorAll(".salt-page .salt-carousel").forEach(function (root) {
            if (
                initialized.has(root) ||
                root.closest('[contenteditable="true"], .mce-content-body')
            )
                return;
            var track = Array.from(root.children).find(function (el) {
                return el.classList.contains("salt-carousel-track");
            });
            if (!track) return;
            var slides = Array.from(track.children).filter(function (el) {
                return el.classList.contains("salt-carousel-slide");
            });
            if (slides.length < 2) return;
            initialized.add(root);
            root.classList.add("salt-carousel-ready", "salt-carousel-click-previews");
            root.setAttribute("role", "region");
            root.setAttribute("aria-roledescription", "carousel");
            root.setAttribute("aria-label", root.dataset.label || "Image carousel");
            track.tabIndex = -1;
            track.setAttribute(
                "aria-label",
                "Images. Select a side preview or use the Previous, Next, or image selection buttons below."
            );
            var controls = document.createElement("div");
            controls.className = "salt-carousel-controls";
            var dots = document.createElement("div");
            dots.className = "salt-carousel-dots";
            dots.setAttribute("role", "group");
            dots.setAttribute("aria-label", "Choose an image");
            var previous = button("Previous image", "salt-carousel-arrow", "‹");
            var next = button("Next image", "salt-carousel-arrow", "›");
            var status = document.createElement("div");
            status.className = "salt-carousel-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-atomic", "true");
            var current = -1;
            var openButtons = [];
            var dotButtons = slides.map(function (slide, index) {
                slide.setAttribute("role", "group");
                slide.setAttribute("aria-roledescription", "slide");
                slide.setAttribute("aria-label", index + 1 + " of " + slides.length);
                var image = slide.querySelector("img.salt-lightbox");
                if (image) {
                    var open = button(
                        "Enlarge image" + (image.alt ? ": " + image.alt : ""),
                        "salt-carousel-open"
                    );
                    open.setAttribute("aria-haspopup", "dialog");
                    image.tabIndex = -1;
                    image.removeAttribute("role");
                    image.removeAttribute("aria-label");
                    image.removeAttribute("aria-haspopup");
                    image.parentNode.insertBefore(open, image);
                    open.appendChild(image);
                    openButtons[index] = open;
                    // Capture preview activation before the existing image lightbox handler.
                    open.addEventListener(
                        "click",
                        function (event) {
                            if (index !== current) {
                                event.preventDefault();
                                event.stopPropagation();
                                go(index);
                                return;
                            }
                            if (event.target !== image) {
                                event.stopPropagation();
                                image.click();
                            }
                        },
                        true
                    );
                }
                var dot = button(
                    "Show image " + (index + 1) + " of " + slides.length,
                    "salt-carousel-dot"
                );
                dot.addEventListener("click", function () {
                    go(index);
                });
                dots.appendChild(dot);
                return dot;
            });
            controls.append(previous, dots, next);
            root.append(controls, status);
            function go(index) {
                index = Math.max(0, Math.min(slides.length - 1, index));
                if (index === current) return;
                current = index;
                slides.forEach(function (slide, i) {
                    if (i !== index && slide.contains(document.activeElement))
                        dotButtons[index].focus({ preventScroll: true });
                    var visible = Math.abs(i - index) <= 1;
                    slide.hidden = !visible;
                    slide.inert = !visible;
                    slide.classList.toggle("salt-carousel-active", i === index);
                    slide.classList.toggle("salt-carousel-before", i === index - 1);
                    slide.classList.toggle("salt-carousel-after", i === index + 1);
                    if (visible) slide.removeAttribute("aria-hidden");
                    else slide.setAttribute("aria-hidden", "true");
                    if (openButtons[i]) {
                        openButtons[i].tabIndex = visible ? 0 : -1;
                        openButtons[i].setAttribute(
                            "aria-label",
                            i === index
                                ? "Enlarge image " + (i + 1) + " of " + slides.length
                                : "Show image " + (i + 1) + " of " + slides.length
                        );
                        if (i === index) openButtons[i].setAttribute("aria-haspopup", "dialog");
                        else openButtons[i].removeAttribute("aria-haspopup");
                    }
                    if (i === index) dotButtons[i].setAttribute("aria-current", "true");
                    else dotButtons[i].removeAttribute("aria-current");
                });
                previous.setAttribute("aria-disabled", String(index === 0));
                next.setAttribute("aria-disabled", String(index === slides.length - 1));
                status.textContent = "Image " + (index + 1) + " of " + slides.length;
            }
            previous.addEventListener("click", function () {
                if (current > 0) go(current - 1);
            });
            next.addEventListener("click", function () {
                if (current < slides.length - 1) go(current + 1);
            });
            go(0);
        });
    }
    window.SALTImageCarousel = {
        initialize: initialize,
        nearestIndex: nearestIndex,
        visibleFraction: visibleFraction,
        chooseActive: chooseActive,
        version: "2.2-click-previews"
    };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (r) {
                    return Array.from(r.addedNodes).some(function (el) {
                        return (
                            el.nodeType === 1 &&
                            (el.matches(".salt-carousel, .salt-page") ||
                                el.querySelector(".salt-carousel"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();
/* IMAGE / SCENARIO GAME — button order */
(function () {
    "use strict";
    if (window.SALTImageGameLayout) return;
    function initialize() {
        document.querySelectorAll(".salt-page .salt-id-game").forEach(function (game) {
            var actions = game.querySelector(".salt-id-actions");
            if (!actions || actions.dataset.saltLayoutReady) return;
            var next = actions.querySelector(".salt-id-next:not(.salt-id-restart)");
            var restart = actions.querySelector(".salt-id-restart");
            var again = actions.querySelector(".salt-id-again");
            var review = actions.querySelector(".salt-id-review");
            if (!next || (!restart && !again)) return;
            if (!restart) {
                restart = document.createElement("button");
                restart.type = "button";
                restart.className = "salt-id-next salt-id-restart";
                restart.textContent = "Start Over";
                // Reuse the original full-round reset handler if needed.
                restart.addEventListener("click", function () {
                    again.click();
                });
            }
            actions.dataset.saltLayoutReady = "true";
            actions.appendChild(restart);
            actions.appendChild(next);
            if (review) actions.appendChild(review);
            if (again) again.remove();
        });
    }
    window.SALTImageGameLayout = { initialize: initialize };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (record) {
                    return record.addedNodes.length > 0;
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* FLIP CARD CAROUSEL (.salt-flip-carousel) */
(function () {
    "use strict";
    if (window.SALTFlipCarousel) return;
    var initialized = new WeakSet();
    function shuffled(values) {
        var copy = values.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = copy[i];
            copy[i] = copy[j];
            copy[j] = temp;
        }
        if (
            copy.length > 1 &&
            copy.every(function (card, index) {
                return card === values[index];
            })
        )
            copy.push(copy.shift());
        return copy;
    }
    function button(label, cls) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = cls;
        el.setAttribute("aria-label", label);
        return el;
    }
    function arrow(label, reverse) {
        var el = button(label, "salt-flip-carousel-arrow");
        el.innerHTML =
            '<svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
            (reverse ? "M17 4 6 16l11 12" : "M7 4l11 12L7 28") +
            '"/></svg>';
        return el;
    }
    function initialize() {
        document.querySelectorAll(".salt-page .salt-flip-carousel").forEach(function (root) {
            if (
                initialized.has(root) ||
                root.closest('[contenteditable="true"], .mce-content-body')
            )
                return;
            var grid = root.querySelector(".salt-flip-grid");
            if (!grid) return;
            var cards = Array.from(grid.children).filter(function (el) {
                return el.classList.contains("salt-flip");
            });
            if (cards.length < 2) return;
            initialized.add(root);
            root.setAttribute("role", "region");
            root.setAttribute("aria-roledescription", "carousel");
            root.setAttribute("aria-label", root.dataset.label || "Flip card practice");
            var header = document.createElement("div");
            header.className = "salt-flip-carousel-header";
            var count = document.createElement("div");
            count.className = "salt-flip-carousel-count";
            header.appendChild(count);
            var stage = document.createElement("div");
            stage.className = "salt-flip-carousel-stage";
            var previous = arrow("Previous card", true),
                next = arrow("Next card", false);
            grid.parentNode.insertBefore(header, grid);
            grid.parentNode.insertBefore(stage, grid);
            stage.append(previous, grid, next);
            var footer = document.createElement("div");
            footer.className = "salt-flip-carousel-footer";
            var shuffle = button("Shuffle cards and start at card 1", "salt-flip-carousel-shuffle");
            shuffle.textContent = "Shuffle Order";
            footer.appendChild(shuffle);
            var announcement = document.createElement("div");
            announcement.className = "salt-flip-carousel-announcement";
            announcement.setAttribute("role", "status");
            announcement.setAttribute("aria-atomic", "true");
            root.append(footer, announcement);
            var index = 0;
            var labels = new Map(
                cards.map(function (card) {
                    var title = card.querySelector(".salt-flip-front .salt-flip-copy");
                    return [card, title ? title.textContent.trim() : "Learning card"];
                })
            );
            function setFace(card, back) {
                card.classList.toggle("flipped", back);
                card.setAttribute("aria-pressed", String(back));
                var front = card.querySelector(".salt-flip-front"),
                    answer = card.querySelector(".salt-flip-back");
                if (front) {
                    front.setAttribute("aria-hidden", String(back));
                    front.inert = back;
                }
                if (answer) {
                    answer.setAttribute("aria-hidden", String(!back));
                    answer.inert = !back;
                }
                card.setAttribute(
                    "aria-label",
                    back
                        ? labels.get(card) +
                              ". Answer: " +
                              (answer ? answer.textContent.trim() : "") +
                              ". Select to return."
                        : labels.get(card) + ". Select to reveal the answer."
                );
            }
            function show(value, message) {
                var focusCard = grid.contains(document.activeElement);
                index = Math.max(0, Math.min(cards.length - 1, value));
                cards.forEach(function (card, i) {
                    setFace(card, false);
                    card.hidden = i !== index;
                    card.inert = i !== index;
                    card.tabIndex = i === index ? 0 : -1;
                    card.setAttribute("role", "button");
                });
                count.textContent = index + 1 + " out of " + cards.length;
                previous.setAttribute("aria-disabled", String(index === 0));
                next.setAttribute("aria-disabled", String(index === cards.length - 1));
                announcement.textContent =
                    message || "Card " + (index + 1) + " out of " + cards.length;
                if (focusCard) cards[index].focus({ preventScroll: true });
            }
            function reorder() {
                cards = shuffled(cards);
                cards.forEach(function (card) {
                    grid.appendChild(card);
                });
            }
            previous.addEventListener("click", function () {
                if (index > 0) show(index - 1);
            });
            next.addEventListener("click", function () {
                if (index < cards.length - 1) show(index + 1);
            });
            shuffle.addEventListener("click", function () {
                reorder();
                show(0, "Cards shuffled. Card 1 out of " + cards.length);
            });
            // Capture prevents the original SALT handlers from flipping a card twice.
            root.addEventListener(
                "click",
                function (event) {
                    var card = event.target.closest(".salt-flip");
                    if (
                        !card ||
                        !grid.contains(card) ||
                        event.target.closest("a,button,input,select,textarea")
                    )
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    setFace(card, !card.classList.contains("flipped"));
                },
                true
            );
            root.addEventListener(
                "keydown",
                function (event) {
                    var card = event.target.closest(".salt-flip");
                    if (
                        !card ||
                        !grid.contains(card) ||
                        event.target.closest("a,button,input,select,textarea")
                    )
                        return;
                    if (event.altKey || event.ctrlKey || event.metaKey) return;
                    if (
                        ["Enter", " ", "ArrowLeft", "ArrowRight", "Home", "End"].indexOf(
                            event.key
                        ) === -1
                    )
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.repeat) return;
                    if (event.key === "Enter" || event.key === " ")
                        setFace(card, !card.classList.contains("flipped"));
                    else
                        show(
                            event.key === "Home"
                                ? 0
                                : event.key === "End"
                                  ? cards.length - 1
                                  : index + (event.key === "ArrowRight" ? 1 : -1)
                        );
                },
                true
            );
            reorder();
            show(0);
        });
    }
    window.SALTFlipCarousel = { initialize: initialize, shuffled: shuffled, version: "1.0" };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (r) {
                    return Array.from(r.addedNodes).some(function (el) {
                        return (
                            el.nodeType === 1 &&
                            (el.matches(".salt-flip-carousel, .salt-page") ||
                                el.querySelector(".salt-flip-carousel"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* IMAGE CAROUSEL — image proportions for rounded corners */
(function () {
    "use strict";
    if (window.SALTCarouselProportions) return;
    var initialized = new WeakSet();
    function initialize() {
        document.querySelectorAll(".salt-carousel-slide img.salt-image").forEach(function (image) {
            if (initialized.has(image)) return;
            initialized.add(image);
            function update() {
                if (image.naturalWidth && image.naturalHeight)
                    image.style.setProperty(
                        "--salt-image-ratio",
                        image.naturalWidth / image.naturalHeight
                    );
            }
            image.addEventListener("load", update);
            update();
        });
    }
    window.SALTCarouselProportions = { initialize: initialize };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (r) {
                    return r.addedNodes.length > 0;
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* KEY TAKEAWAYS — card reveal (#salt-elements-wrapup) */
(function () {
    "use strict";
    if (window.SALTWrapupReveal) return;
    var initialized = new WeakSet();
    function initialize() {
        document.querySelectorAll(".salt-page #salt-elements-wrapup").forEach(function (section) {
            if (
                initialized.has(section) ||
                section.closest('[contenteditable="true"], .mce-content-body')
            )
                return;
            var cards = Array.from(
                section.querySelectorAll(".salt-achievement-grid > .salt-achievement")
            );
            if (!cards.length) return;
            initialized.add(section);
            var media = window.matchMedia("(prefers-reduced-motion: reduce)");
            var index = 0,
                timer = null,
                started = false,
                notBefore = 0;
            var visible = new Set(),
                observer = null;
            cards.forEach(function (card, i) {
                var back = document.createElement("div");
                back.className = "salt-award-back";
                while (card.firstChild) back.appendChild(card.firstChild);
                var front = document.createElement("div");
                front.className = "salt-award-front";
                // The front is decorative; the original takeaway stays accessible throughout.
                front.setAttribute("aria-hidden", "true");
                var emblem = document.createElement("span");
                emblem.className = "salt-award-front-emblem";
                emblem.textContent = "✦";
                var label = document.createElement("span");
                label.className = "salt-award-front-label";
                label.textContent = "Key Takeaway #" + (i + 1);
                var hint = document.createElement("span");
                hint.className = "salt-award-front-hint";
                hint.textContent = "A tool to carry forward";
                front.append(emblem, label, hint);
                card.append(front, back);
                card.classList.add("salt-award-flip");
            });
            function revealAll() {
                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }
                cards.forEach(function (card) {
                    card.classList.add("salt-award-revealed");
                });
                index = cards.length;
                if (observer) observer.disconnect();
            }
            if (media.matches || !("IntersectionObserver" in window)) {
                revealAll();
                return;
            }
            section.classList.add("salt-wrap-reveal-ready");
            function advance() {
                if (
                    timer !== null ||
                    !started ||
                    index >= cards.length ||
                    !visible.has(cards[index])
                )
                    return;
                var delay = Math.max(0, notBefore - Date.now());
                timer = setTimeout(function () {
                    timer = null;
                    if (media.matches) {
                        revealAll();
                        return;
                    }
                    if (!visible.has(cards[index])) return;
                    var card = cards[index];
                    card.classList.add("salt-award-revealed");
                    observer.unobserve(card);
                    index++;
                    // Start the next visible card 150ms before this 850ms flip finishes.
                    notBefore = Date.now() + 700;
                    if (index >= cards.length) observer.disconnect();
                    else advance();
                }, delay);
            }
            observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.target === section) {
                            if (entry.isIntersecting && !started) {
                                started = true;
                                notBefore = Date.now() + 1100;
                                observer.unobserve(section);
                            }
                        } else {
                            if (entry.isIntersecting && entry.intersectionRatio >= 0.25)
                                visible.add(entry.target);
                            else visible.delete(entry.target);
                        }
                    });
                    advance();
                },
                { threshold: [0, 0.25], rootMargin: "0px 0px -16px 0px" }
            );
            observer.observe(section);
            cards.forEach(function (card) {
                observer.observe(card);
            });
            function changed(event) {
                if (event.matches) revealAll();
            }
            if (media.addEventListener) media.addEventListener("change", changed);
        });
    }
    window.SALTWrapupReveal = { initialize: initialize, version: "1.0" };
    function start() {
        initialize();
        new MutationObserver(function (records) {
            if (
                records.some(function (r) {
                    return Array.from(r.addedNodes).some(function (el) {
                        return (
                            el.nodeType === 1 &&
                            (el.matches("#salt-elements-wrapup, .salt-achievement, .salt-page") ||
                                el.querySelector("#salt-elements-wrapup"))
                        );
                    });
                })
            )
                initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* =========================================================
   SALT 4.1 ENHANCEMENTS — 2026-11-20
   Append once, after all other SALT JavaScript.
   - Shared screen-reader announcements (window.SALTAnnounce)
   - Horizontal tabs: ids, labels, Home/End keys
   - Dialog focus trap
   - Answer cards: hide the unseen face from screen readers
   - Term-reveal tables: progress counter and Hide all
   - Reveal groups: optional Open all / Close all
   - Lab prep checklist (.salt-checklist), saved per browser
   - Table filter (.salt-table-container[data-salt-filter])
   ========================================================= */
(function () {
    "use strict";
    if (window.SALTEnhancements) return;
    var serial = 0;
    function uid(prefix) {
        var id;
        do {
            id = prefix + "-" + ++serial;
        } while (document.getElementById(id));
        return id;
    }
    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function btn(text, cls) {
        var b = el("button", cls, text);
        b.type = "button";
        return b;
    }
    function editing(node) {
        return !!node.closest('[contenteditable="true"], .mce-content-body');
    }

    /* ---------- Shared live region ---------- */
    var live;
    function announce(message) {
        if (!message) return;
        if (!live || !live.isConnected) {
            live = el("div", "salt-sr-only salt-announcer");
            live.setAttribute("role", "status");
            live.setAttribute("aria-live", "polite");
            live.setAttribute("aria-atomic", "true");
            document.body.appendChild(live);
        }
        live.textContent = "";
        // A short delay lets screen readers notice repeated messages.
        setTimeout(function () {
            live.textContent = message;
        }, 60);
    }

    /* ---------- Horizontal tabs ---------- */
    function prepareTabs() {
        document.querySelectorAll(".salt-page .salt-tabs").forEach(function (tabs) {
            if (tabs.dataset.saltTabsA11y || editing(tabs)) return;
            var list = tabs.querySelector(".salt-tab-buttons");
            var buttons = tabs.querySelectorAll(".salt-tab-button");
            var panels = tabs.querySelectorAll(".salt-tab-content");
            if (!list || !buttons.length || buttons.length !== panels.length) return;
            tabs.dataset.saltTabsA11y = "true";
            list.setAttribute("role", "tablist");
            if (!list.getAttribute("aria-label"))
                list.setAttribute("aria-label", tabs.dataset.label || "Topics");
            buttons.forEach(function (button, i) {
                var panel = panels[i];
                if (!panel.id) panel.id = uid("salt-tab-panel");
                if (!button.id) button.id = uid("salt-tab");
                button.setAttribute("aria-controls", panel.id);
                panel.setAttribute("role", "tabpanel");
                panel.setAttribute("aria-labelledby", button.id);
                panel.tabIndex = 0;
            });
            list.addEventListener("keydown", function (event) {
                if (event.key !== "Home" && event.key !== "End") return;
                var all = Array.prototype.slice.call(tabs.querySelectorAll(".salt-tab-button"));
                var target = all[event.key === "Home" ? 0 : all.length - 1];
                if (!target) return;
                event.preventDefault();
                target.click();
                target.focus();
            });
        });
    }

    /* ---------- Dialog focus trap ---------- */
    var focusable =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key !== "Tab") return;
            var dialog = document.querySelector(".salt-dialog.open:not([hidden])");
            if (!dialog) return;
            var items = Array.prototype.filter.call(
                dialog.querySelectorAll(focusable),
                function (node) {
                    return node.offsetParent !== null || node === document.activeElement;
                }
            );
            if (!items.length) return;
            var first = items[0],
                last = items[items.length - 1];
            if (!dialog.contains(document.activeElement)) {
                event.preventDefault();
                first.focus();
                return;
            }
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        true
    );

    /* ---------- Answer cards: only the visible face is read ---------- */
    function syncFlashcard(card) {
        var flipped = card.classList.contains("flipped");
        var front = card.querySelector(".salt-flashcard-front");
        var back = card.querySelector(".salt-flashcard-back");
        if (front) front.setAttribute("aria-hidden", String(flipped));
        if (back) back.setAttribute("aria-hidden", String(!flipped));
    }
    var flashcardObserver = window.MutationObserver
        ? new MutationObserver(function (records) {
              records.forEach(function (record) {
                  var card = record.target;
                  var was = (record.oldValue || "").split(/\s+/).indexOf("flipped") !== -1;
                  var now = card.classList.contains("flipped");
                  if (was === now) return;
                  syncFlashcard(card);
                  if (now) {
                      var back = card.querySelector(".salt-flashcard-back");
                      if (back) announce(back.textContent.replace(/\s+/g, " ").trim());
                  }
              });
          })
        : null;
    function prepareFlashcards() {
        document.querySelectorAll(".salt-page .salt-flashcard").forEach(function (card) {
            if (card.dataset.saltFaceSync) return;
            card.dataset.saltFaceSync = "true";
            syncFlashcard(card);
            if (flashcardObserver)
                flashcardObserver.observe(card, {
                    attributes: true,
                    attributeFilter: ["class"],
                    attributeOldValue: true
                });
        });
    }

    /* ---------- Term-reveal tables: counter + Hide all ---------- */
    function prepareTermTables() {
        document.querySelectorAll(".salt-page table[data-active-table]").forEach(function (table) {
            if (table.dataset.saltTermTools || editing(table)) return;
            var buttons = table.querySelectorAll("button.salt-blank");
            if (!buttons.length) return;
            table.dataset.saltTermTools = "true";
            var container = table.closest(".salt-table-container") || table;
            var tools = el("div", "salt-term-tools");
            var status = el("p", "salt-term-status");
            var hide = btn("Hide all", "salt-term-hide");
            var show = btn("Reveal all", "salt-term-show");
            tools.append(status, show, hide);
            container.after(tools);
            function current() {
                return table.querySelectorAll("button.salt-blank");
            }
            function count() {
                var all = current(),
                    open = 0;
                all.forEach(function (b) {
                    if (b.getAttribute("aria-expanded") === "true") open++;
                });
                status.textContent = open + " of " + all.length + " terms revealed";
                tools.classList.toggle("salt-term-complete", open === all.length);
                hide.disabled = open === 0;
                show.disabled = open === all.length;
                return open;
            }
            function setAll(open) {
                current().forEach(function (b) {
                    if ((b.getAttribute("aria-expanded") === "true") !== open) b.click();
                });
                count();
                announce(
                    open
                        ? "All terms revealed."
                        : "All terms hidden. Try recalling each term again."
                );
            }
            table.addEventListener("click", function (event) {
                if (
                    !(event.target instanceof Element) ||
                    !event.target.closest("button.salt-blank")
                )
                    return;
                setTimeout(count, 0);
            });
            hide.addEventListener("click", function () {
                setAll(false);
            });
            show.addEventListener("click", function () {
                setAll(true);
            });
            count();
        });
    }

    /* ---------- Reveal groups: Open all / Close all (opt-in) ---------- */
    function prepareRevealGroups() {
        document
            .querySelectorAll(".salt-page .salt-reveal-group[data-salt-expand-all]")
            .forEach(function (group) {
                if (group.dataset.saltExpandReady || editing(group)) return;
                var reveals = group.querySelectorAll(":scope > .salt-reveal");
                if (reveals.length < 2 || !group.querySelector("button.salt-reveal-button")) return;
                group.dataset.saltExpandReady = "true";
                var bar = el("div", "salt-reveal-group-tools");
                var toggle = btn("Open all", "salt-reveal-toggle-all");
                toggle.setAttribute("aria-expanded", "false");
                bar.appendChild(toggle);
                group.before(bar);
                function allOpen() {
                    return Array.prototype.every.call(
                        group.querySelectorAll(":scope > .salt-reveal"),
                        function (r) {
                            return r.classList.contains("open");
                        }
                    );
                }
                function refresh() {
                    var open = allOpen();
                    toggle.textContent = open ? "Close all" : "Open all";
                    toggle.setAttribute("aria-expanded", String(open));
                }
                toggle.addEventListener("click", function () {
                    var open = !allOpen();
                    group.querySelectorAll(":scope > .salt-reveal").forEach(function (reveal) {
                        if (reveal.classList.contains("open") !== open) {
                            var b = reveal.querySelector(".salt-reveal-button");
                            if (b) b.click();
                        }
                    });
                    refresh();
                    announce(open ? "All sections opened." : "All sections closed.");
                });
                group.addEventListener("click", function () {
                    setTimeout(refresh, 0);
                });
                refresh();
            });
    }

    /* ---------- Lab prep checklist ---------- */
    function storageKey(index) {
        return "salt-checklist:" + location.pathname + ":" + index;
    }
    function readState(key) {
        try {
            return JSON.parse(window.localStorage.getItem(key) || "[]");
        } catch (e) {
            return [];
        }
    }
    function writeState(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            /* Storage blocked. */
        }
    }
    function prepareChecklists() {
        document.querySelectorAll(".salt-page .salt-checklist").forEach(function (list, listIndex) {
            if (list.dataset.saltChecklistReady || editing(list)) return;
            var source = list.querySelector("ul, ol");
            if (!source) return;
            var items = Array.prototype.filter.call(source.children, function (li) {
                return li.tagName === "LI";
            });
            if (!items.length) return;
            list.dataset.saltChecklistReady = "true";
            var key = storageKey(list.id || listIndex);
            var saved = readState(key);
            var id = uid("salt-checklist");
            var title = el("p", "salt-checklist-title", list.dataset.title || "Checklist");
            title.id = id + "-title";
            var meter = el("div", "salt-checklist-meter");
            meter.setAttribute("aria-hidden", "true");
            var fill = el("span", "salt-checklist-fill");
            meter.appendChild(fill);
            var status = el("p", "salt-checklist-status");
            var group = el("ul", "salt-checklist-items");
            group.setAttribute("aria-labelledby", title.id);
            var boxes = items.map(function (li, i) {
                var row = el("li", "salt-checklist-item");
                var box = document.createElement("input");
                box.type = "checkbox";
                box.id = id + "-item-" + i;
                box.checked = saved.indexOf(i) !== -1;
                var label = document.createElement("label");
                label.htmlFor = box.id;
                while (li.firstChild) label.appendChild(li.firstChild);
                row.append(box, label);
                row.classList.toggle("is-checked", box.checked);
                group.appendChild(row);
                return box;
            });
            var done = list.querySelector(".salt-checklist-complete");
            if (!done) done = el("p", "salt-checklist-complete", "All set! You are ready.");
            var reset = btn("Clear checklist", "salt-checklist-reset");
            var footer = el("div", "salt-checklist-footer");
            footer.append(status, reset);
            source.replaceWith(group);
            list.prepend(title, meter);
            list.append(footer, done);
            function update(speak) {
                var checked = [];
                boxes.forEach(function (box, i) {
                    if (box.checked) checked.push(i);
                    box.closest(".salt-checklist-item").classList.toggle("is-checked", box.checked);
                });
                var complete = checked.length === boxes.length;
                fill.style.width = (checked.length / boxes.length) * 100 + "%";
                status.textContent = checked.length + " of " + boxes.length + " complete";
                done.hidden = !complete;
                list.classList.toggle("salt-checklist-done", complete);
                reset.disabled = !checked.length;
                writeState(key, checked);
                if (speak) announce(status.textContent + (complete ? ". " + done.textContent : ""));
            }
            boxes.forEach(function (box) {
                box.addEventListener("change", function () {
                    update(true);
                });
            });
            reset.addEventListener("click", function () {
                boxes.forEach(function (box) {
                    box.checked = false;
                });
                update(true);
                boxes[0].focus();
            });
            update(false);
        });
    }

    /* ---------- Table filter ---------- */
    function prepareFilters() {
        document
            .querySelectorAll(".salt-page .salt-table-container[data-salt-filter]")
            .forEach(function (container) {
                if (container.dataset.saltFilterReady || editing(container)) return;
                var table = container.querySelector("table");
                if (!table || !table.tBodies.length) return;
                container.dataset.saltFilterReady = "true";
                var rows = Array.prototype.slice.call(table.tBodies[0].rows);
                var id = uid("salt-filter");
                var wrap = el("div", "salt-filter");
                var label = el(
                    "label",
                    "salt-filter-label",
                    container.dataset.saltFilter || "Filter table"
                );
                label.htmlFor = id;
                var input = document.createElement("input");
                input.type = "search";
                input.id = id;
                input.className = "salt-filter-input";
                input.autocomplete = "off";
                input.setAttribute("aria-describedby", id + "-status");
                var status = el("p", "salt-filter-status");
                status.id = id + "-status";
                wrap.append(label, input, status);
                container.before(wrap);
                var empty = el("p", "salt-filter-empty", "No rows match. Try a different word.");
                empty.hidden = true;
                container.after(empty);
                var timer = null;
                function apply(speak) {
                    var words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
                    var shown = 0;
                    rows.forEach(function (row) {
                        var text = row.textContent.toLowerCase();
                        var match = words.every(function (w) {
                            return text.indexOf(w) !== -1;
                        });
                        row.hidden = !match;
                        if (match) shown++;
                    });
                    status.textContent = words.length
                        ? shown + " of " + rows.length + " rows shown"
                        : rows.length + " rows";
                    empty.hidden = shown !== 0;
                    if (speak) {
                        clearTimeout(timer);
                        timer = setTimeout(function () {
                            announce(status.textContent);
                        }, 500);
                    }
                }
                input.addEventListener("input", function () {
                    apply(true);
                });
                apply(false);
            });
    }

    /* ---------- Start ---------- */
    function initialize() {
        if (!document.querySelector(".salt-page")) return;
        prepareTabs();
        prepareFlashcards();
        prepareTermTables();
        prepareRevealGroups();
        prepareChecklists();
        prepareFilters();
    }
    window.SALTAnnounce = announce;
    window.SALTEnhancements = { initialize: initialize, announce: announce, version: "4.1" };
    function start() {
        initialize();
        // Other SALT modules rebuild controls after load; check again briefly.
        setTimeout(initialize, 400);
        setTimeout(initialize, 1500);
        var queued = false;
        new MutationObserver(function (records) {
            if (
                queued ||
                !records.some(function (r) {
                    return r.addedNodes.length > 0;
                })
            )
                return;
            queued = true;
            setTimeout(function () {
                queued = false;
                initialize();
            }, 120);
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* NAME THAT PART (.salt-parts) — numbered image with flip cards */
(function () {
    "use strict";
    if (window.SALTNumberedParts) return;

    function element(tag, className, text) {
        var node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function setCard(button, revealed) {
        button.setAttribute("aria-pressed", String(revealed));
        button.setAttribute(
            "aria-label",
            revealed
                ? "Part " + button._saltNumber + ": " + button._saltTerm + ". Hide term"
                : "Part " + button._saltNumber + ". Reveal term"
        );
    }

    function updateStatus(activity, reset) {
        var buttons = activity.querySelectorAll(".salt-part-toggle");
        var count = activity.querySelectorAll('.salt-part-toggle[aria-pressed="true"]').length;
        activity.querySelector(".salt-parts-status").textContent =
            (reset ? "Cards reset. " : "") + count + " of " + buttons.length + " terms revealed.";
    }

    function initialize() {
        document.querySelectorAll(".salt-parts").forEach(function (activity) {
            if (!activity.querySelector(".salt-parts-grid")) return;
            activity.querySelectorAll(".salt-part-card").forEach(function (card) {
                if (card.querySelector(".salt-part-toggle")) return;
                var numberNode = card.querySelector(".salt-part-number");
                var termNode = card.querySelector(".salt-part-term");
                if (!numberNode || !termNode) return;
                var number = numberNode.textContent.trim();
                var term = termNode.textContent.trim();
                if (!number || !term) return;
                var button = element("button", "salt-part-toggle");
                button.type = "button";
                button._saltNumber = number;
                button._saltTerm = term;
                var inner = element("span", "salt-part-inner");
                inner.setAttribute("aria-hidden", "true");
                var front = element("span", "salt-part-face salt-part-front");
                front.appendChild(element("strong", "", number));
                front.appendChild(element("small", "", "Reveal term"));
                var back = element("span", "salt-part-face salt-part-back");
                back.appendChild(element("small", "", "Part " + number));
                back.appendChild(element("strong", "", term));
                inner.appendChild(front);
                inner.appendChild(back);
                button.appendChild(inner);
                setCard(button, false);
                card.replaceChildren(button);
                card.classList.add("salt-part-ready");
            });
            var reset = activity.querySelector(".salt-parts-reset");
            if (reset && reset.tagName !== "BUTTON") {
                var resetButton = element(
                    "button",
                    "salt-parts-reset",
                    reset.textContent.trim() || "Reset cards"
                );
                resetButton.type = "button";
                reset.replaceWith(resetButton);
            }
            if (!activity.querySelector(".salt-parts-status")) {
                var status = element("p", "salt-parts-status");
                status.setAttribute("role", "status");
                status.setAttribute("aria-live", "polite");
                status.setAttribute("aria-atomic", "true");
                activity.querySelector(".salt-parts-grid").after(status);
                updateStatus(activity, false);
            }
        });
    }

    document.addEventListener("click", function (event) {
        if (!(event.target instanceof Element)) return;
        var button = event.target.closest(".salt-part-toggle, .salt-parts-reset");
        if (!button) return;
        var activity = button.closest(".salt-parts");
        if (!activity) return;
        if (button.classList.contains("salt-parts-reset")) {
            activity.querySelectorAll(".salt-part-toggle").forEach(function (card) {
                setCard(card, false);
            });
            updateStatus(activity, true);
        } else {
            setCard(button, button.getAttribute("aria-pressed") !== "true");
            updateStatus(activity, false);
        }
    });

    window.SALTNumberedParts = { initialize: initialize };
    function start() {
        initialize();
        var observer = new MutationObserver(function (records) {
            var relevant = records.some(function (record) {
                return Array.from(record.addedNodes).some(function (node) {
                    return (
                        node.nodeType === 1 &&
                        (node.matches(".salt-parts, .salt-part-card") ||
                            node.querySelector(".salt-parts, .salt-part-card"))
                    );
                });
            });
            if (relevant) initialize();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();

/* =========================================================
   SALT COURSE HOME PAGE
   Replaces the DesignPLUS home page "personalized welcome"
   and "module list" tools.

   - .salt-home-welcome[data-salt-welcome]: swaps "{name}" for
     the student's short name (from Canvas, no API call needed).
   - a[data-salt-course-path]: points the link at this course,
     so a copied page never links back to the old course.
   - .salt-module-explorer: loads this course's published
     modules and items from the Canvas API and shows them as
     a vertical list of module buttons with one module's items
     at a time. If the API can't be reached (for example in
     the mobile app), the fallback text in the HTML stays.
   ========================================================= */
(function () {
    "use strict";

    if (window.SALTHome) return;

    var REQUIREMENTS = {
        must_view: "View",
        must_mark_done: "Mark done",
        must_submit: "Submit",
        must_contribute: "Contribute",
        min_score: "Score at least {n}",
        min_percentage: "Score at least {n}%"
    };

    var TYPE_LABELS = {
        Page: "Page",
        Assignment: "Assignment",
        Quiz: "Quiz",
        Discussion: "Discussion",
        File: "File",
        ExternalUrl: "Link",
        ExternalTool: "External tool"
    };

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function mock() {
        return window.SALT_HOME_MOCK || null;
    }

    function currentCourseId(root) {
        var fromAttr = root && root.getAttribute("data-course-id");
        if (fromAttr) return fromAttr;
        if (window.ENV && window.ENV.COURSE_ID) return String(window.ENV.COURSE_ID);
        var match = location.pathname.match(/\/courses\/(\d+)/);
        return match ? match[1] : null;
    }

    function shortName() {
        if (mock()) return mock().userName || "";
        var user = window.ENV && window.ENV.current_user;
        return (user && (user.display_name || user.short_name)) || "";
    }

    /* ---------- welcome + course links ---------- */

    /* Full name ("Trae Durtschi") isn't in Canvas's page data, so it
       comes from the API. If that fails, the short name is used. */
    function fullName() {
        if (mock()) return Promise.resolve(mock().userFullName || mock().userName || "");
        return getJSON("/api/v1/users/self")
            .then(function (page) {
                return (page.data && page.data.name) || shortName();
            })
            .catch(shortName);
    }

    function personalize(home) {
        var heading = home.querySelector(".salt-home-welcome[data-salt-welcome]");
        if (heading && !heading._saltDone) {
            heading._saltDone = true;
            var template = heading.getAttribute("data-salt-welcome");
            var lookup =
                template.indexOf("{fullname}") > -1 ? fullName() : Promise.resolve(shortName());
            lookup.then(function (name) {
                if (!name) return;
                heading.textContent = template.replace("{fullname}", name).replace("{name}", name);
            });
        }

        var courseId = currentCourseId(home);
        if (!courseId) return;
        home.querySelectorAll("a[data-salt-course-path]").forEach(function (link) {
            var path = link.getAttribute("data-salt-course-path").replace(/^\/+/, "");
            link.setAttribute("href", "/courses/" + courseId + (path ? "/" + path : ""));
        });
    }

    /* ---------- Canvas API ---------- */

    function getJSON(url) {
        return fetch(url, {
            credentials: "same-origin",
            headers: { Accept: "application/json" }
        }).then(function (response) {
            if (!response.ok) throw new Error("Canvas API " + response.status);
            var next = null;
            var links = response.headers.get("Link") || "";
            links.split(",").forEach(function (part) {
                var m = part.match(/<([^>]+)>;\s*rel="next"/);
                if (m) next = m[1];
            });
            return response.text().then(function (text) {
                return { data: JSON.parse(text.replace(/^while\(1\);/, "")), next: next };
            });
        });
    }

    function getAll(url, collected) {
        collected = collected || [];
        return getJSON(url).then(function (page) {
            collected = collected.concat(page.data);
            return page.next ? getAll(page.next, collected) : collected;
        });
    }

    function loadModules(courseId) {
        if (mock()) return Promise.resolve(JSON.parse(JSON.stringify(mock().modules)));
        return getAll(
            "/api/v1/courses/" +
                courseId +
                "/modules?include[]=items&include[]=content_details&per_page=50"
        );
    }

    /* Canvas leaves items out of the module list when a module has many
       items; those are loaded the first time the module is opened. */
    function loadItems(courseId, module) {
        if (module.items) return Promise.resolve(module.items);
        return getAll(
            "/api/v1/courses/" +
                courseId +
                "/modules/" +
                module.id +
                "/items?include[]=content_details&per_page=100"
        ).then(function (items) {
            module.items = items;
            return items;
        });
    }

    function visible(list) {
        return (list || []).filter(function (item) {
            return item.published !== false;
        });
    }

    /* ---------- rendering ---------- */

    function moduleState(module) {
        if (module.state === "completed") return "completed";
        if (module.state === "locked") return "locked";
        return "";
    }

    function requirementText(req) {
        var text = REQUIREMENTS[req.type] || "";
        return text.replace("{n}", req.min_score != null ? req.min_score : req.min_percentage);
    }

    function renderItems(panel, courseId, module, items) {
        var list = el("ul", "salt-mx-items");
        var shown = visible(items);

        if (!shown.length) {
            list.appendChild(el("li", "salt-mx-empty", "Nothing has been added to this module yet."));
        }

        shown.forEach(function (item) {
            var li = el("li", "salt-mx-item");
            li.setAttribute("data-type", item.type || "");
            if (item.indent) li.style.setProperty("--salt-mx-indent", String(Math.min(item.indent, 5)));

            if (item.type === "SubHeader") {
                li.className = "salt-mx-item salt-mx-subheader";
                li.textContent = item.title;
                list.appendChild(li);
                return;
            }

            var icon = el("span", "salt-mx-type");
            icon.setAttribute("aria-hidden", "true");
            li.appendChild(icon);

            var body = el("span", "salt-mx-body");
            var link = el("a", "salt-mx-link", item.title);
            link.href = item.html_url || item.external_url || "#";
            var typeLabel = TYPE_LABELS[item.type];
            if (typeLabel) {
                var sr = el("span", "salt-sr-only", typeLabel + ": ");
                link.insertBefore(sr, link.firstChild);
            }
            body.appendChild(link);

            var details = [];
            var req = item.completion_requirement;
            if (req && requirementText(req)) details.push(requirementText(req));
            var cd = item.content_details || {};
            if (cd.due_at) {
                details.push(
                    "Due " +
                        new Date(cd.due_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                        })
                );
            }
            if (cd.points_possible) details.push(cd.points_possible + " pts");
            if (details.length) body.appendChild(el("span", "salt-mx-meta", details.join(" · ")));
            li.appendChild(body);

            var status = null;
            if (cd.locked_for_user) {
                status = el("span", "salt-mx-status salt-mx-status-locked");
                status.appendChild(el("span", "salt-sr-only", "Locked"));
            } else if (req && req.completed) {
                status = el("span", "salt-mx-status salt-mx-status-done");
                status.appendChild(el("span", "salt-sr-only", "Completed"));
            } else if (req) {
                status = el("span", "salt-mx-status salt-mx-status-todo");
                status.appendChild(el("span", "salt-sr-only", "Not completed yet"));
            }
            if (status) li.appendChild(status);

            list.appendChild(li);
        });

        panel.appendChild(list);
    }

    function showModule(explorer, index, moveFocus) {
        var state = explorer._saltModules;
        var module = state.modules[index];
        var tabs = explorer.querySelectorAll(".salt-mx-tab");
        var panel = explorer.querySelector(".salt-mx-panel");

        tabs.forEach(function (tab, i) {
            var selected = i === index;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            tab.classList.toggle("salt-mx-tab-active", selected);
        });
        if (moveFocus) tabs[index].focus({ preventScroll: true });
        /* On phones the module buttons are a sideways row: keep the
           selected one in view without scrolling the whole page. */
        var row = tabs[index].parentNode;
        if (row.scrollWidth > row.clientWidth) {
            row.scrollLeft = tabs[index].offsetLeft - row.offsetLeft - 8;
        }

        panel.setAttribute("aria-labelledby", tabs[index].id);
        panel.replaceChildren();

        var header = el("div", "salt-mx-panel-header");
        var title = el("h3", "salt-mx-panel-title", module.name);
        header.appendChild(title);
        var open = el("a", "salt-mx-open", "Open in Modules");
        open.href = "/courses/" + state.courseId + "/modules#module_" + module.id;
        header.appendChild(open);
        panel.appendChild(header);

        if (moduleState(module) === "locked") {
            var note = "This module is locked";
            if (module.unlock_at) {
                note +=
                    " until " +
                    new Date(module.unlock_at).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    });
            } else if (module.prerequisite_module_ids && module.prerequisite_module_ids.length) {
                note += " until you finish the modules before it";
            }
            panel.appendChild(el("p", "salt-mx-locked-note", note + "."));
        }

        try {
            sessionStorage.setItem("salt-home-module-" + state.courseId, String(module.id));
        } catch (e) {}

        var token = (explorer._saltToken = {});
        if (module.items) {
            renderItems(panel, state.courseId, module, module.items);
            return;
        }
        var loading = el("p", "salt-mx-loading", "Loading module items…");
        panel.appendChild(loading);
        loadItems(state.courseId, module)
            .then(function (items) {
                if (explorer._saltToken !== token) return;
                loading.remove();
                renderItems(panel, state.courseId, module, items);
            })
            .catch(function () {
                if (explorer._saltToken !== token) return;
                loading.textContent = "These items could not be loaded. Use “Open in Modules” instead.";
            });
    }

    function defaultIndex(courseId, modules) {
        var remembered = null;
        try {
            remembered = sessionStorage.getItem("salt-home-module-" + courseId);
        } catch (e) {}
        for (var i = 0; i < modules.length; i++) {
            if (remembered && String(modules[i].id) === remembered) return i;
        }
        /* Otherwise start on the first module the student hasn't finished. */
        for (var j = 0; j < modules.length; j++) {
            var s = modules[j].state;
            if (s === "unlocked" || s === "started") return j;
        }
        return 0;
    }

    function build(explorer, courseId, modules) {
        modules = visible(modules);
        if (!modules.length) return false;

        var uid = "salt-mx-" + Math.random().toString(36).slice(2, 8);
        var layout = el("div", "salt-mx-layout");
        var tablist = el("div", "salt-mx-tabs");
        tablist.setAttribute("role", "tablist");
        tablist.setAttribute("aria-orientation", "vertical");
        tablist.setAttribute("aria-label", explorer.getAttribute("data-label") || "Course modules");

        var panel = el("div", "salt-mx-panel");
        panel.id = uid + "-panel";
        panel.setAttribute("role", "tabpanel");
        panel.tabIndex = 0;

        modules.forEach(function (module, i) {
            var tab = el("button", "salt-mx-tab");
            tab.type = "button";
            tab.id = uid + "-tab-" + i;
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-controls", panel.id);
            tab.setAttribute("data-index", String(i));
            var state = moduleState(module);
            if (state) tab.setAttribute("data-state", state);
            tab.appendChild(el("span", "salt-mx-tab-pin")).setAttribute("aria-hidden", "true");
            tab.appendChild(el("span", "salt-mx-tab-name", module.name));
            if (state) {
                var badge = el("span", "salt-mx-tab-state");
                badge.appendChild(
                    el("span", "salt-sr-only", state === "completed" ? "(completed)" : "(locked)")
                );
                tab.appendChild(badge);
            }
            tablist.appendChild(tab);
        });

        layout.appendChild(tablist);
        layout.appendChild(panel);

        explorer._saltModules = { courseId: courseId, modules: modules };
        explorer.replaceChildren(layout);
        explorer.classList.add("salt-mx-ready");
        showModule(explorer, defaultIndex(courseId, modules), false);
        return true;
    }

    function setupExplorer(explorer, courseId) {
        if (explorer._saltStarted) return;
        explorer._saltStarted = true;
        if (!courseId && !mock()) return;

        explorer.classList.add("salt-mx-loading-state");
        loadModules(courseId)
            .then(function (modules) {
                explorer.classList.remove("salt-mx-loading-state");
                build(explorer, courseId, modules);
            })
            .catch(function () {
                /* Keep the author's fallback text and links. */
                explorer.classList.remove("salt-mx-loading-state");
            });
    }

    /* ---------- resource tabs (.salt-home-tabs) ---------- */

    function selectTab(tabs, index, moveFocus) {
        var buttons = tabs.querySelectorAll(".salt-home-tab");
        var panels = tabs.querySelectorAll(":scope > .salt-home-tab-panel");
        buttons.forEach(function (button, i) {
            var selected = i === index;
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
            panels[i].hidden = !selected;
        });
        if (moveFocus) buttons[index].focus({ preventScroll: true });
        var row = buttons[index].parentNode;
        if (row.scrollWidth > row.clientWidth) {
            row.scrollLeft = buttons[index].offsetLeft - row.offsetLeft - 8;
        }
    }

    function setupTabs(tabs) {
        if (tabs.classList.contains("salt-home-tabs-ready")) return;
        var panels = tabs.querySelectorAll(":scope > .salt-home-tab-panel");
        if (!panels.length) return;
        var uid = "salt-ht-" + Math.random().toString(36).slice(2, 8);
        var list = el("div", "salt-home-tablist");
        list.setAttribute("role", "tablist");
        list.setAttribute("aria-label", tabs.getAttribute("data-label") || "Resources");
        panels.forEach(function (panel, i) {
            var title = panel.querySelector(".salt-home-tab-title");
            var button = el("button", "salt-home-tab");
            button.appendChild(
                el("span", "salt-home-tab-label", title ? title.textContent.trim() : "Tab " + (i + 1))
            );
            button.type = "button";
            button.id = uid + "-tab-" + i;
            button.setAttribute("role", "tab");
            button.setAttribute("data-index", String(i));
            button.setAttribute("aria-controls", uid + "-panel-" + i);
            panel.id = uid + "-panel-" + i;
            panel.setAttribute("role", "tabpanel");
            panel.setAttribute("aria-labelledby", button.id);
            panel.tabIndex = 0;
            list.appendChild(button);
        });
        tabs.insertBefore(list, tabs.firstChild);
        tabs.classList.add("salt-home-tabs-ready");
        selectTab(tabs, 0, false);
    }

    /* ---------- contact cards: initials when there's no photo ---------- */

    /* Each email address on a contact card gets a copy button to its
       right. Canvas strips <button> from page HTML, so it's added here. */
    function addCopyButtons(card) {
        card.querySelectorAll(".salt-contact-line").forEach(function (line) {
            var link = line.querySelector('a[href^="mailto:"]');
            if (!link || line.querySelector(".salt-copy-email")) return;
            var email = link.getAttribute("href").slice(7).split("?")[0];
            try {
                email = decodeURIComponent(email);
            } catch (e) {}
            if (!email) return;
            var button = el("button", "salt-copy-email");
            button.type = "button";
            button.setAttribute("data-email", email);
            button.setAttribute("aria-label", "Copy email address " + email);
            button.title = "Copy email address";
            var status = el("span", "salt-copy-status");
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            line.classList.add("salt-contact-line-copy");
            line.appendChild(button);
            line.appendChild(status);
        });
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        /* Older browsers and some app web views. */
        return new Promise(function (resolve, reject) {
            var area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            var ok = false;
            try {
                ok = document.execCommand("copy");
            } catch (e) {}
            area.remove();
            if (ok) resolve();
            else reject(new Error("Copy failed"));
        });
    }

    function copyEmail(button) {
        var email = button.getAttribute("data-email");
        var status = button.parentNode.querySelector(".salt-copy-status");
        function show(message, copied) {
            button.classList.toggle("salt-copied", copied);
            status.textContent = message;
            status.classList.add("salt-copy-status-visible");
            clearTimeout(button._saltTimer);
            button._saltTimer = setTimeout(function () {
                button.classList.remove("salt-copied");
                status.classList.remove("salt-copy-status-visible");
                status.textContent = "";
            }, 2000);
        }
        copyText(email)
            .then(function () {
                show("Copied!", true);
            })
            .catch(function () {
                show("Couldn't copy. Select the address instead.", false);
            });
    }

    function setupContactCards() {
        document.querySelectorAll(".salt-contact-card").forEach(function (card) {
            addCopyButtons(card);
            if (card.querySelector("img, .salt-contact-initials")) return;
            var nameNode = card.querySelector(".salt-contact-name");
            if (!nameNode) return;
            var initials = nameNode.textContent
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(function (word) {
                    return word.charAt(0).toUpperCase();
                });
            if (!initials.length) return;
            var badge = el(
                "span",
                "salt-contact-initials",
                initials[0] + (initials.length > 1 ? initials[initials.length - 1] : "")
            );
            badge.setAttribute("aria-hidden", "true");
            card.insertBefore(badge, card.firstChild);
        });
    }

    /* ---------- back to top ---------- */

    function backToTop(link) {
        var target =
            link.closest(".salt-home") || link.closest(".salt-page") || document.body;
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        /* Move keyboard focus to the top as well, without a second jump. */
        var heading = target.querySelector("h1, h2");
        if (heading) {
            if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
            heading.focus({ preventScroll: true });
        }
    }

    /* ---------- events ---------- */

    document.addEventListener("click", function (event) {
        if (!(event.target instanceof Element)) return;
        var top = event.target.closest(".salt-home-top a, .salt-back-top a, a[data-salt-top]");
        if (top) {
            event.preventDefault();
            backToTop(top);
            return;
        }
        var copy = event.target.closest(".salt-copy-email");
        if (copy) {
            copyEmail(copy);
            return;
        }
        var homeTab = event.target.closest(".salt-home-tab");
        if (homeTab) {
            selectTab(homeTab.closest(".salt-home-tabs"), Number(homeTab.getAttribute("data-index")), false);
            return;
        }
        var tab = event.target.closest(".salt-mx-tab");
        if (!tab) return;
        var explorer = tab.closest(".salt-module-explorer");
        showModule(explorer, Number(tab.getAttribute("data-index")), false);
    });

    function arrowTarget(key, index, count) {
        if (key === "ArrowDown" || key === "ArrowRight") return (index + 1) % count;
        if (key === "ArrowUp" || key === "ArrowLeft") return (index - 1 + count) % count;
        if (key === "Home") return 0;
        if (key === "End") return count - 1;
        return null;
    }

    document.addEventListener("keydown", function (event) {
        if (!(event.target instanceof Element)) return;
        var homeTab = event.target.closest(".salt-home-tab");
        if (homeTab) {
            var tabs = homeTab.closest(".salt-home-tabs");
            var target = arrowTarget(
                event.key,
                Number(homeTab.getAttribute("data-index")),
                tabs.querySelectorAll(".salt-home-tab").length
            );
            if (target === null) return;
            event.preventDefault();
            selectTab(tabs, target, true);
            return;
        }
        var tab = event.target.closest(".salt-mx-tab");
        if (!tab) return;
        var explorer = tab.closest(".salt-module-explorer");
        var count = explorer._saltModules.modules.length;
        var index = Number(tab.getAttribute("data-index"));
        var next = arrowTarget(event.key, index, count);
        if (next === null) return;
        event.preventDefault();
        showModule(explorer, next, true);
    });

    /* ---------- start ---------- */

    function initialize() {
        document.querySelectorAll(".salt-home").forEach(function (home) {
            personalize(home);
            var courseId = currentCourseId(home);
            home.querySelectorAll(".salt-module-explorer").forEach(function (explorer) {
                setupExplorer(explorer, currentCourseId(explorer) || courseId);
            });
            home.querySelectorAll(".salt-home-tabs").forEach(setupTabs);
        });
        setupContactCards();
    }

    window.SALTHome = { initialize: initialize };

    function start() {
        initialize();
        new MutationObserver(function (records) {
            var relevant = records.some(function (record) {
                return Array.from(record.addedNodes).some(function (node) {
                    return (
                        node.nodeType === 1 &&
                        (node.matches(".salt-home, .salt-contact-card") ||
                            node.querySelector(".salt-home, .salt-contact-card"))
                    );
                });
            });
            if (relevant) initialize();
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();
