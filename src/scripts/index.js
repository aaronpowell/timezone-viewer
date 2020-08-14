(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const { formatTimeZone } = await import("./utils.js");
  const db = await import("./db.js");

  const displayTimeZone = (zoneInfo) => {
    const p = document.createElement("p");
    p.innerHTML = `${zoneInfo.name} - UTC ${formatTimeZone(
      zoneInfo.offsetHours
    )}`;

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
