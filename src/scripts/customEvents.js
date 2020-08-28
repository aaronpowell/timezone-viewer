const timeUpdatedEventProperties = new WeakMap();
class TimeUpdatedEvent extends Event {
  static get eventId() {
    return "timeUpdated";
  }
  constructor(now) {
    super(TimeUpdatedEvent.eventId);
    timeUpdatedEventProperties.set(this, now);
  }

  get now() {
    return timeUpdatedEventProperties.get(this);
  }
}

class StopTimeUpdateEvent extends Event {
  static get eventId() {
    return "stopTimeUpdate";
  }
  constructor() {
    super(StopTimeUpdateEvent.eventId);
  }
}

class StartTimeUpdateEvent extends Event {
  static get eventId() {
    return "startTimeUpdate";
  }
  constructor(changedHour, changedMinute) {
    super(StartTimeUpdateEvent.eventId);
    this._changedHour = changedHour;
    this._changedMinute = changedMinute;
  }

  get changedMinute() {
    return this._changedMinute;
  }

  get changedHour() {
    return this._changedHour;
  }
}

export { TimeUpdatedEvent, StopTimeUpdateEvent, StartTimeUpdateEvent };
