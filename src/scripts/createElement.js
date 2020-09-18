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
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  deletions = [];
  wipRoot = null;
};

const commitWork = (currentUnitOfWork) => {
  if (!currentUnitOfWork) {
    return;
  }

  const { operation } = currentUnitOfWork;
  if (operation === "DELETE") {
    currentUnitOfWork.parent.dom.removeChild(currentUnitOfWork.dom);
  } else if (operation === "INSERT") {
    const parent = currentUnitOfWork.parent.dom;
    parent.appendChild(currentUnitOfWork.dom);
  } else if (operation === "UPDATE") {
    // TODO: update current element with new props
  } else {
    throw `Operation ${operation} is not supported`;
  }

  commitWork(currentUnitOfWork.child);
  commitWork(currentUnitOfWork.sibling);
};

let wipRoot = null;
let currentRoot = null;
let deletions = null;
const render = (element, renderTarget) => {
  wipRoot = {
    dom: renderTarget,
    children: [element],
    prev: currentRoot,
  };

  deletions = [];
  nextUnitOfWork = wipRoot;
};

const reconcileChild = (wipUnitOfWork, children) => {
  let index = 0;
  let prevSibling = null;
  let oldUnitOfWork = wipUnitOfWork.prev && wipUnitOfWork.prev.child;
  while (index < children.length || oldUnitOfWork !== null) {
    const child = children[index];

    const sameType =
      oldUnitOfWork && child && child.type === oldUnitOfWork.type;

    let newUnitOfWork = null;

    if (sameType) {
      newUnitOfWork = {
        ...oldUnitOfWork,
        props: child.props,
        children: child.children,
        prev: oldUnitOfWork,
        operation: "UPDATE",
        parent: wipUnitOfWork,
      };
    }
    if (child && !sameType) {
      newUnitOfWork = {
        ...child,
        parent: wipUnitOfWork,
        dom: null,
        prev: null,
        operation: "INSERT",
      };
    }
    if (oldUnitOfWork && !sameType) {
      oldUnitOfWork.operation = "DELETE";
      deletions.push(oldUnitOfWork);
    }

    if (index === 0) {
      wipUnitOfWork.child = newUnitOfWork;
    } else {
      prevSibling.sibling = newUnitOfWork;
    }

    prevSibling = newUnitOfWork;
    index++;
  }
};

const performUnitOfWork = (currentUnitOfWork) => {
  if (!currentUnitOfWork.dom) {
    currentUnitOfWork.dom = createDom(currentUnitOfWork);
  }

  const children = currentUnitOfWork.children;
  reconcileChild(currentUnitOfWork, children);

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
