describe('Setup', function () {
  var syncResource, scope, protocol, syncer, syncEvents, $differ, $binder, captureFunctionArgs, $timeout;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, _$binder_, _$differ_, $rootScope, $httpBackend, _$syncResource_, _$q_, _syncEvents_, $captureFuncArgs, _$timeout_) {
    $syncResource = _$syncResource_;
    $timeout = _$timeout_;
    syncEvents = _syncEvents_;
    $differ = _$differ_;
    $binder = _$binder_;
    captureFunctionArgs = $captureFuncArgs;
    
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
      it('should exist', function () {
        expect(!!syncer.unHash).toBe(true);
      });

      it('should have the correct signature', function () {
        var args = captureFunctionArgs(syncer.unHash.toString());
        expect(args[0]).toEqual('array');
        expect(args[1]).toBeUndefined();
      });

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

      it('should have the correct signature', function () {
        var args = captureFunctionArgs(syncer.onModelChange.toString());
        expect(args[0]).toEqual('newVal');
        expect(args[1]).toEqual('oldVal');
        expect(args[2]).toEqual('binder');
        expect(args[3]).toBeUndefined();
      })

      it('should call protocol.create when new data is added', function () {
        var binder = $binder({
          scope: scope,
          model: 'model',
          onModelChange: function (binder, delta) {
            var deferred = $q.defer();
            $timeout(function () {
              $differ.determineDelta(binder, delta, function () {
                deferred.resolve(delta);  
              });
              
            }, 0);

            return deferred.promise;
          },
          query: {path: 'foo.bar'}
        });

        syncer.onModelChange.call(syncer, ['foo', 'addme'], ['foo'], binder);
        $timeout.flush();
        scope.$digest();

        expect(protocol.created.model).toEqual('addme');

        syncer.onModelChange.call(syncer, ['foo'], ['foo', 'remove'], binder);
        $timeout.flush();
        scope.$digest();
        expect(protocol.removed.delta.data).toEqual('remove');
        expect(protocol.removed.query.path).toEqual('foo.bar');

        syncer.onModelChange.call(syncer, ['too'], ['foo'], binder);
        $timeout.flush();
        scope.$digest();
        expect(protocol.changed.model).toEqual('too');
      });

      it('should call protocol.remove when data is deleted or spliced', function () {
        var binder = $binder({
          scope: scope,
          model: 'model',
          onModelChange: function (binder, delta, next) {
            var deferred = $q.defer();
            $timeout(function () {
              $differ.determineDelta(binder, delta, function () {
                deferred.resolve(delta);
              });
            }, 0);
            return deferred.promise;
            
          },
          query: {path: 'foo.bar'}
        });

        syncer.onModelChange.call(syncer, ['foo'], ['foo', 'removeme'], binder);
        $timeout.flush();
        scope.$digest();

        expect(protocol.removed.delta.data).toEqual('removeme');
        expect(protocol.removed.delta.type).toEqual(syncEvents.REMOVE);
        expect(protocol.removed.delta.position).toEqual(1);
      });
    });  

    describe('onProtocolChange', function () {
      var binder;

      beforeEach(function () {
        binder = $binder({
          scope: scope,
          model: 'myModel'
        })
      });
      it('should exist', function () {
        expect(!!syncer.onProtocolChange).toBe(true);
      });

      it('should have the correct function signature', function () {
        var args = captureFunctionArgs(syncer.onProtocolChange.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should update the model after reading data from the protocol', function () {
        var deferred = $q.defer();
        deferred.promise.then(function (msg) {
          expect(msg).toEqual('readme');
        });

        syncer.onProtocolChange.call(syncer, binder, {
          type: syncEvents.READ,
          data: 'readme'
        });

        scope.$digest();
      });

      it('should update the model array after adding ADD event from the protocol', function () {
        scope.myModel = ['please'];
        binder.type = 'collection';
        syncer.onProtocolChange.call(syncer, binder, {
          type: syncEvents.ADD,
          data: 'readme'
        });
        
        scope.$digest();
        $timeout.flush();
        
        expect(scope.myModel[0]).toEqual('please');
        expect(scope.myModel[1]).toEqual('readme');
      });

      it('should update the model array after REMOVE event from the protocol', function () {
        scope.myModel = ['please', 'readme'];
        syncer.onProtocolChange.call(syncer, binder, {
          type: syncEvents.REMOVE,
          data: 'readme'
        });
        scope.$digest();
        $timeout.flush();
        expect(scope.myModel[0]).toEqual('please');
        expect(scope.myModel[1]).toEqual(undefined);
      });
    });
  });

  describe('sendToModel', function () {
    it('should exist', function () {
      expect(!!syncer.sendToModel).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(syncer.sendToModel.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
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
        onModelChange: function (binder, delta) {
          var deferred = $q.defer();
          $timeout(function () {
            delta.data = delta.oldVal + delta.newVal;
            delta.type = syncEvents.UPDATE;
            deferred.resolve(delta);
          }, 0);
          return deferred.promise;
        }
      });

      scope.$apply();
      syncer.onModelChange.call(syncer, 'Fooey', 'Booey', binder);
      
      $timeout.flush();
      scope.$apply();

      expect(protocol.changed.model).toEqual('BooeyFooey');
    });
  });

  /*it('should not react to initial model change on initial read', function () {
    expect(false).toBe(true);
  });*/
});