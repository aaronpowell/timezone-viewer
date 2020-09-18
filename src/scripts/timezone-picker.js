"use strict";
import { formatTimeZone } from "./utils.js";
import { createElement } from "./createElement.js";

const createPicker = (moment) => {
  const zoneNames = moment.tz.names();
  const zoneInfos = zoneNames.map((name) => moment.tz.zone(name));

  const guess = moment.tz.guess();

  const groups = zoneInfos
    .map((info) => {
      const offset = info.utcOffset(moment());
      const offsetHours = (offset / 60) * -1;

      return {
        name: info.name,
        offset,
        offsetHours,
      };
    })
    .reduce((groups, info) => {
      if (!groups[info.offset]) {
        groups[info.offset] = [];
      }

      groups[info.offset].push(info);

      return groups;
    }, {});

  const select = createElement(
    "select",
    {
      id: "timezone-picker",
      onChange: ({ target }) => {
        globalThis.dispatchEvent(
          new ZoneSelectEvent(
            JSON.parse(target.selectedOptions[0].dataset.zoneInfo)
          )
        );
      },
    },
    ...Object.keys(groups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((groupKey) => {
        const group = groups[groupKey];
        const optGroup = createElement(
          "optgroup",
          {
            label: `UTC ${formatTimeZone(group[0].offsetHours)}`,
          },
          ...group
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map((info) => {
              const option = createElement(
                "option",
                {
                  "data-zone-info": JSON.stringify(info),
                  selected: info.name === guess,
                },
                info.name
              );
              return option;
            })
        );
        return optGroup;
      })
  );

  return select;
};

const zoneInfoPrivateFields = new WeakMap();
class ZoneSelectEvent extends Event {
  constructor(zoneInfo) {
    super("zoneSelected");
    zoneInfoPrivateFields.set(this, zoneInfo);
  }

  get zoneInfo() {
    return zoneInfoPrivateFields.get(this);
  }
}

export { createPicker, ZoneSelectEvent };
