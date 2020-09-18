const eventRegex = /^on/;

const render = (descriptor, renderTarget) => {
  const { type } = descriptor;

  let element;

  if (type === "TEXT") {
    element = document.createTextNode(descriptor.children);
    renderTarget.appendChild(element);
  } else if (type === "NOOP") {
    for (const child of descriptor.children) {
      render(child, renderTarget);
    }
  } else {
    element = document.createElement(descriptor.tag);

    const { properties, children } = descriptor;

    if (properties) {
      const keys = Object.keys(properties).filter(
        (key) => !key.startsWith("on")
      );

      for (const key of keys) {
        if (key === "className") {
          element.className = properties[key];
        } else if (typeof properties[key] === "boolean") {
          element[key] = properties[key];
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

    for (const child of children) {
      render(child, element);
    }
    renderTarget.appendChild(element);
  }
};

const createElement = (tag, properties, ...children) => {
  const descriptor = {
    type: tag === "" ? "NOOP" : "ELEMENT",
    tag: tag,
    properties,
    children: children.map((child) =>
      typeof child === "object" ? child : { type: "TEXT", children: child }
    ),
  };

  return descriptor;
};

export { render, createElement };
