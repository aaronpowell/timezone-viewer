(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const db = await import("./db.js");
  const { refreshTimeZoneList, TimeZoneRefreshEvent } = await import(
    "./timezones-display.js"
  );
  const {
    TimeUpdatedEvent,
    StopTimeUpdateEvent,
    StartTimeUpdateEvent,
  } = await import("./customEvents.js");

  const { render } = await import("./createElement.js");

  const addTimeZoneButton = document.getElementById("addTimeZone");
  const displayPicker = () => {
    const tzPicker = createPicker(window.moment, document);
    tzPicker.addEventListener("zoneSelected", async ({ zoneInfo }) => {
      const knownZones = await db.getItem("zones", []);

      if (knownZones.find((tz) => tz.name === zoneInfo.name)) {
        return;
      }

      await db.setItem("zones", knownZones.concat([zoneInfo]));

      const zones = await db.getItem("zones", []);

      const zoneList = refreshTimeZoneList(zones, window.moment.utc());

      render(zoneList, document.getElementById("main"));

      removePicker();
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

  const zones = await db.getItem("zones", []);
  const zoneList = refreshTimeZoneList(zones, window.moment.utc());

  render(zoneList, document.getElementById("main"));

  const startTime = () =>
    setInterval(() => {
      let time = window.moment(Date.now());

      if (customHour !== -1) {
        time.set("hour", customHour);
      }

      if (customMinutes !== -1) {
        time.set("minute", customMinutes);
      }

      globalThis.dispatchEvent(new TimeUpdatedEvent(time));
    }, 1000);

  let intervalId;
  let customHour = -1;
  let customMinutes = -1;

  globalThis.addEventListener(StopTimeUpdateEvent.eventId, () => {
    clearInterval(intervalId);
  });

  globalThis.addEventListener(
    StartTimeUpdateEvent.eventId,
    ({ changedMinute, changedHour }) => {
      customHour = changedHour;
      customMinutes = changedMinute;
      intervalId = startTime();
    }
  );

  globalThis.addEventListener(TimeZoneRefreshEvent.eventId, async () => {
    const zones = await db.getItem("zones", []);
    const zoneList = refreshTimeZoneList(zones, window.moment.utc());

    render(zoneList, document.getElementById("main"));
  });

  globalThis.dispatchEvent(new StartTimeUpdateEvent());
})();
