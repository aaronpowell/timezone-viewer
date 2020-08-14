"use strict";
const formatTimeZone = (offsetHours) => {
  const hours = Math.floor(offsetHours);
  const minutePercent = offsetHours - hours;
  const minutes = 60 * minutePercent;

  return `${offsetHours > 0 ? "+" : ""} ${hours} hour${
    hours > 2 || hours < -2 || hours === 0 ? "s" : ""
  }${minutes === 0 ? "" : ` ${minutes} mins`}`;
};

export { formatTimeZone };
