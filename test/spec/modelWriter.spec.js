describe('obModelWriter', function () {
  var obModelWriter, scope, captureFunctionArgs, obBinderTypes, $timeout, binder, obSyncEvents;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function (_obModelWriter_, _obBinderTypes_, $rootScope, $captureFuncArgs, _$timeout_, _obSyncEvents_) {
    obSyncEvents = _obSyncEvents_;
    obModelWriter = _obModelWriter_;
    scope = $rootScope;
    captureFunctionArgs = $captureFuncArgs;
    obBinderTypes = _obBinderTypes_;
    $timeout = _$timeout_;
    binder = {
      scope: scope,
      model: 'myModel',

    }
  }));


  describe('processChanges', function () {
    it('should exist', function () {
      expect(typeof obModelWriter.processChanges).toBe('function');
    });


    it('should accept an array of changes from the protocol', function () {
      var args = captureFunctionArgs(obModelWriter.processChanges);
      expect(args[0]).toBe('binder');
      expect(args[1]).toBe('delta');
      expect(args[2]).toBeUndefined();
    });


    it('should execute changes in order', function () {
      scope.myModel = [];
      binder.type = obBinderTypes.COLLECTION;
      obModelWriter.processChanges(binder, {changes: [{
        added: ['foo'],
        index: 0,
      }]});

      expect(scope.myModel).toEqual(['foo']);

      obModelWriter.processChanges(binder, {changes: [{
        index: 1,

        added: ['bar']
      }]});

      expect(scope.myModel).toEqual(['foo', 'bar']);

      obModelWriter.processChanges(binder, {changes: [{
        removed: ['foo'],
        index: 0
      }]});

      expect(scope.myModel).toEqual(['bar']);

      obModelWriter.processChanges(binder, {changes: [{
        removed: ['bar'],
        index: 0,
        added: [{foo: 'barrrr'}]
      }]});

      expect(scope.myModel).toEqual([{foo: 'barrrr'}]);
    });
  });
})