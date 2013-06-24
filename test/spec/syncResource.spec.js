describe('Setup', function () {
  var syncResource, scope, protocol, syncer, syncEvents;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_, _$q_, _syncEvents_) {
    $syncResource = _$syncResource_;
    syncEvents = _syncEvents_;
    
    scope = $rootScope;
    $q = _$q_;

    protocol = new VolatileProtocol({host: 'localhost'});
    syncer = $syncResource({
      protocol: protocol,
      scope: scope
    });
  }));

  describe('SyncResource', function () {
    it('should exist', function () {
      expect(!!angular).toBe(true);
      expect(!!$syncResource).toBe(true);
    });

    it('should accept a configured transport when generating a syncer', function () {
      expect(typeof syncer.config.protocol).toEqual('object');
      expect(syncer.config.protocol.host).toEqual('localhost');
    });

    describe('unHash', function () {
      it('should remove $$hashKey from objects in an array', function () {
        var unHashed = syncer.unHash([{$$hashKey: '1', id: '2'}]);
        expect(unHashed[0].$$hashKey).toBeUndefined();
        expect(unHashed[0].id).toEqual('2');
      });

      it('should remove $$hashKey from a single object', function () {
        var unHashed = syncer.unHash({$$hashKey: '3', id:'4'});
        expect(unHashed.id).toEqual('4');
        expect(unHashed.$$hashKey).toBeUndefined();
      });

      it('should not change an object at all if the object has no $$hashKey', function () {
        var unHashed = syncer.unHash({foo: 'bar', baz: 'foo'});
        expect(unHashed.foo).toEqual('bar');
        expect(unHashed.baz).toEqual('foo');
        expect(Object.keys(unHashed).length).toEqual(2);
      });
    });

    describe('onModelChange', function () {
      it('should exist', function () {
        expect(!!syncer.onModelChange).toBe(true);
      });

      it('should call protocol.create when new data is added', function () {
        syncer.onModelChange.call(syncer, ['foo', 'addme'], ['foo'], {path: 'foo.bar'});
        scope.$digest();
        expect(protocol.created.model).toEqual('addme');

        syncer.onModelChange.call(syncer, ['foo'], ['foo', 'remove'], {path: 'foo.bar'});
        scope.$digest();
        expect(protocol.removed.model).toEqual('remove');

        syncer.onModelChange.call(syncer, ['too'], ['foo'], {path: 'foo.bar'});
        scope.$digest();
        expect(protocol.changed.model).toEqual('too');
      });
    });  

    describe('onProtocolChange', function () {
      it('should exist', function () {
        expect(!!syncer.onProtocolChange).toBe(true);
      });

      it('should update the model after reading data from the protocol', function () {
        var deferred = $q.defer();
        deferred.promise.then(function (msg) {
          expect(msg).toEqual('readme');
        });
        syncer.onProtocolChange.call(syncer, syncEvents.READ, 'readme', null, deferred);

        scope.$digest();
      });

      it('should update the model array after adding ADD event from the protocol', function () {
        scope.myModel = ['please'];
        syncer.onProtocolChange.call(syncer, syncEvents.ADD, 'readme', 'myModel');
        scope.$digest();
        expect(scope.myModel[0]).toEqual('please');
        expect(scope.myModel[1]).toEqual('readme');
      });

      it('should update the model array after REMOVE event from the protocol', function () {
        scope.myModel = ['please', 'readme'];
        syncer.onProtocolChange.call(syncer, syncEvents.REMOVE, 'readme', 'myModel');
        scope.$digest();
        expect(scope.myModel[0]).toEqual('please');
        expect(scope.myModel[1]).toEqual(undefined);
      });
    });

    describe('addedFromProtocol', function () {
      it('should exist', function () {
        expect(!!syncer.addedFromProtocol).toBe(true);
      });

      it('should add an item to a collection', function () {
        var model = ['foo'];
        syncer.addedFromProtocol(model, 'bar');

        expect(model[1]).toEqual('bar');
      });
    });

    describe('removedFromProtocol', function () {
      it('should exist', function () {
        expect(!!syncer.removedFromProtocol).toBe(true);
      });

      it('should update the local model based on removal event from protocol', function () {

      });
    });
  });

  describe('bind', function () {
    it('should return a binder object', function () {
      var binder = syncer.bind({id: 'abc'}, 'model');
      expect(typeof binder.then).not.toEqual('function');
      expect(typeof binder.query).toEqual('object');
      expect(binder.query.id).toEqual('abc');
    });
  });

  
  // it('should always unhash newVal before diffing it');
  // it('should call "subscribe" on the protocol when calling bind() on the syncer', function () {
  //   syncer.bind('documents');
  //   expect(protocol.bound[0].query).toEqual('documents');
  // });

  // it("should assign the result of the protocol's get method to the appropriate model on the scope", function () {
  //   syncer.bind('documents', 'myModel');
  //   expect(typeof scope.myModel.then).toEqual('function');
  // });

  // it('should return a promise when calling bind, which should resolve to the initial data state', function () {
  //   expect(false).toBe(true);
  // });

  // it('should maintain a unique binder object for each call to .bind', function () {
  //   expect(false).toBe(true);
  // });

  // it('should not react to initial model change on initial read', function () {
  //   expect(false).toBe(true);
  // });

  // it('should pluck an item', function () {
  //   expect(false).toBe(true);
  // });

  // it('should update an item', function () {
  //   expect(false).toBe(true);
  // });
});