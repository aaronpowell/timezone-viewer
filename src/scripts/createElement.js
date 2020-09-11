const eventRegex = /^on/;

const createElement = (tagType, properties, ...children) => {
  const element = document.createElement(tagType);

  if (properties) {
    const keys = Object.keys(properties).filter((key) => !key.startsWith("on"));

    for (const key of keys) {
      if (key === "className") {
        element.className = properties[key];
      } else {
        element.setAttribute(key.toLowerCase(), properties[key]);
      }
    }

    const events = Object.keys(properties).filter((key) =>
      eventRegex.test(key)
    );
    for (const event of events) {
      element.addEventListener(
        event.replace(eventRegex, "").toLowerCase(),
        properties[event]
      );
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
};

export { createElement };
