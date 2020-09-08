import { formatTimeZone, shallowEqual } from "./utils.js";
import * as db from "./db.js";
import {
  StartTimeUpdateEvent,
  StopTimeUpdateEvent,
  TimeUpdatedEvent,
} from "./customEvents.js";
import "https://cdn.jsdelivr.net/gh/vanillawc/wc-blink@1/index.js";

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

  const timeZoneWrapper = document.createElement("section");
  timeZoneWrapper.classList.add("timezone-wrapper");

  const timeContainer = document.createElement("h1");
  const time = document.createElement("time");
  const now = moment.utc().tz(zoneGroup[0].name);
  const h = document.createElement("span");
  h.setAttribute("contenteditable", true);
  h.innerHTML = now.format("HH");
  time.appendChild(h);
  const separator = document.createElement("wc-blink");
  separator.innerHTML = ":";
  time.appendChild(separator);
  const m = document.createElement("span");
  m.setAttribute("contenteditable", true);
  m.innerHTML = now.format("mm");
  time.appendChild(m);
  time.setAttribute("datetime", now.format());
  [h, m].forEach((e) =>
    e.addEventListener("focus", () => {
      globalThis.dispatchEvent(new StopTimeUpdateEvent());
    })
  );
  let changedHour = false;
  let changedMinute = false;
  h.addEventListener("input", () => (changedHour = true));
  m.addEventListener("input", () => (changedMinute = true));
  [h, m].forEach((e) =>
    e.addEventListener("blur", () => {
      globalThis.dispatchEvent(
        new StartTimeUpdateEvent(
          changedHour ? parseInt(h.innerHTML, 10) : -1,
          changedMinute ? parseInt(m.innerHTML, 10) : -1
        )
      );
    })
  );
  timeContainer.appendChild(time);
  timeZoneWrapper.appendChild(timeContainer);
  timeZoneContainer.appendChild(timeZoneWrapper);

  globalThis.addEventListener(TimeUpdatedEvent.eventId, (e) => {
    const now = moment(e.now).utc().tz(zoneGroup[0].name);
    h.innerHTML = now.format("HH");
    m.innerHTML = now.format("mm");
    time.setAttribute("datetime", now.format());
  });

  const dateContainer = document.createElement("h2");
  const dateElement = document.createElement("time");
  dateElement.innerHTML = now.format("Do MMM");
  dateElement.setAttribute("time", now.format());
  dateContainer.appendChild(dateElement);
  timeZoneWrapper.appendChild(dateContainer);

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
      globalThis.dispatchEvent(new TimeZoneRefreshEvent());
    });

    zoneInfoContainer.appendChild(clear);
    timeZoneWrapper.appendChild(zoneInfoContainer);
  }

  const timeZoneOffset = document.createElement("div");
  timeZoneOffset.innerHTML = formatTimeZone(offset);
  timeZoneWrapper.appendChild(timeZoneOffset);

  return timeZoneContainer;
};

class TimeZoneRefreshEvent extends Event {
  static get eventId() {
    return "timeZoneRefresh";
  }
  constructor() {
    super(TimeZoneRefreshEvent.eventId);
  }
}

export { refreshTimeZoneList, TimeZoneRefreshEvent };
