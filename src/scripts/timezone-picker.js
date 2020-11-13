"use strict";
import { React } from "./global.js";
import { formatTimeZone } from "./utils.js";

const createPicker = ({ zoneInfos, guess, zoneSelected }) => {
  const groups = zoneInfos
    .map((info) => {
      const offset = info.rawOffsetInMinutes;
      const offsetHours = offset / 60;

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

  const select = React.createElement(
    "select",
    {
      id: "timezone-picker",
      onChange: ({ target }) => {
        zoneSelected(JSON.parse(target.selectedOptions[0].dataset.zoneInfo));
      },
    },
    ...Object.keys(groups)
      .map(Number)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((groupKey) => {
        const group = groups[groupKey];
        const optGroup = React.createElement(
          "optgroup",
          {
            label: `UTC ${formatTimeZone(group[0].offsetHours)}`,
          },
          ...group
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map((info) => {
              const option = React.createElement(
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
