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

  const renderTimeZoneList = async () => {
    const main = document.getElementById("main");
    const children = Array.prototype.slice.call(main.childNodes);
    for (const child of children) {
      main.removeChild(child);
    }
    const zones = await db.getItem("zones", []);
    const zoneList = refreshTimeZoneList(zones, window.moment.utc());
    render(zoneList, main);
  };

  const addTimeZoneButton = document.getElementById("addTimeZone");
  const displayPicker = () => {
    const tzPicker = createPicker(window.moment);
    globalThis.addEventListener("zoneSelected", async ({ zoneInfo }) => {
      const knownZones = await db.getItem("zones", []);

      if (knownZones.find((tz) => tz.name === zoneInfo.name)) {
        return;
      }

      await db.setItem("zones", knownZones.concat([zoneInfo]));

      await renderTimeZoneList();

      removePicker();
    });

    render(tzPicker, document.querySelector("header"));
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

  await renderTimeZoneList();

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

  globalThis.addEventListener(TimeZoneRefreshEvent.eventId, renderTimeZoneList);

  globalThis.dispatchEvent(new StartTimeUpdateEvent());

  // this method is mostly a hack until we have a more "props-esq" way
  // of cascading the values down.
  globalThis.addEventListener(TimeUpdatedEvent.eventId, async (e) => {
    const zones = await db.getItem("zones", []);

    const zoneGroups = zones.reduce((groups, info) => {
      if (!groups[info.offsetHours]) {
        groups[info.offsetHours] = [];
      }

      groups[info.offsetHours].push(info);

      return groups;
    }, {});

    let i = 1;
    const zoneKeys = Object.keys(zoneGroups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1));
    for (const zoneKey of zoneKeys) {
      const zone = zoneGroups[zoneKey];
      const hour = document.querySelector(
        `.timezone-container:nth-child(${i}) h1 span:nth-child(1)`
      );
      const minute = document.querySelector(
        `.timezone-container:nth-child(${i}) h1 span:nth-child(3)`
      );

      const now = e.now.utc().tz(zone[0].name);

      hour.innerHTML = now.format("HH");
      minute.innerHTML = now.format("mm");

      const time = document.querySelector(
        `.timezone-container:nth-child(${i}) h1 time`
      );
      time.setAttribute("datetime", now.format());
      i++;
    }
  });
})();
