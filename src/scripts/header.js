import { React } from "./global.js";
import { createPicker } from "./timezone-picker.js";

const Header = ({ zoneInfos, addZone }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  return React.createElement(
    "header",
    {},
    React.createElement(
      "button",
      {
        onClick: () => setShowPicker((current) => !current),
      },
      showPicker ? "Hide picker" : "Add a time zone"
    ),
    showPicker
      ? createPicker({
          zoneInfos,
          guess: Intl.DateTimeFormat().resolvedOptions().timeZone,
          zoneSelected: async (zoneInfo) => {
            setShowPicker(false);
            addZone(zoneInfo);
          },
        })
      : null
  );
};

export { Header };
