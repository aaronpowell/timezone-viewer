(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const { formatTimeZone, shallowEqual } = await import("./utils.js");
  const db = await import("./db.js");

  const refreshTimeZoneList = async () => {
    const main = document.getElementById("main");
    const children = Array.prototype.slice.call(main.childNodes);
    for (const child of children) {
      main.removeChild(child);
    }

    const zones = await db.getItem("zones", []);

    const zoneGroups = zones.reduce((groups, info) => {
      if (!groups[info.offsetHours]) {
        groups[info.offsetHours] = [];
      }

      groups[info.offsetHours].push(info);

      return groups;
    }, {});

    console.log(zoneGroups);

    Object.keys(zoneGroups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((key) => {
        const zoneGroup = zoneGroups[key];

        displayTimeZone(key, zoneGroup);
      });
  };

  const displayTimeZone = (offset, zoneGroup) => {
    const timeZoneContainer = document.createElement("div");
    timeZoneContainer.classList.add("timezone-container");

    for (const zoneInfo of zoneGroup) {
      const zoneInfoContainer = document.createElement("div");
      zoneInfoContainer.innerHTML = zoneInfo.name;

      const clear = document.createElement("span");
      clear.innerHTML = "❌";
      clear.classList.add("remove");
      clear.addEventListener("click", async () => {
        const knownZones = await db.getItem("zones");

        const index = knownZones.findIndex((tz) => shallowEqual(zoneInfo, tz));
        const newZones = knownZones
          .slice(0, index)
          .concat(knownZones.splice(index + 1));

        await db.setItem("zones", newZones);
        await refreshTimeZoneList();
      });

      zoneInfoContainer.appendChild(clear);
      timeZoneContainer.appendChild(zoneInfoContainer);
    }

    const timeZoneOffset = document.createElement("div");
    timeZoneOffset.innerHTML = formatTimeZone(offset);
    timeZoneContainer.appendChild(timeZoneOffset);

    document.getElementById("main").appendChild(timeZoneContainer);
  };

  const addTimeZoneButton = document.getElementById("addTimeZone");
  addTimeZoneButton.addEventListener("click", () => {
    const select = createPicker(window.moment, document);
    select.addEventListener("zoneSelected", async ({ zoneInfo }) => {
      const knownZones = await db.getItem("zones", []);

      if (knownZones.find((tz) => tz.name === zoneInfo.name)) {
        return;
      }

      await db.setItem("zones", knownZones.concat([zoneInfo]));

      await refreshTimeZoneList();

      const header = document.querySelector("header");
      header.removeChild(select);
    });

    document.querySelector("header").appendChild(select);
  });

  await refreshTimeZoneList();
})();
