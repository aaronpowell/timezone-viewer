import { formatTimeZone, shallowEqual } from "./utils.js";
import * as db from "./db.js";
import { StartTimeUpdateEvent, StopTimeUpdateEvent } from "./customEvents.js";
import { createElement } from "./createElement.js";

const refreshTimeZoneList = (zones, now) => {
  const zoneGroups = zones.reduce((groups, info) => {
    if (!groups[info.offsetHours]) {
      groups[info.offsetHours] = [];
    }

    groups[info.offsetHours].push(info);

    return groups;
  }, {});

  return createElement(
    "",
    null,
    ...Object.keys(zoneGroups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((key) => {
        const zoneGroup = zoneGroups[key];

        return displayTimeZone(key, zoneGroup, now);
      })
  );
};

const makeTime = (now) => {
  let changedHour = false;
  let changedMinute = false;

  const timeContainer = createElement(
    "h1",
    null,
    createElement(
      "time",
      { dateTime: now.format() },
      createElement(
        "span",
        {
          contentEditable: true,
          onFocus: () => globalThis.dispatchEvent(new StopTimeUpdateEvent()),
          onInput: () => (changedHour = true),
          onBlur: (e) =>
            globalThis.dispatchEvent(
              new StartTimeUpdateEvent(
                changedHour ? parseInt(e.target.innerHTML, 10) : -1,
                -1
              )
            ),
        },
        now.format("HH")
      ),
      createElement("span", { className: "blink" }, ":"),
      createElement(
        "span",
        {
          contentEditable: true,
          onFocus: () => globalThis.dispatchEvent(new StopTimeUpdateEvent()),
          onInput: () => (changedMinute = true),
          onBlur: (e) =>
            globalThis.dispatchEvent(
              new StartTimeUpdateEvent(
                -1,
                changedMinute ? parseInt(e.target.innerHTML, 10) : -1
              )
            ),
        },
        now.format("mm")
      )
    )
  );

  return timeContainer;
};

const makeDate = (now) => {
  const dateContainer = createElement(
    "h2",
    null,
    createElement("time", { time: now.format() }, now.format("Do MMM"))
  );

  return dateContainer;
};

const makeZoneInfo = (zoneInfo) => {
  const zoneInfoContainer = createElement(
    "div",
    { className: "timezone-info" },
    zoneInfo.name,
    createElement(
      "span",
      {
        className: "remove",
        onClick: async () => {
          const knownZones = await db.getItem("zones");

          const index = knownZones.findIndex((tz) =>
            shallowEqual(zoneInfo, tz)
          );
          const newZones = knownZones
            .slice(0, index)
            .concat(knownZones.splice(index + 1));

          await db.setItem("zones", newZones);
          globalThis.dispatchEvent(new TimeZoneRefreshEvent());
        },
      },
      "❌"
    )
  );
  return zoneInfoContainer;
};

const displayTimeZone = (offset, zoneGroup, utcNow) => {
  const now = utcNow.tz(zoneGroup[0].name);

  const timeZoneContainer = createElement(
    "section",
    {
      className: "timezone-container",
    },
    createElement(
      "section",
      {
        className: "timezone-wrapper",
      },
      makeTime(now),
      makeDate(now),
      ...zoneGroup.map(makeZoneInfo),
      createElement("div", null, formatTimeZone(offset))
    )
  );

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
