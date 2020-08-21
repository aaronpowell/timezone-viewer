import { formatTimeZone, shallowEqual } from "./utils.js";
import * as db from "./db.js";

const refreshTimeZoneList = async (main, moment) => {
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

  Object.keys(zoneGroups)
    .map(Number)
    .sort((a, b) => (a > b ? 1 : -1))
    .map((key) => {
      const zoneGroup = zoneGroups[key];

      return displayTimeZone(key, zoneGroup, moment);
    })
    .forEach((el) => main.appendChild(el));
};

const displayTimeZone = (offset, zoneGroup, moment) => {
  const timeZoneContainer = document.createElement("section");
  timeZoneContainer.classList.add("timezone-container");

  const timeContainer = document.createElement("h1");
  const time = document.createElement("time");
  const now = moment.utc().tz(zoneGroup[0].name);
  time.innerHTML = now.format("HH:mm");
  time.setAttribute("datetime", now.format());
  timeContainer.appendChild(time);
  timeZoneContainer.appendChild(timeContainer);

  globalThis.addEventListener("timeUpdated", (e) => {
    const now = moment(e.now).utc().tz(zoneGroup[0].name);
    time.innerHTML = now.format("HH:mm");
    time.setAttribute("datetime", now.format());
  });

  for (const zoneInfo of zoneGroup) {
    const zoneInfoContainer = document.createElement("div");
    zoneInfoContainer.classList.add("timezone-info");
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

  return timeZoneContainer;
};

export { refreshTimeZoneList };
