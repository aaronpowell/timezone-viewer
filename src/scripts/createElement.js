const eventRegex = /^on/;

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
    type: "ELEMENT",
    tag,
    props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  };

  return descriptor;
};

const createDom = ({ type, tag, props }) => {
  const element =
    type === "TEXT" ? document.createTextNode("") : document.createElement(tag);

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

  return element;
};

const commitRoot = () => {
  commitWork(wipRoot.child);
  wipRoot = null;
};

const commitWork = (currentUnitOfWork) => {
  if (!currentUnitOfWork) {
    return;
  }

  const parent = currentUnitOfWork.parent.dom;
  parent.appendChild(currentUnitOfWork.dom);
  commitWork(currentUnitOfWork.child);
  commitWork(currentUnitOfWork.sibling);
};

let wipRoot = null;
const render = (element, renderTarget) => {
  wipRoot = {
    dom: renderTarget,
    children: [element],
  };

  nextUnitOfWork = wipRoot;
};

const performUnitOfWork = (currentUnitOfWork) => {
  if (!currentUnitOfWork.dom) {
    currentUnitOfWork.dom = createDom(currentUnitOfWork);
  }

  const children = currentUnitOfWork.children;
  let index = 0;
  let prevSibling = null;
  while (index < children.length) {
    const child = children[index];
    const uow = {
      ...child,
      parent: currentUnitOfWork,
      dom: null,
    };

    if (index === 0) {
      currentUnitOfWork.child = uow;
    } else {
      prevSibling.sibling = uow;
    }

    prevSibling = uow;
    index++;
  }

  if (currentUnitOfWork.child) {
    return currentUnitOfWork.child;
  }

  let nextUnitOfWork = currentUnitOfWork;
  while (nextUnitOfWork) {
    if (nextUnitOfWork.sibling) {
      return nextUnitOfWork.sibling;
    }
    nextUnitOfWork = nextUnitOfWork.parent;
  }
};

let nextUnitOfWork = null;
const workLoop = (deadline) => {
  let shouldStopWork = false;
  while (nextUnitOfWork && !shouldStopWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldStopWork = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
};
requestIdleCallback(workLoop);

export { render, createElement };
