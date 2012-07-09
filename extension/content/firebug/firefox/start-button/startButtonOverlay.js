/* See license.txt for terms of usage */

define([
    "firebug/lib/object",
    "firebug/firebug",
    "firebug/chrome/firefox",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/dom",
    "firebug/lib/options"
],
function(Obj, Firebug, Firefox, Locale, Events, Dom, Options) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

// ********************************************************************************************* //
// Module Implementation

/**
 * @module StartButton module represents the UI entry point to Firebug. This "start buttton"
 * formerly known as "the status bar icon" is automatically appended into Firefox toolbar
 * (since Firefox 4).
 *
 * Start button is associated with a menu (fbStatusContextMenu) that contains basic actions
 * such as panel activation and also indicates whether Firebug is activated/deactivated for
 * the current page (by changing its color).
 */
Firebug.StartButton = Obj.extend(Firebug.Module,
/** @lends Firebug.StartButton */
{
    dispatchName: "startButton",

    initializeUI: function()
    {
        Firebug.Module.initializeUI.apply(this, arguments);

        if (FBTrace.DBG_INITIALIZE)
            FBTrace.sysout("StartButton.initializeUI;");
    },

    shutdown: function()
    {
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tooltip

    onTooltipShowing: function(event)
    {
        var tooltip = event.target;
        Dom.eraseNode(tooltip);

        with (Firebug.GlobalUI)
        {
            tooltip.appendChild($label({
                "class": "version",
                value: "Firebug " + Firebug.getVersion()
            }));

            var status = $el("hbox");
            tooltip.appendChild(status);

            var suspended = Firebug.getSuspended();
            status.appendChild($label({
                "class": "status",
                value: suspended ? Locale.$STR("startbutton.tip.deactivated") :
                    Locale.$STRP("plural.Total_Firebugs2", [Firebug.TabWatcher.contexts.length])
            }));

            if (suspended)
                return;

            status.appendChild($label({
                "class": "placement",
                value: "(" + Locale.$STR(Firebug.getPlacement()) + ")"
            }));

            if (Firebug.allPagesActivation == "on")
            {
                tooltip.appendChild($label({
                    "class": "alwaysOn",
                    value: Locale.$STR("enablement.on") + " " +
                        Locale.$STR("enablement.for all pages")
                }));
            }

            // Panel enablement status info
            tooltip.appendChild($label({
                "class": "enablement",
                value: "Panel enablement status:"
            }));

            var statuses = this.getEnablementStatus();
            for (var i=0; i<statuses.length; i++)
            {
                var status = statuses[i];
                var parent = $el("hbox");
                tooltip.appendChild(parent);

                parent.appendChild($label({
                    "class": "panelName " + status.status,
                    value: status.name + ":"
                }));

                parent.appendChild($label({
                    "class": "panelStatus " + status.status,
                    value: status.statusLabel
                }));
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Error count

    showCount: function(errorCount)
    {
        var firebugButton = Firefox.getElementById("firebug-button");
        if (errorCount && Firebug.showErrorCount)
        {
            if (firebugButton)
            {
                firebugButton.setAttribute("showErrors", "true");
                firebugButton.setAttribute("errorCount", errorCount);
            }
        }
        else
        {
            if (firebugButton)
            {
                firebugButton.removeAttribute("showErrors");

                // Use '0', so the horizontal space for the number is still allocated.
                // The button will cause re-layout if there are more than 9 errors.
                firebugButton.setAttribute("errorCount", "0");
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tooltip

    resetTooltip: function()
    {
        var firebugStatus = Firefox.getElementById("firebugStatus");
        if (!firebugStatus)
            return;

        // The start button is colorful only if there is a context
        var active = Firebug.currentContext ? "true" : "false";
        firebugStatus.setAttribute("firebugActive", active);

        if (FBTrace.DBG_TOOLTIP)
            FBTrace.sysout("StartButton.resetTooltip; called: firebug active: " + active);
    },

    getEnablementStatus: function()
    {
        var firebugStatus = Firefox.getElementById("firebugStatus");
        if (!firebugStatus)
            return;

        var panels = Firebug.getActivablePanelTypes();
        var statuses = [];

        var strOn = Locale.$STR("enablement.on");
        var strOff = Locale.$STR("enablement.off");

        for (var i=0; i<panels.length; ++i)
        {
            var panelName = panels[i].prototype.name;
            var status = firebugStatus.getAttribute(panelName);
            var statusLabel = (status == "on") ? strOn : strOff;

            statuses.push({
                name: Firebug.getPanelTitle(panels[i]),
                status: status,
                statusLabel: statusLabel
            });
        }

        return statuses;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Activation

    getSuspended: function()
    {
        var suspendMarker = Firefox.getElementById("firebugStatus");
        if (suspendMarker && suspendMarker.hasAttribute("suspended"))
            return suspendMarker.getAttribute("suspended");

        return null;
    },

    setSuspended: function(value)
    {
        var suspendMarker = Firefox.getElementById("firebugStatus");

        if (FBTrace.DBG_ACTIVATION)
            FBTrace.sysout("StartButton.setSuspended; to " + value + ". Browser: " +
                Firebug.chrome.window.document.title);

        if (value == "suspended")
            suspendMarker.setAttribute("suspended", value);
        else
            suspendMarker.removeAttribute("suspended");

        this.resetTooltip();
    }
});

// ********************************************************************************************* //
// Registration

Firebug.registerModule(Firebug.StartButton);

// ********************************************************************************************* //

return Firebug.StartButton;
});
