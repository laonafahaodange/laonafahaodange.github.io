/*
 * 阅读 UI：顶部阅读进度条 + 返回顶部按钮
 * - 进度条宽度随页面滚动实时更新（requestAnimationFrame 节流）
 * - 回顶按钮在滚动超过一屏后浮现，点击平滑回顶
 */
(function () {
    "use strict";

    // 阅读进度条
    var bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    // 返回顶部按钮
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "返回顶部");
    btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 5v14"></path><path d="M5 12l7 -7l7 7"></path></svg>';
    document.body.appendChild(btn);

    var ticking = false;
    function update() {
        var doc = document.documentElement;
        var scrollTop = window.scrollY || doc.scrollTop;
        var scrollable = doc.scrollHeight - doc.clientHeight;
        var progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
        bar.style.width = progress + "%";
        btn.classList.toggle("visible", scrollTop > window.innerHeight);
        ticking = false;
    }

    window.addEventListener(
        "scroll",
        function () {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        },
        { passive: true }
    );

    btn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    update();

    /* 阅读位置记忆：按文章路径存取滚动位置，再次打开自动回到上次位置。
       URL 带锚点时跳过，让浏览器原生锚点跳转优先。 */
    if (document.body.classList.contains("article-page") && !location.hash) {
        var posKey = "reading-pos:" + location.pathname;

        try {
            // 关闭浏览器默认恢复，避免与手动恢复叠加错位
            if ("scrollRestoration" in history) {
                history.scrollRestoration = "manual";
            }
            var saved = parseInt(localStorage.getItem(posKey), 10);
            if (!isNaN(saved) && saved > 200) {
                // 等 load 后再恢复，减少图片陆续加载造成的位移
                window.addEventListener("load", function () {
                    window.scrollTo(0, saved);
                });
            }
        } catch (e) {
            // localStorage 不可用（隐私模式等）时静默降级
        }

        var saving = false;
        function savePosition() {
            try {
                localStorage.setItem(
                    posKey,
                    String(window.scrollY || document.documentElement.scrollTop)
                );
            } catch (e) {}
            saving = false;
        }
        window.addEventListener(
            "scroll",
            function () {
                if (!saving) {
                    saving = true;
                    requestAnimationFrame(savePosition);
                }
            },
            { passive: true }
        );
        window.addEventListener("beforeunload", savePosition);
    }
})();
