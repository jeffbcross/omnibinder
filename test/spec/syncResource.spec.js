ddescribe('Setup', function () {
  var syncResource, scope, protocol, syncer;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_, _$q_) {
    $syncResource = _$syncResource_;
    
    scope = $rootScope;
    $q = _$q_;

    protocol = new VolatileProtocol({host: 'localhost'});
    syncer = $syncResource({
      protocol: protocol,
      scope: scope
    });
  }));

  it('should exist', function () {
    expect(!!angular).toBe(true);
    expect(!!$syncResource).toBe(true);
  });

  it('should accept a configured transport when generating a syncer', function () {
    expect(typeof syncer.config.protocol).toEqual('object');
    expect(syncer.config.protocol.host).toEqual('localhost');
  });

  describe('events', function () {
    it('should have a dictionary of event constants', function () {
      expect(syncer.events.GET).toBeDefined();
      expect(syncer.events.NONE).toBeDefined();
    });
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

  describe('Delta Parsing', function () {
    describe('findRemovedItem', function () {
      it('should find the removed item from an array when comparing two arrays of strings', function () {
        var newArr = ['foo', 'bar'];
        var oldArr = ['foo', 'bar', 'baz'];
        var delta = syncer.findRemovedItem(newArr, oldArr);

        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of objects', function () {
        var newArr = [{foo: true}, {bar: 'yes'}];
        var oldArr = [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}];
        var delta = syncer.findRemovedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of mixed types', function () {
        var newArr = ['foo', 'bar'];
        var oldArr = ['foo', 'bar', {baz: 'duh!'}];

        var delta = syncer.findRemovedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });
    });
    
    describe('findAddedItem', function () {
      it('should find the added item from an array when comparing two arrays of strings', function () {
        var newArr = ['baz', 'foo', 'bar'];
        var oldArr = ['foo', 'bar'];
        var delta = syncer.findAddedItem(newArr, oldArr);

        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(0);
      });

      it('should find the added item from an array when comparing two arrays of objects', function () {
        var newArr = [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}];
        var oldArr = [{foo: true}, {bar: 'yes'}];
        
        var delta = syncer.findAddedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });

      it('should find the added item from an array when comparing two arrays of mixed types', function () {
        var newArr = ['foo', {baz: 'duh!'}, 'bar'];
        var oldArr = ['foo', 'bar'];

        var delta = syncer.findAddedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(1);
      });
    });

    describe('findUpdatedItem', function () {
      it('should exist', function () {
        expect(!!syncer.findUpdatedItem).toBe(true);
      })
    });

    describe('findAddedString', function () {
      it('should exist', function () {
        expect(!!syncer.findAddedString).toBe(true);
      });

      it('should find the first new string when comparing two versions', function () {
        var oldStr = "I'm a teapot.";
        var newStr = "I'm a little teapot.";
        var delta = syncer.findAddedString(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);
      });
    });

    describe('findRemovedString', function () {
      it('should exist', function () {
        expect(!!syncer.findRemovedString).toBe(true);
      });

      it('should find the removed string', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a teapot.";
        var delta = syncer.findRemovedString(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);

        var oldStr = "I sure am a little teapot.";
        var newStr = "You're a little teapot.";
        var delta = syncer.findRemovedString(newStr, oldStr);

        expect(delta.data).toEqual("You're");
        expect(delta.position).toEqual(0);
      });
    });

    describe('findChangedString', function () {
      it('should exist', function () {
        expect(!!syncer.findChangedString).toBe(true);
      });

      it('should find a single difference between two strings of the same length', function () {
        var oldStr = "Can you find the needle in this haystack?";
        var newStr = "Can you find the peanut in this haystack?";
        var delta = syncer.findChangedString(newStr, oldStr);

        expect(delta.data).toEqual('peanut');
        expect(delta.position).toEqual(17);
      });
    });

    describe('compareStrings', function () {
      it('should exist', function () {
        expect(!!syncer.compareStrings).toBe(true);
      });

      it('should determine the correct type of comparison to make', function () {
        expect(syncer.compareStrings('long', 'l').type).toEqual(syncer.events.ADD);
        expect(syncer.compareStrings('s', 'short').type).toEqual(syncer.events.REMOVE);
        expect(syncer.compareStrings('same', 'same').type).toEqual(syncer.events.UPDATE);
      });
    });

    describe('compareArrays', function () {
      it('should exist', function () {
        expect(!!syncer.compareArrays).toBe(true);
      });

      it('should determine the correct type of comparison to make', function () {
        expect(syncer.compareArrays(['1'], ['1','2']).type).toEqual(syncer.events.REMOVE);
        expect(syncer.compareArrays(['1','2'], ['1']).type).toEqual(syncer.events.ADD);
        expect(syncer.compareArrays(['1'],['2']).type).toEqual(syncer.events.UPDATE);
      });
    })

    describe('determineDelta', function () {
      it('should return an object with type, position, and data properties', function () {
        var oldArr = ['foo'];
        var newArr = ['foo', 'bar'];
        var delta = syncer.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncer.events.ADD);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('bar');
      });

      it('should know when an array has removed an item', function () {
        var oldArr = ['foo', 'baz', 'bar'];
        var newArr = ['foo', 'bar'];
        var delta = syncer.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncer.events.REMOVE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has added an item', function () {
        var oldArr = ['foo', 'bar'];
        var newArr = ['foo', 'bar', 'baz'];
        var delta = syncer.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncer.events.ADD);
        expect(delta.position).toEqual(2);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has an updated item', function () {
        var oldArr = ['foo', 'bar'];
        var newArr = ['foo', 'baze'];
        var delta = syncer.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncer.events.UPDATE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baze');
      });

      it('should handle situations with no oldData', function () {
        var newStr = "I'm a teapot.";
        var delta = syncer.determineDelta(newStr);

        expect(delta.data).toEqual("I'm a teapot.");
        expect(delta.type).toEqual(syncer.events.CREATE);
      });

      it('should find the first diff in an added-to string.', function () {
        var oldStr = "I'm a teapot.";
        var newStr = "I'm a little teapot.";
        var delta = syncer.determineDelta(newStr, oldStr);

        expect(delta.type).toEqual(syncer.events.ADD);
        expect(delta.position).toEqual(6);
        expect(delta.data).toEqual('little ');
      });

      it('should find the first diff in a removed-from string', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a teapot.";
        var delta = syncer.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.type).toEqual(syncer.events.REMOVE);
        expect(delta.position).toEqual(6);
      });

      it('should treat a diff as an update when the diff length is greater than the length delta between old and new strings', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a big teapot.";
        var delta = syncer.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('big');
        expect(delta.type).toEqual(syncer.events.UPDATE);
        expect(delta.position).toEqual(6);
      });

      it('should find the first diff in an equal-length string', function () {
        var oldStr = "I'm a stupid teapot.";
        var newStr = "I'm a little teapot.";
        var delta = syncer.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('little');
        expect(delta.type).toEqual(syncer.events.UPDATE);
      });
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
      syncer.onProtocolChange.call(syncer, syncer.events.READ, 'readme', null, deferred);

      scope.$digest();
    });

    it('should update the model array after adding ADD event from the protocol', function () {
      scope.myModel = ['please'];
      syncer.onProtocolChange.call(syncer, syncer.events.ADD, 'readme', 'myModel');
      scope.$digest();
      expect(scope.myModel[0]).toEqual('please');
      expect(scope.myModel[1]).toEqual('readme');
    });

    it('should update the model array after REMOVE event from the protocol', function () {
      scope.myModel = ['please', 'readme'];
      syncer.onProtocolChange.call(syncer, syncer.events.REMOVE, 'readme', 'myModel');
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

    
  });

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