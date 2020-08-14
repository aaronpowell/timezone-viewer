"use strict";
import { formatTimeZone } from "./utils.js";

const createPicker = (moment, document) => {
  const zoneNames = moment.tz.names();
  const zoneInfos = zoneNames.map((name) => moment.tz.zone(name));

  const select = document.createElement("select");

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
    .sort((a, b) => (a.offset > b.offset ? 1 : -1))
    .reduce((groups, info) => {
      if (!groups[info.offset]) {
        groups[info.offset] = [];
      }

      groups[info.offset].push(info);

      return groups;
    }, {});

  Object.keys(groups).map((groupKey) => {
    const optGroup = document.createElement("optgroup");
    const group = groups[groupKey];
    optGroup.setAttribute(
      "label",
      `UTC ${formatTimeZone(group[0].offsetHours)}`
    );
    group
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .map((info) => {
        const option = document.createElement("option");
        option.dataset.zoneInfo = JSON.stringify(info);
        option.innerHTML = info.name;

        if (info.name === guess) {
          option.selected = true;
        }

        optGroup.appendChild(option);
      });
    select.appendChild(optGroup);
  });

  select.addEventListener("change", ({ target }) => {
    select.dispatchEvent(
      new ZoneSelectEvent(
        JSON.parse(target.selectedOptions[0].dataset.zoneInfo)
      )
    );
  });

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
