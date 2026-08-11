/*
 * 代码块 UI 脚本：
 * 1. 为每个代码块包裹 .codeblock 容器（折叠与复制按钮的定位基准）
 * 2. 超过 COLLAPSE_AFTER 行的代码块自动折叠，按钮展开/收起
 * 3. 把主题在 load 阶段注入到 .highlight（横向滚动容器）内的复制按钮
 *    搬到外层 .codeblock 上——按钮不再随横向滚动移动、不再遮挡代码，
 *    始终固定在代码块可视区右上角
 * 配合 assets/scss/custom.scss 中 .codeblock / .copyCodeButton 样式使用。
 */
(function () {
    "use strict";

    var COLLAPSE_AFTER = 20; // 超过该行数才折叠
    var VISIBLE_LINES = 14;  // 折叠时保留可见的行数

    document.querySelectorAll(".article-content .highlight").forEach(function (block) {
        if (block.closest(".codeblock")) return;

        // 无论长短都包裹容器：长块用于折叠，所有块用于固定复制按钮
        var wrapper = document.createElement("div");
        wrapper.className = "codeblock";
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        // 语言标签：取 fence 的 data-lang，显示在左上角留白区
        var langCode = block.querySelector("code[data-lang]");
        if (langCode) {
            var langTag = document.createElement("span");
            langTag.className = "codeblock-lang";
            langTag.textContent = langCode.getAttribute("data-lang");
            wrapper.appendChild(langTag);
        }

        var lineNumberSpans = block.querySelectorAll(".lntd:first-child .lnt");
        var lines = lineNumberSpans.length;
        if (!lines) {
            // 无行号时按文本行数估算
            var pre = block.querySelector("pre");
            if (!pre) return;
            lines = (pre.textContent.match(/\n/g) || []).length + 1;
        }
        if (lines <= COLLAPSE_AFTER) return;

        // 实测行高，保证不同字号/缩放下折叠窗口高度准确
        var lineHeight = 24;
        if (lineNumberSpans.length) {
            lineHeight = lineNumberSpans[0].getBoundingClientRect().height;
        } else {
            var cs = getComputedStyle(block.querySelector("pre"));
            lineHeight = parseFloat(cs.lineHeight) || 24;
        }
        var collapsedHeight = Math.ceil(lineHeight * VISIBLE_LINES);

        var button = document.createElement("button");
        button.type = "button";
        button.className = "codeblock-toggle";
        button.setAttribute("aria-expanded", "false");
        button.textContent = "展开代码 · 共 " + lines + " 行 ▾";
        wrapper.appendChild(button);

        // 初始为折叠态
        block.style.maxHeight = collapsedHeight + "px";
        wrapper.classList.add("is-collapsed");

        button.addEventListener("click", function () {
            var collapsed = wrapper.classList.contains("is-collapsed");
            if (collapsed) {
                // 展开：先设为当前实际高度以便过渡，结束后解除限制
                block.style.maxHeight = block.scrollHeight + "px";
                wrapper.classList.remove("is-collapsed");
                button.setAttribute("aria-expanded", "true");
                button.textContent = "收起代码 ▴";
                block.addEventListener("transitionend", function handler(e) {
                    if (e.propertyName === "max-height") {
                        block.style.maxHeight = "none";
                        block.removeEventListener("transitionend", handler);
                    }
                });
            } else {
                // 收起：从 none 先回到具体高度，强制回流后再收缩
                block.style.maxHeight = block.scrollHeight + "px";
                void block.offsetHeight;
                block.style.maxHeight = collapsedHeight + "px";
                wrapper.classList.add("is-collapsed");
                button.setAttribute("aria-expanded", "false");
                button.textContent = "展开代码 · 共 " + lines + " 行 ▾";
            }
        });
    });

    /* 主题 main.ts 在 window load 时把 .copyCodeButton 追加到 .highlight 内。
       .highlight 是横向滚动容器，绝对定位子元素会随内容一起滚走，
       导致按钮离开右上角并遮挡代码——发现即搬到外层 .codeblock。 */
    function relocate(btn) {
        var highlight = btn.closest(".highlight");
        if (!highlight) return;
        var wrapper = highlight.parentElement;
        if (wrapper && wrapper.classList.contains("codeblock") && btn.parentElement !== wrapper) {
            wrapper.appendChild(btn);
        }
    }

    function sweep() {
        document.querySelectorAll(".article-content .copyCodeButton").forEach(relocate);
    }

    sweep();
    if (typeof MutationObserver !== "undefined") {
        new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1 && node.classList &&
                        node.classList.contains("copyCodeButton")) {
                        relocate(node);
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    }
})();
