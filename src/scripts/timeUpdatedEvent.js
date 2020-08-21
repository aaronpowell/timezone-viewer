const timeUpdatedEventProperties = new WeakMap();
class TimeUpdatedEvent extends Event {
  constructor(now) {
    super("timeUpdated");
    timeUpdatedEventProperties.set(this, now);
  }

  get now() {
    return timeUpdatedEventProperties.get(this);
  }
}

export { TimeUpdatedEvent };
