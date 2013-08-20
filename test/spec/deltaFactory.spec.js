describe('Delta Factory', function () {
  var deltaFactory, sampleChange, sampleDelta, syncEvents, captureFuncArgs;

  beforeEach(module('Binder'));
  beforeEach(inject(function (_deltaFactory_, _syncEvents_, $captureFuncArgs) {
    captureFuncArgs = $captureFuncArgs;
    syncEvents = _syncEvents_;
    deltaFactory = _deltaFactory_;
    sampleDelta = deltaFactory();
    sampleChange = {
      type: syncEvents.NEW,
      object: ['foo'],
      name: '0'
    };
  }));


  it('should return a basic delta object if no arguments are passed', function () {
    expect(Array.isArray(sampleDelta.changes)).toBe(true);
  });


  it('should accept a single change in the constructor', function () {
    expect(captureFuncArgs(deltaFactory)[0]).toBe('change');
    var delta = deltaFactory(sampleChange);
    expect(delta.changes[0]).toEqual(sampleChange);
  });


  describe('.addChange()', function () {
    it('should have an addChange method', function () {
      expect(typeof sampleDelta.addChange).toBe('function');
    });


    it('should add a change to the delta\'s changes array', function () {
      sampleDelta.addChange(sampleChange);
      expect(sampleDelta.changes[0]).toEqual(sampleChange);
    });


    it('should complain if the change object does not have a type property', function () {
      delete sampleChange.type;
      expect(function () {
        sampleDelta.addChange(sampleChange)
      }).toThrow(new Error('Change must contain a type'));
    });
  });
});
