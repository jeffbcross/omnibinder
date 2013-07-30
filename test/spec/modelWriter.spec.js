describe('$modelWriter', function () {
  var modelWriter, scope, captureFunctionArgs, $binderTypes, $syncResource, $timeout;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$modelWriter_, _$binderTypes_, $rootScope, $captureFuncArgs, _$syncResource_, _$timeout_) {
    $modelWriter = _$modelWriter_;
    $syncResource = _$syncResource_;
    scope = $rootScope;
    captureFunctionArgs = $captureFuncArgs;
    $binderTypes = _$binderTypes_;
    $timeout = _$timeout_;
  }));

  describe('roundTripPrevention', function () {
    it('should tell $syncResource to ignore changes that only come from the protocol if delta.silent is set to true', function () {
      var called = 0
        , mySyncResource = $syncResource({protocol: {
          change: function () {
          called++;
        }, subscribe: function (blah, callback) {
          callback({data: 'barbaz', silent: true})
        }}});

      mySyncResource.bind({
        scope: scope,
        model: 'myModel',
        type: $binderTypes.COLLECTION
      });
      
      scope.myModel = ['foobar'];
      scope.$apply();
      $timeout.flush();
      
      expect(called).toEqual(1);
    });
  });

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

    it('should update the binder.data with the new data', function () {
      scope.model = {foo: 'bar'};
      var binder = {
        scope: scope,
        model: 'model',
        type: $binderTypes.OBJECT
      };

      $modelWriter.addedFromProtocol(binder, {
        data: {foo: 'baz'}
      });

      expect(binder.data).toEqual({foo: 'baz'});
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

    it('should update the binder.data with the new data', function () {
      var binder = {
        scope: scope,
        model: 'model'
      };
      scope.model = [{id: 1}, {id: 2}];

      $modelWriter.removedFromProtocol(binder, {
        data: {id: 1}
      });

      expect(binder.data).toEqual([{id: 2}]);
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

    it('should replace a model at the correct position, if delta.position is available', function () {
      scope.model = [{}, {foo:'bar'}];
      $modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: $binderTypes.COLLECTION
      }, {
        position: 1,
        data: {
          foo: 'baz'
        }
      });
      scope.$digest();

      expect(scope.model[1]).toEqual({foo:'baz'});
    });

    it('should not care about updating at correct position if the binder.type is not "collection"', function () {
      scope.model = [{}, {foo:'bar'}];
      $modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model'
      }, {
        position: 1,
        data: [{
          foo: 'baz'
        }]
      });
      scope.$digest();

      expect(scope.model).toEqual([{foo:'baz'}]);
    });

    it('should merge objects instead of overwriting', function () {
      scope.model = {foo:'bar'};
      $modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model'
      }, {
        position: 1,
        data: {
          newer: 'property'
        }
      });
      scope.$digest();

      expect(scope.model).toEqual({foo: 'bar', newer: 'property'});
    });


    it('should replace the entire model if updated from the protocol without any more information', function () {
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

    it('should update the binder.data with the new model', function () {
      var binder = {
        scope: scope,
        model: 'model'
      };
      scope.model = ['foobar'];

      $modelWriter.updatedFromProtocol(binder, {
        data: ['fooey']
      });

      expect(binder.data).toEqual(['fooey']);
    })
  });
})