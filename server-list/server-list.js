$(document).ready(function () {
    createServerContainer();

    $("<style>")
        .prop("type", "text/css")
        .html(`
            #dashboard-panel-server-list a:hover {
                text-decoration: none !important;
                border-bottom: none !important;
            }
            #dashboard-panel-server-list-content {
                -ms-overflow-style: none; /* For Internet Explorer and Edge */
                scrollbar-width: none; /* For Firefox */
            }
            #dashboard-panel-server-list-content::-webkit-scrollbar {
                display: none; /* For Chrome, Safari, and Opera */
            }
        `)
        .appendTo("head");
});

function createServerContainer() {
    const $container = $(`
        <div id="dashboard-panel-server-list" class="scrollable-container flex-container flex-phone" style="gap: 5px; width: 100%;">
            <div class="scroll-left" style="display: none;padding:20px;max-width: 32px;margin-right: 10px;">
                <i class="fa-solid fa-chevron-left fa-lg color-4"></i>
            </div>
            <div id="dashboard-panel-server-list-content" class="flex-container flex-phone" style="flex: 1; gap: 5px; max-width: 100%; overflow-x: auto;"></div>
            <div class="scroll-right" style="display: none;padding:20px;max-width: 32px;margin-left: 10px;">
                <i class="fa-solid fa-chevron-right fa-lg color-4"></i>
            </div>
        </div>
    `);

    $("#dashboard-panel-description").append($container);

    const $content = $container.find("#dashboard-panel-server-list-content"); 
    const $leftArrow = $(".scroll-left", $container);
    const $rightArrow = $(".scroll-right", $container);

    $content.on("scroll", () => checkServerScroll($container));

    updateServerDashboard($container);
    setInterval(() => updateServerDashboard($container), 10000);

    // Scroll behavior on arrows
    $leftArrow.on("click", function () {
        $content.stop(true, true).animate({ scrollLeft: "-=100" }, 300);
    });

    $rightArrow.on("click", function () {
        $content.stop(true, true).animate({ scrollLeft: "+=100" }, 300);
    });

    $("#tuner-name").on("click", function () {
        setTimeout(checkServerScroll($container), 250);
    });
}

function checkServerScroll($container) {
    const $content = $("#dashboard-panel-server-list-content", $container);
    const $leftArrow = $(".scroll-left", $container);
    const $rightArrow = $(".scroll-right", $container);

    // Use jQuery's data() to store state on the container
    const hasShownArrows = $container.data("has-shown-arrows") || false;

    let scrollWidth = $content[0].scrollWidth;
    let clientWidth = $content[0].clientWidth;
    let scrollLeft = $content.scrollLeft();
    let maxScrollLeft = scrollWidth - clientWidth;

    if (scrollWidth > clientWidth) {
        // Mark that arrows have been shown
        $container.data("has-shown-arrows", true);

        $leftArrow
            .stop(true, true)
            .fadeIn(200)
            .css("pointer-events", scrollLeft > 0 ? "auto" : "none")
            .fadeTo(200, scrollLeft > 0 ? 1 : 0.2);

        $rightArrow
            .stop(true, true)
            .fadeIn(200)
            .css("pointer-events", scrollLeft < maxScrollLeft ? "auto" : "none")
            .fadeTo(200, scrollLeft < maxScrollLeft ? 1 : 0.2);
    } else if (!hasShownArrows && clientWidth != 0) {
        console.log("No scroll possible, hiding arrows...");
        $leftArrow.stop(true, true).fadeOut(200);
        $rightArrow.stop(true, true).fadeOut(200);
    } else {
        // Do nothing — arrows were shown once before, so leave them
    }
}


function createServerButton(server) {
    const signal = server.signal?.toFixed?.(1) ?? "N/A";
    const station = server.rdsPs ?? "N/A";
    const frequency = server.frequency ?? "N/A";
    const displayName = server.name || "Unnamed Server";

    return $(`
        <a href="${server.redirectUrl}" target="_blank" data-api="${server.api}" style="text-decoration: none;">
            <button class="no-bg color-4 hover-brighten flex-container flex-center" style="padding: 5px; width: 250px; min-width: 275px;">
                <span>
                    <i class="fa-solid fa-radio fa-lg" style="margin: 5px;margin-right: 10px;"></i><br>
                </span>
                <span style="width: 100%">
                    <span style="margin: 6px;">${displayName}</span><br>
                    <span style="font-size: 10px; color: var(--color-text);">${signal} dBf</span> • 
                    <span style="font-size: 10px; color: var(--color-text); display: inline-block; min-width: 50px;">${station}</span> • 
                    <span style="font-size: 10px; color: var(--color-text);">${frequency}</span>
                </span>
            </button>
        </a>
    `);
}

function createErrorButton(server) {
    return $(`
        <a href="${server.redirectUrl}" target="_blank" data-api="${server.api}" style="text-decoration: none;">
            <button class="no-bg color-4 hover-brighten flex-container flex-center" style="padding: 5px; width: 250px; min-width: 275px;">
                <span>
                    <i class="fa-solid fa-triangle-exclamation fa-lg" style="margin: 5px;margin-right: 10px;"></i><br>
                </span>
                <span style="width: 100%;">
                    <span style="margin: 6px;">${server.name || "Server Unreachable"}</span><br>
                    <span style="font-size: 10px; color: var(--color-text);">${server.message || "Error"}</span>
                </span>
            </button>
        </a>
    `);
}

function updateServerDashboard($container) {
    const $content = $("#dashboard-panel-server-list-content", $container);

    $.getJSON('/server-list/get', function (servers) {
        servers.forEach(server => {
            const existing = $content.find(`[data-api="${server.api}"]`);
            const $button = server.error ? createErrorButton(server) : createServerButton(server);

            if (existing.length) {
                existing.replaceWith($button);
            } else {
                $content.append($button);
            }
        });

        setTimeout(() => {
            checkServerScroll($container);
        }, 500);
    }).fail(function () {
        const $failNotice = $(`
            <div style="color: red; font-size: 14px;">Failed to load server list.</div>
        `);
        $content.empty().append($failNotice);
    });
}
