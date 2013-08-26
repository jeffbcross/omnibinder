describe('SyncEvents', function () {
  var obSyncEvents;
  beforeEach(module('OmniBinder'))
  beforeEach(inject(function (_obSyncEvents_) {
    obSyncEvents = _obSyncEvents_;
  }));

  it('should have a dictionary of event constants', function () {
    expect(obSyncEvents.READ).toBeDefined();
    expect(obSyncEvents.NONE).toBeDefined();
  });
});