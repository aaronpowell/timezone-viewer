(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const db = await import("./db.js");
  const { refreshTimeZoneList } = await import("./timezones-display.js");
  const { TimeUpdatedEvent } = await import("./timeUpdatedEvent.js");

  const refreshTimeZoneListToDOM = refreshTimeZoneList.bind(
    null,
    document.getElementById("main"),
    window.moment
  );

  const addTimeZoneButton = document.getElementById("addTimeZone");
  addTimeZoneButton.addEventListener("click", () => {
    const tzPicker = createPicker(window.moment, document);
    tzPicker.addEventListener("zoneSelected", async ({ zoneInfo }) => {
      const knownZones = await db.getItem("zones", []);

      if (knownZones.find((tz) => tz.name === zoneInfo.name)) {
        return;
      }

      await db.setItem("zones", knownZones.concat([zoneInfo]));

      await refreshTimeZoneListToDOM();

      const header = document.querySelector("header");
      header.removeChild(tzPicker);
    });

    document.querySelector("header").appendChild(tzPicker);
  });

  await refreshTimeZoneListToDOM();

  setInterval(() => {
    window.dispatchEvent(new TimeUpdatedEvent(Date.now()));
  }, 1000);
})();
