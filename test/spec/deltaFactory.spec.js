describe('Delta Factory', function () {
  var obDelta, sampleChange, sampleDelta, obSyncEvents, captureFuncArgs;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function (_obDelta_, _obSyncEvents_, $captureFuncArgs) {
    captureFuncArgs = $captureFuncArgs;
    obSyncEvents = _obSyncEvents_;
    obDelta = _obDelta_;
    sampleDelta = obDelta();
    sampleChange = {
      type: obSyncEvents.NEW,
      object: ['foo'],
      name: '0'
    };
  }));


  it('should return a basic delta object if no arguments are passed', function () {
    expect(Array.isArray(sampleDelta.changes)).toBe(true);
  });


  it('should accept a single change in the constructor', function () {
    expect(captureFuncArgs(obDelta)[0]).toBe('change');
    var delta = obDelta(sampleChange);
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


  describe('.updateObject()', function () {
    it('should update the object for all changes in the delta', function () {
      sampleDelta.addChange(sampleChange);
      sampleDelta.addChange(angular.copy(sampleChange));

      expect(sampleDelta.changes[0].object).toEqual(['foo']);
      expect(sampleDelta.changes[1].object).toEqual(['foo']);

      sampleDelta.updateObject(['bar']);

      expect(sampleDelta.changes[0].object).toEqual(['bar']);
      expect(sampleDelta.changes[1].object).toEqual(['bar']);
    });
  })
});
