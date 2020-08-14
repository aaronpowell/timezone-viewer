"use strict";
const formatTimeZone = (offsetHours) => {
  const hours = Math.floor(offsetHours);
  const minutePercent = offsetHours - hours;
  const minutes = 60 * minutePercent;

  return `${offsetHours > 0 ? "+" : ""} ${hours} hour${
    hours > 2 || hours < -2 || hours === 0 ? "s" : ""
  }${minutes === 0 ? "" : ` ${minutes} mins`}`;
};

const shallowEqual = (left, right) => {
  // objects are the same, so bail early
  if (left === right) {
    return true;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  // objects have different number of keys
  // they are not the same object then
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  // create an array with keys that aren't in both objects
  if (
    leftKeys
      .filter((l) => !(rightKeys.indexOf(l) >= 0))
      .concat(rightKeys.filter((r) => !(leftKeys.indexOf(r) >= 0))).length
  ) {
    return false;
  }

  // Same keys, test for fields
  for (let key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
};

export { formatTimeZone, shallowEqual };
