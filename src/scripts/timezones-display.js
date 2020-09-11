import { formatTimeZone, shallowEqual } from "./utils.js";
import * as db from "./db.js";
import {
  StartTimeUpdateEvent,
  StopTimeUpdateEvent,
  TimeUpdatedEvent,
} from "./customEvents.js";

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

const makeTime = (moment, zoneGroup, now) => {
  const timeContainer = document.createElement("h1");
  const time = document.createElement("time");
  timeContainer.appendChild(time);

  const hours = document.createElement("span");
  hours.setAttribute("contenteditable", true);
  hours.innerHTML = now.format("HH");
  time.appendChild(hours);

  const separator = document.createElement("span");
  separator.classList.add("blink");
  separator.innerHTML = ":";
  time.appendChild(separator);

  const minutes = document.createElement("span");
  minutes.setAttribute("contenteditable", true);
  minutes.innerHTML = now.format("mm");
  time.appendChild(minutes);
  time.setAttribute("datetime", now.format());

  [hours, minutes].forEach((e) =>
    e.addEventListener("focus", () => {
      globalThis.dispatchEvent(new StopTimeUpdateEvent());
    })
  );

  let changedHour = false;
  let changedMinute = false;
  hours.addEventListener("input", () => (changedHour = true));
  minutes.addEventListener("input", () => (changedMinute = true));
  [hours, minutes].forEach((e) =>
    e.addEventListener("blur", () => {
      globalThis.dispatchEvent(
        new StartTimeUpdateEvent(
          changedHour ? parseInt(hours.innerHTML, 10) : -1,
          changedMinute ? parseInt(minutes.innerHTML, 10) : -1
        )
      );
    })
  );

  globalThis.addEventListener(TimeUpdatedEvent.eventId, (e) => {
    const now = moment(e.now).utc().tz(zoneGroup.name);
    hours.innerHTML = now.format("HH");
    minutes.innerHTML = now.format("mm");
    time.setAttribute("datetime", now.format());
  });
  return timeContainer;
};

const makeDate = (now) => {
  const dateContainer = document.createElement("h2");
  const dateElement = document.createElement("time");
  dateElement.innerHTML = now.format("Do MMM");
  dateElement.setAttribute("time", now.format());
  dateContainer.appendChild(dateElement);

  return dateContainer;
};

const displayTimeZone = (offset, zoneGroup, moment) => {
  const timeZoneContainer = document.createElement("section");
  timeZoneContainer.classList.add("timezone-container");

  const timeZoneWrapper = document.createElement("section");
  timeZoneWrapper.classList.add("timezone-wrapper");

  const now = moment.utc().tz(zoneGroup[0].name);

  timeZoneWrapper.appendChild(makeTime(moment, zoneGroup[0], now));
  timeZoneContainer.appendChild(timeZoneWrapper);

  timeZoneWrapper.appendChild(makeDate(now));

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
