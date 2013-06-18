ddescribe('Setup', function () {
  var syncResource, scope, protocol, syncer;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_) {
    $syncResource = _$syncResource_;
    
    scope = $rootScope;

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

  describe('Utility Methods', function () {
    it('should remove $$hashKey from objects in an array when calling unHash', function () {
      var unHashed = syncer.unHash([{$$hashKey: '1', id: '2'}]);
      expect(unHashed[0].$$hashKey).toBeUndefined();
      expect(unHashed[0].id).toEqual('2');
    });

    it('should remove $$hashKey from a single object when calling unHash', function () {
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