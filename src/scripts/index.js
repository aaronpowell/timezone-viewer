(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");
  const { formatTimeZone } = await import("./utils.js");

  const addTimeZoneButton = document.getElementById("addTimeZone");
  addTimeZoneButton.addEventListener("click", () => {
    const select = createPicker(window.moment, document);
    select.addEventListener("zoneSelected", ({ zoneInfo }) => {
      const p = document.createElement("p");
      p.innerHTML = `${zoneInfo.name} - UTC ${formatTimeZone(
        zoneInfo.offsetHours
      )}`;

      document.getElementById("main").appendChild(p);
    });

    document.getElementById("main").appendChild(select);
  });
})();
