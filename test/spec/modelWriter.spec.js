describe('$modelWriter', function () {
  var modelWriter, scope, captureFunctionArgs, $binderTypes;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$modelWriter_, _$binderTypes_, $rootScope, $captureFuncArgs) {
    $modelWriter = _$modelWriter_;
    scope = $rootScope;
    captureFunctionArgs = $captureFuncArgs;
    $binderTypes = _$binderTypes_;
  }));

  describe('addedFromProtocol', function () {
    it('should exist', function () {
      expect(!!$modelWriter.addedFromProtocol).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs($modelWriter.addedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    });

    it('should add an item to a collection', function () {
      scope.model = ['foo'];
      $modelWriter.addedFromProtocol({
        scope: scope,
        model: 'model',
        type: $binderTypes.COLLECTION
      }, {
        data: 'bar'
      });

      expect(scope.model[1]).toEqual('bar');
    });

    it('should extend an existing object', function () {
      scope.model = {foo: 'bar'};
      $modelWriter.addedFromProtocol({
        scope: scope,
        model: 'model',
        type: $binderTypes.OBJECT
      }, {
        data: {foo: 'baz'}
      });

      expect(scope.model.foo).toEqual('baz');
    });
  });

  describe('removedFromProtocol', function () {
    it('should exist', function () {
      expect(!!$modelWriter.removedFromProtocol).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs($modelWriter.removedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    })
    
    it('should update the local model based on removal event from protocol', function () {
      scope.model = [{id: 1}, {id: 2}];
      $modelWriter.removedFromProtocol({
        scope: scope,
        model: 'model'
      }, {
        data: {id: 1}
      });

      expect(scope.model.length).toEqual(1);
      expect(scope.model[0].id).toEqual(2);
    });
  });

  describe('updatedFromProtocol', function () {
    it('should exist', function () {
      expect(!!$modelWriter.updatedFromProtocol).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs($modelWriter.updatedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    });

    it('should replace the entire model if updated from the protocol', function () {
      scope.model = ['foobar'];
      $modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model'
      },
      {
        data: ['fooey']
      });
      scope.$digest();

      expect(scope.model[0]).toEqual('fooey');
      expect(scope.model.length).toEqual(1);
    });
  });
})