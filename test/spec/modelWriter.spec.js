describe('modelWriter', function () {
  var modelWriter, scope, captureFunctionArgs, obBinderTypes, $timeout, binder, syncEvents;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function (_modelWriter_, _obBinderTypes_, $rootScope, $captureFuncArgs, _$timeout_, _syncEvents_) {
    syncEvents = _syncEvents_;
    modelWriter = _modelWriter_;
    scope = $rootScope;
    captureFunctionArgs = $captureFuncArgs;
    obBinderTypes = _obBinderTypes_;
    $timeout = _$timeout_;
    binder = {
      scope: scope,
      model: 'myModel',

    }
  }));


  describe('.val()', function () {
    it('should return a copy of the model value when calling val()', function () {
      scope.myModel = ['foo', 'bar'];
      expect(modelWriter.val(binder)).toEqual(['foo', 'bar']);
    });


    it('should escape $$hashKey\'s from models', function () {
      scope.myModel = {$$hashKey: 'abc', foo: 'bar'};
      expect(modelWriter.val(binder)).toEqual({foo: 'bar'});
    })
  });


  describe('Array Methods', function () {
    describe('push', function () {
      it('should have a push method', function () {
        expect(typeof modelWriter.push).toBe('function');
      });


      it('should add an element to an existing array', function () {
        binder.scope[binder.model] = [];
        modelWriter.push(binder, {changes: [{object: ['foo'], type: syncEvents.NEW, name: "0"}]})
        scope.$apply();
        expect(binder.scope[binder.model]).toEqual(['foo']);
      });


      it('should throw an error if the existing model is something other than array or undefined', function () {
        binder.scope[binder.model] = {};
        expect(function () {
          modelWriter.push(binder, {data: 'foo'});
        }).toThrow(new Error("Cannot call 'push' on a model that is not array or undefined."));
      });


      it('should return a reference to the model', function () {
        binder.scope[binder.model] = [];
        expect(modelWriter.push(binder, {changes: [{object: ['foo'], name: 0}]})).toBe(0);
      });
    });


    describe('pop', function () {
      beforeEach(function () {
        binder.type = obBinderTypes.COLLECTION;
      });


      it('should exist', function () {
        expect(typeof modelWriter.pop).toBe('function');
      });


      it('should complain when popping an undefined model', function () {
        expect(function () {
          modelWriter.pop(binder, {})
        }).toThrow(new Error("Cannot call 'pop' on an undefined model."))
      });


      it('should complain when popping a model that is not an array', function () {
        binder.scope[binder.model] = {};
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error("Cannot call 'pop' on a non-array object."));
      });


      it("should complain when popping a model on a binder without 'collection' type", function () {
        binder.scope[binder.model] = ['foo'];
        binder.type = undefined;
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error('Cannot call pop on a non-collection binder type.'));

        binder.type = obBinderTypes.OBJECT;
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error('Cannot call pop on a non-collection binder type.'));

        binder.type = obBinderTypes.COLLECTION;
        expect(function () {
          modelWriter.pop(binder, {});
        }).not.toThrow(new Error('Cannot call pop on a non-collection binder type.'));
      });


      it('should remove and return the last item in an array', function () {
        binder.scope[binder.model] = ['foo', 'bar'];
        expect(modelWriter.pop(binder, {})).toEqual('bar');
        expect(binder.scope[binder.model]).toEqual(['foo']);
      });
    });


    describe('length', function () {
      it('should be a function', function () {
        expect(typeof modelWriter.length).toBe('function');
      });


      it('should complain if the model is not a collection or string type', function () {
        expect(function () {
          modelWriter.length(binder);
        }).toThrow(new Error('Binder must be a string or collection to call .length()'));
      });


      it('should return the length of the model', function () {
        binder.type = obBinderTypes.COLLECTION;
        scope.myModel = ['foo', 'bar', 'baz'];
        expect(modelWriter.length(binder)).toBe(3);
      });
    });

  });


  describe('roundTripPrevention', function () {
    // This is not a unit test. Create integration tests.
    // it('should tell $syncResource to ignore changes that only come from the protocol if delta.silent is set to true', function () {
    //   var called = 0
    //     , mySyncResource = $syncResource({protocol: {
    //       change: function () {
    //       called++;
    //     }, subscribe: function (blah, callback) {
    //       callback({data: 'barbaz', silent: true})
    //     }}});

    //   mySyncResource.bind({
    //     scope: scope,
    //     model: 'myModel',
    //     type: obBinderTypes.COLLECTION
    //   });

    //   scope.myModel = ['foobar'];
    //   scope.$apply();
    //   $timeout.flush();

    //   expect(called).toEqual(1);
    // });
  });


  describe('processChanges', function () {
    it('should exist', function () {
      expect(typeof modelWriter.processChanges).toBe('function');
    });


    it('should accept an array of changes from the protocol', function () {
      var args = captureFunctionArgs(modelWriter.processChanges);
      expect(args[0]).toBe('binder');
      expect(args[1]).toBe('delta');
      expect(args[2]).toBeUndefined();
    });


    it('should execute changes in order', function () {
      scope.myModel = [];
      binder.type = obBinderTypes.COLLECTION;
      modelWriter.processChanges(binder, {changes: [{
        type: syncEvents.NEW,
        name: '0',
        object: ['foo']
      }]});

      expect(scope.myModel).toEqual(['foo']);

      modelWriter.processChanges(binder, {changes: [{
        type: syncEvents.NEW,
        name: '1',
        object: ['foo', 'bar']
      }]});

      expect(scope.myModel).toEqual(['foo', 'bar']);

      modelWriter.processChanges(binder, {changes: [{
        type: syncEvents.DELETED,
        name: '0',
        object: ['foo']
      }]});

      expect(scope.myModel).toEqual(['bar']);

      modelWriter.processChanges(binder, {changes: [{
        type: syncEvents.UPDATED,
        name: '0',
        object: [{foo: 'barrrr'}]
      }]});

      expect(scope.myModel).toEqual([{foo: 'barrrr'}]);
    });
  });


  describe('newFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.newFromProtocol).toBe(true);
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.newFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('change');
      expect(args[2]).toBeUndefined();
    });


    it('should add an item to a collection', function () {
      scope.model = ['foo'];
      modelWriter.newFromProtocol({
        scope: scope,
        model: 'model',
        type: obBinderTypes.COLLECTION
      }, {
        name: "1",
        object: ['foo', 'bar']
      });

      expect(scope.model[1]).toEqual('bar');
    });
  });


  describe('removedFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.removedFromProtocol).toBe(true);
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.removedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    })


    it('should update the local model based on removal event from protocol', function () {
      scope.model = [{id: 1}, {id: 2}];
      modelWriter.removedFromProtocol({
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

      modelWriter.removedFromProtocol(binder, {
        data: {id: 1}
      });

      expect(binder.data).toEqual([{id: 2}]);
    });
  });



  describe('updatedFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.updatedFromProtocol).toBe(true);
    });


    it('should complain if it does not get a valid change object', function () {
      expect(function () {
        modelWriter.updatedFromProtocol({type: obBinderTypes.OBJECT}, {object: "foobar"})
      }).toThrow(new Error("Change object must contain a name"));
    });


    it('should extend an existing object', function () {
      scope.model = {foo: 'bar'};
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: obBinderTypes.OBJECT
      }, {
        type: syncEvents.UPDATED,
        name: 'foo',
        object: {foo: 'baz'}
      });

      expect(scope.model.foo).toEqual('baz');
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.updatedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('change');
      expect(args[2]).toBeUndefined();
    });


    it('should replace a model at the correct position', function () {
      scope.model = [{}, {foo:'bar'}];
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: obBinderTypes.COLLECTION
      }, {
        name: "1",
        type: syncEvents.UPDATED,
        object: [{}, {
          foo: 'baz'
        }]
      });

      expect(scope.model[1]).toEqual({foo:'baz'});
    });


    it('should merge objects instead of overwriting', function () {
      scope.model = {foo:'bar'};
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: obBinderTypes.OBJECT
      }, {
        name: "newer",
        type: syncEvents.NEW,
        object: {
          foo: 'bar',
          newer: 'property'
        }
      });

      expect(scope.model).toEqual({foo: 'bar', newer: 'property'});
    });
  });
})