(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const { formatTimeZone, shallowEqual } = await import("./utils.js");
  const db = await import("./db.js");

  const displayTimeZone = (zoneInfo) => {
    const p = document.createElement("p");
    p.innerHTML = `${zoneInfo.name} - UTC ${formatTimeZone(
      zoneInfo.offsetHours
    )}`;

    const clear = document.createElement("span");
    clear.innerHTML = "❌";
    clear.addEventListener("click", async () => {
      const knownZones = await db.getItem("zones");

      const index = knownZones.findIndex((tz) => shallowEqual(zoneInfo, tz));
      const newZones = knownZones
        .slice(0, index)
        .concat(knownZones.splice(index + 1));

      await db.setItem("zones", newZones);
    });

    p.appendChild(clear);

    document.getElementById("main").appendChild(p);
  };

  const addTimeZoneButton = document.getElementById("addTimeZone");
  addTimeZoneButton.addEventListener("click", () => {
    const select = createPicker(window.moment, document);
    select.addEventListener("zoneSelected", async ({ zoneInfo }) => {
      displayTimeZone(zoneInfo);
      const knownZones = await db.getItem("zones", []);

      await db.setItem("zones", knownZones.concat([zoneInfo]));
    });

    document.getElementById("main").appendChild(select);
  });

  const knownZones = await db.getItem("zones", []);

  knownZones.map(displayTimeZone);
})();
