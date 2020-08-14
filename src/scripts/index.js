(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");

  const addTimeZoneButton = document.getElementById("addTimeZone");
  addTimeZoneButton.addEventListener("click", () => {
    const select = createPicker(window.moment, document);
    select.addEventListener("zoneSelected", ({ zoneInfo }) => {
      const p = document.createElement("p");
      p.innerHTML = `${zoneInfo.name} - UTC ${
        zoneInfo.offsetHours > 0 ? "+" : ""
      }${zoneInfo.offsetHours}`;

      document.getElementById("main").appendChild(p);
    });

    document.getElementById("main").appendChild(select);
  });
})();
