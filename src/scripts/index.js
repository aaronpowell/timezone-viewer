(async () => {
  "use strict";

  const db = await import("./db.js");
  const { TimeZoneList } = await import("./timezones-display.js");
  const { React, ReactDOM, luxon } = await import("./global.js");
  const { Header } = await import("./header.js");
  const { useRecursiveTimeout } = await import("./hook-extensions.js");
  const zoneInfos = await fetch(
    "https://unpkg.com/@vvo/tzdb@6.3.0/raw-time-zones.json"
  ).then((res) => res.json());

  const App = () => {
    const [zones, setZones] = React.useState([]);
    const [now, setNow] = React.useState(luxon.DateTime.utc());
    const [running, setRunning] = React.useState(true);

    React.useEffect(() => {
      db.getItem("zones", []).then((zones) => setZones(() => zones));
    }, []);

    useRecursiveTimeout(
      () => {
        if (running) {
          setNow((now) => {
            return now.plus({ seconds: 1 });
          });
        }
      },
      1000,
      [running]
    );

    const header = React.createElement(Header, {
      zoneInfos,
      addZone: async (zoneInfo) => {
        const knownZones = await db.getItem("zones", []);

        if (knownZones.find((tz) => tz.name === zoneInfo.name)) {
          return;
        }

        await db.setItem("zones", knownZones.concat([zoneInfo]));

        db.getItem("zones", []).then((zones) => setZones(() => zones));
      },
    });
    const timeZoneList = React.createElement(TimeZoneList, {
      zones,
      now,
      stopTime: () => setRunning(false),
      startTime: (newNow) => {
        setNow(newNow.toUTC());
        setRunning(true);
      },
    });
    return React.createElement(React.Fragment, {}, header, timeZoneList);
  };

  ReactDOM.render(
    React.createElement(App, {}),
    document.getElementById("main")
  );
})();
