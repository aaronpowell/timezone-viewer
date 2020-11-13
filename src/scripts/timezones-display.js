import * as db from "./db.js";
import { React } from "./global.js";
import { formatTimeZone, shallowEqual } from "./utils.js";

const TimeZoneList = ({ zones, now, startTime, stopTime }) => {
  const zoneGroups = zones.reduce((groups, info) => {
    if (!groups[info.offsetHours]) {
      groups[info.offsetHours] = [];
    }

    groups[info.offsetHours].push(info);

    return groups;
  }, {});

  return React.createElement(
    "div",
    {},
    ...Object.keys(zoneGroups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((offset) => {
        const zoneGroup = zoneGroups[offset];

        return React.createElement(TimeZone, {
          offset,
          zoneGroup,
          now,
          startTime,
          stopTime,
        });
      })
  );
};

const Time = ({ now, startTime, stopTime }) => {
  const [hour, setHour] = React.useState(now.toFormat("HH"));
  const [minute, setMinute] = React.useState(now.toFormat("mm"));

  React.useEffect(() => {
    setHour(now.toFormat("HH"));
    setMinute(now.toFormat("mm"));
  }, [now]);

  const timeContainer = React.createElement(
    "h1",
    {},
    React.createElement(
      "time",
      { dateTime: now.toString() },
      React.createElement("input", {
        type: "text",
        value: hour,
        onFocus: () => stopTime(),
        onChange: (e) => setHour(e.target.value),
        onBlur: () => {
          startTime(now.set({ hour, minute }));
        },
      }),
      React.createElement("span", { className: "blink" }, ":"),
      React.createElement("input", {
        type: "text",
        value: minute,
        onFocus: () => stopTime(),
        onChange: (e) => setMinute(e.target.value),
        onBlur: () => startTime(now.set({ hour, minute })),
      })
    )
  );

  return timeContainer;
};

const Date = ({ now }) => {
  const dateContainer = React.createElement(
    "h2",
    {},
    React.createElement(
      "time",
      { dateTime: now.toString() },
      now.toFormat("ccc, MMM d")
    )
  );

  return dateContainer;
};

const makeZoneInfo = (zoneInfo) => {
  const zoneInfoContainer = React.createElement(
    "div",
    { className: "timezone-info" },
    zoneInfo.name,
    React.createElement(
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

const TimeZone = ({ offset, zoneGroup, now, startTime, stopTime }) => {
  const localNow = now.setZone(zoneGroup[0].name);

  const timeZoneContainer = React.createElement(
    "section",
    {
      className: "timezone-container",
    },
    React.createElement(
      "section",
      {
        className: "timezone-wrapper",
      },
      React.createElement(Time, { now: localNow, startTime, stopTime }),
      React.createElement(Date, { now: localNow }),
      ...zoneGroup.map(makeZoneInfo),
      React.createElement("div", {}, formatTimeZone(offset))
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

export { TimeZoneRefreshEvent, TimeZoneList };
