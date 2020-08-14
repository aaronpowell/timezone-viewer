(async () => {
  "use strict";

  const { createPicker } = await import("./timezone-picker.js");

  createPicker(window.moment, document);
})();
