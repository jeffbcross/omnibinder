describe('$modelWriter', function () {
  var modelWriter, scope;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$modelWriter_, $rootScope) {
    $modelWriter = _$modelWriter_;
    scope = $rootScope;
  }));

  function captureFunctionArgs (funcString) {
    //Takes in a stringified function, returns array of arguments.
    var captureArgs = /function[ ]*[a-zA-Z0-9]*[ ]*\(([a-zA-Z0-9, ]*)\)[ ]*{/;
    return captureArgs.exec(funcString)[1].replace(/ /g, '').split(',');
  }

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
        model: 'model'
      }, {
        data: 'bar'
      });

      expect(scope.model[1]).toEqual('bar');
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