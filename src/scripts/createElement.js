const eventRegex = /^on/;

const render = ({ type, tag, props, children }, renderTarget) => {
  let element;

  if (type === "NOOP") {
    for (const child of children) {
      render(child, renderTarget);
    }
  } else {
    element =
      type === "TEXT"
        ? document.createTextNode("")
        : document.createElement(tag);

    Object.keys(props)
      .filter((key) => !key.startsWith("on"))
      .forEach((key) => (element[key] = props[key]));

    Object.keys(props)
      .filter((key) => eventRegex.test(key))
      .forEach((event) =>
        element.addEventListener(
          event.replace(eventRegex, "").toLowerCase(),
          props[event]
        )
      );

    for (const child of children) {
      render(child, element);
    }
    renderTarget.appendChild(element);
  }
};

const createTextElement = (text) => {
  return {
    type: "TEXT",
    props: {
      nodeValue: text,
    },
    children: [],
  };
};

const createElement = (tag, props, ...children) => {
  const descriptor = {
    type: !tag ? "NOOP" : "ELEMENT",
    tag: tag,
    props: props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  };

  return descriptor;
};

export { render, createElement };
