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
  const displayPicker = () => {
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
    addTimeZoneButton.removeEventListener("click", displayPicker);
    addTimeZoneButton.addEventListener("click", removePicker);
    addTimeZoneButton.innerHTML = "Remove Timezone Picker";
  };
  const removePicker = () => {
    const tzPicker = document.getElementById("timezone-picker");
    tzPicker.parentElement.removeChild(tzPicker);
    addTimeZoneButton.removeEventListener("click", removePicker);
    addTimeZoneButton.addEventListener("click", displayPicker);
    addTimeZoneButton.innerHTML = "Add a timezone";
  };
  addTimeZoneButton.addEventListener("click", displayPicker);

  await refreshTimeZoneListToDOM();

  setInterval(() => {
    window.dispatchEvent(new TimeUpdatedEvent(Date.now()));
  }, 1000);
})();
