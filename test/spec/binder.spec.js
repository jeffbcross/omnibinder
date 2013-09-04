describe('obModelCache', function () {
  var obModelCache;

  beforeEach(module('OmniBinder'));

  beforeEach(inject(function (_obModelCache_) {
    obModelCache = _obModelCache_;
  }));

  it('should exist', function () {
    expect(!!obModelCache).toBe(true);
  });

  it('should set the cache to a copy of the passed-in model', function () {
    var model = {foo: 'bar'};
    var binder = {};
    expect(obModelCache.get(binder)).toBeUndefined();

    obModelCache.set(binder, model);
    expect(obModelCache.get(binder)).toEqual(model);
    expect(obModelCache.get(binder)).not.toBe(model);

    model.foo = 'baz';
    expect(obModelCache.get(binder)).toEqual({foo: 'bar'});
  });
});

describe('obBinder', function () {
  var binder, $q, scope, $timeout, binder, captureFunctionArgs, protocol, obSyncEvents, obModelWriter, myBinder, obBinderTypes;

  beforeEach(module('OmniBinder'));


  beforeEach(inject(function (_obBinder_, $rootScope, _$q_, _$timeout_, $captureFuncArgs, _obSyncEvents_, _obModelWriter_, _obBinderTypes_, _obDelta_) {
    obDelta = _obDelta_;
    obBinderTypes = _obBinderTypes_;
    obModelWriter = _obModelWriter_;
    obSyncEvents = _obSyncEvents_;
    captureFunctionArgs = $captureFuncArgs;
    protocol = {
      host: 'localhost',
      processChanges: function (binder, delta) {},
      change: function () {},
      add: function () {},
      remove: function () {},
      subscribe: function () {}
    };
    binder = _obBinder_;
    $timeout = _$timeout_;
    $q = _$q_;
    scope = $rootScope;
    myBinder = binder({
      protocol: protocol,
      scope: scope,
      model: 'model',
      query: {id: 'abc', path: 'foo.bar'}
    });
  }));


  it('should exist', function () {
    expect(!!binder).toBe(true);
  });


  describe('bindModel', function () {
    it('should bind a model', function () {

      var done;
      var i = 0;
      var spy = spyOn(myBinder, 'onModelChange');

      runs(function () {
        scope.boundmodel = [];
        myBinder.bindModel(obBinderTypes.COLLECTION, scope, 'boundmodel');
        scope.boundmodel.push('hi');
        scope.$digest();
      });


      waitsFor(function () {
        return spy.callCount;
      }, 250, "call count to be greater than 0");

      runs(function () {
        expect(spy).toHaveBeenCalled();
      });
    });
  });


  describe('onModelChange', function () {
    it('should exist', function () {
      expect(!!myBinder.onModelChange).toBe(true);
    });


    it('should have the correct signature', function () {
      var args = captureFunctionArgs(myBinder.onModelChange.toString());
      expect(!args[0]).toBe(true);
    });
  });


  describe('onProtocolChange', function () {
    var myBinder;

    beforeEach(function () {
      myBinder = binder({
        scope: scope,
        model: 'myModel',
        protocol: protocol
      });
    });


    it('should exist', function () {
      expect(typeof myBinder.onProtocolChange).toBe('function');
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(myBinder.onProtocolChange.toString());
      expect(args[0]).toBe('changes');
      expect(args[1]).toBeUndefined();
    });
  });


  describe('Constructor', function () {
    it('should return a binder object', function () {
      var myBinder = binder({
        protocol: protocol,
        scope: scope,
        model: 'myModel',
        query: {
          id: 'abc'
        }
      });

      expect(typeof myBinder.query).toBe('object');
      expect(myBinder.query.id).toBe('abc');
      expect(typeof myBinder.val).toBe('function');
    });


    it('should complain if no protocol is provided', function () {
      expect(function () {
        binder({
          model: 'myModel',
          scope: scope,
          query: {}
        });
      }).toThrow(new Error("protocol is required"))
    })


    it('should cause model changes to go through binder.onModelChange', function () {
      var spy = spyOn(protocol, 'processChanges');
      myBinder.scope[myBinder.model] = ['foo', 'bar'];
      myBinder.onModelChange.call(myBinder);
      scope.$apply();

      expect(spy).toHaveBeenCalled();
    });
  });

  it('should accept a configured protocol when creating a binder', function () {
    expect(typeof myBinder.protocol).toBe('object');
    expect(myBinder.protocol.host).toBe('localhost');
  });


  it('should accept scope as the first argument', function () {
    scope.hello = 'world';
    var myBinder = binder({
      scope: scope,
      model: 'hello',
      protocol: protocol
    });

    expect(myBinder.scope.hello).toBe('world');
  });


  it('should accept a model name as the second argument', function () {
    scope.super = 'heroic';
    myBinder.model = 'super';

    expect(myBinder.model).toBe('super');
    expect(myBinder.val()).toBe('heroic');
  });


  it('should throw an error when scope is not provided', function () {
    expect(function () {
      binder({
        scope: null,
        model: 'super',
        protocol: protocol
      });
    }).toThrow(new Error('scope is required'));
  });


  it('should throw an error when model is not provided', function () {
    expect(function () {
      binder({
        scope: scope,
        protocol: protocol
      });
    }).toThrow(new Error('model is required'));
  });


  // describe('onModelChange', function () {
  //   it('should throw an error if I pass in something other than function', function () {
  //     expect(function () {
  //       binder({
  //         scope: scope,
  //         model: 'foo',
  //         protocol: protocol,
  //         onModelChange: {change: this}
  //       })
  //     }).toThrow(new Error('onModelChange must be a function'));
  //   });
  // });


  describe('key', function () {
    it('should allow setting of a `key` property, which should be used to uniquely identify elements', function () {
      var myBinder = binder({
        protocol: protocol,
        scope: scope,
        model: 'foo',
        key: 'id'
      });

      expect(myBinder.key).toBe('id');
    });


    it('should throw an error when anything other than a string is passed as key', function () {
      expect(function () {
        binder({
          scope: scope,
          model: 'foo',
          key: {"true" : 'that'},
          protocol: protocol
        });
      }).toThrow(new Error('key must be a string'));
    });
  });
});
