describe('SyncEvents', function () {
  var syncEvents;
  beforeEach(module('Binder'))
  beforeEach(inject(function (_syncEvents_) {
    syncEvents = _syncEvents_;
  }));

  it('should have a dictionary of event constants', function () {
    expect(syncEvents.READ).toBeDefined();
    expect(syncEvents.NONE).toBeDefined();
  });
});