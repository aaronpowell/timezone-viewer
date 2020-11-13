"use strict";

const storage = localStorage;

const setItem = (key, value) => {
  storage.setItem(key, JSON.stringify(value));
  return Promise.resolve();
};

const getItem = (key, defaultValue = undefined) => {
  const item = storage.getItem(key) || defaultValue;
  return new Promise((resolve) =>
    resolve(typeof item === typeof "" ? JSON.parse(item) : item)
  );
};

export { setItem, getItem };
