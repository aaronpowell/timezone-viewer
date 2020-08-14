"use strict";
const createPicker = (moment, document) => {
  const zoneNames = moment.tz.names();
  const zoneInfos = zoneNames.map((name) => moment.tz.zone(name));

  const select = document.createElement("select");

  const guess = moment.tz.guess();

  const groups = zoneInfos
    .map((info) => {
      const offset = info.utcOffset(moment());

      return {
        name: info.name,
        offset,
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
    const offsetHours = (groupKey / 60) * -1;
    optGroup.setAttribute(
      "label",
      `UTC ${offsetHours > 0 ? "+" : ""}${offsetHours}`
    );
    const group = groups[groupKey];
    group
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .map((info) => {
        const option = document.createElement("option");
        option.innerHTML = `${info.name} (UTC ${
          offsetHours > 0 ? "+" : ""
        }${offsetHours})`;

        if (info.name === guess) {
          option.selected = true;
        }

        optGroup.appendChild(option);
      });
    select.appendChild(optGroup);
  });

  document.getElementById("main").appendChild(select);
};

export { createPicker };
