describe('Setup', function () {
  var syncResource, scope, protocol, syncer, syncEvents, $differ, $binder;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, _$binder_, _$differ_, $rootScope, $httpBackend, _$syncResource_, _$q_, _syncEvents_) {
    $syncResource = _$syncResource_;
    syncEvents = _syncEvents_;
    $differ = _$differ_;
    $binder = _$binder_;
    
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
        var binder = $binder({
          scope: scope,
          model: 'model',
          onModelChange: function (newVal, oldVal, delta, next) {
            var newDelta = $differ.determineDelta(newVal, oldVal);
            delta.data = newDelta.data;
            delta.type = newDelta.type;
            next();
          },
          query: {path: 'foo.bar'}
        });

        syncer.onModelChange.call(syncer, ['foo', 'addme'], ['foo'], binder);
        scope.$digest();
        expect(protocol.created.model).toEqual('addme');

        syncer.onModelChange.call(syncer, ['foo'], ['foo', 'remove'], binder);
        scope.$digest();
        expect(protocol.removed.delta.data).toEqual('remove');
        expect(protocol.removed.query.path).toEqual('foo.bar');

        syncer.onModelChange.call(syncer, ['too'], ['foo'], binder);
        scope.$digest();
        expect(protocol.changed.model).toEqual('too');
      });

      it('should call protocol.remove when data is deleted or spliced', function () {
        var binder = $binder({
          scope: scope,
          model: 'model',
          onModelChange: function (newVal, oldVal, delta, next) {
            var newDelta = $differ.determineDelta(newVal, oldVal);
            delta.data = newDelta.data;
            delta.type = newDelta.type;
            delta.position = newDelta.position;
            next();
          },
          query: {path: 'foo.bar'}
        });

        syncer.onModelChange.call(syncer, ['foo'], ['foo', 'removeme'], binder);
        scope.$digest();

        expect(protocol.removed.delta.data).toEqual('removeme');
        expect(protocol.removed.delta.type).toEqual(syncEvents.REMOVE);
        expect(protocol.removed.delta.position).toEqual(1);
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
        scope.model = ['foo'];
        syncer.addedFromProtocol(scope, 'model', 'bar');

        expect(scope.model[1]).toEqual('bar');
      });
    });

    describe('removedFromProtocol', function () {
      it('should exist', function () {
        expect(!!syncer.removedFromProtocol).toBe(true);
      });
      
      it('should update the local model based on removal event from protocol', function () {
        var model = [{id: 1}, {id: 2}];
        syncer.removedFromProtocol(model, {id: 1});

        expect(model.length).toEqual(1);
        expect(model[0].id).toEqual(2);
      });
    });

    describe('updatedFromProtocol', function () {
      it('should replace the entire model if updated from the protocol', function () {
        scope.model = ['foobar'];
        syncer.updatedFromProtocol(scope, 'model', ['fooey']);
        scope.$digest();

        expect(scope.model[0]).toEqual('fooey');
        expect(scope.model.length).toEqual(1);
      });
    });
  });

  describe('bind', function () {
    it('should return a binder object', function () {
      var binder = syncer.bind({
        scope: scope,
        model: 'model',
        query: {id: 'abc'}
      });
      expect(typeof binder.then).not.toEqual('function');
      expect(typeof binder.query).toEqual('object');
      expect(binder.query.id).toEqual('abc');
      expect(typeof binder.val).toEqual('function');
    });

    it('should cause model changes to go through binder.onModelChange', function () {
      var binder = syncer.bind({
        scope: scope,
        model: 'model',
        onModelChange: function (newVal, oldVal, delta, next) {
          delta.data = oldVal + newVal;
          delta.type = syncEvents.UPDATE;
          next();
        }
      });

      syncer.onModelChange.call(syncer, 'Fooey', 'Booey', binder);
      expect(protocol.changed.model).toEqual('BooeyFooey');
    });
  });

  /*it('should not react to initial model change on initial read', function () {
    expect(false).toBe(true);
  });*/
});