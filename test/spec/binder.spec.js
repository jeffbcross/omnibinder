describe('obBinder', function () {
  var binder, $q, scope, $timeout, binder,captureFunctionArgs, sampleChange,
      protocol, obSyncEvents, obModelWriter, myBinder, obBinderTypes;

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
    myBinder = binder(scope, 'model', protocol, {
      query: {id: 'abc', path: 'foo.bar'}
    });

    sampleChange = {
      addedCount: 1,
      removed: [],
      index: 0
    };
  }));


  it('should exist', function () {
    expect(!!binder).toBe(true);
  });


  describe('bindModel', function () {
    //These tests will currently fail if run in a browser without Object.observe enabled.
    it('should bind a model', function () {
      var done;
      var i = 0;
      var spy = spyOn(myBinder, 'onModelChange');

      runs(function () {
        scope.boundmodel = [];
        myBinder.bindModel(obBinderTypes.COLLECTION, scope, 'boundmodel');
        scope.boundmodel.push({foo: 'bar'});
      });


      waitsFor(function () {
        return spy.callCount;
      }, 100, "call count to be greater than 0");

      runs(function () {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should unbind model', function () {
      var spy = spyOn(myBinder, 'onModelChange');

      runs(function () {
        scope.boundmodel = [];
        myBinder.bindModel(obBinderTypes.COLLECTION, scope, 'boundmodel');
        myBinder.unbind();
        scope.boundmodel.push({foo: 'bar'});
      });

      waits(100);

      runs(function () {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });


  describe('onModelChange', function () {
    it('should exist', function () {
      expect(!!myBinder.onModelChange).toBe(true);
    });


    it('should have the correct signature', function () {
      var args = captureFunctionArgs(myBinder.onModelChange.toString());
      expect(args[0]).toBe('changes');
      expect(args[1]).toBeUndefined();
    });
  });


  describe('onProtocolChange', function () {
    var myBinder;

    beforeEach(function () {
      myBinder = binder(scope, 'myModel', protocol);
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


  describe('ignoredChanges', function () {
    it('should increment ignoreNModelChanges for each affected object in a change that comes from a protocol', function () {
      scope.myModel = []
      var myBinder = binder(scope, 'myModel', protocol, {
        query: { id: 'abc' },
        type: obBinderTypes.COLLECTION
      });
      expect(myBinder.ignoreNModelChanges).toBe(0);
      myBinder.onProtocolChange.call(myBinder, [{
        added: [{foo: 'bar'}, {bar: 'baz'}],
        addedCount: 2,
        index: 0,
        removed: []
      }]);

      scope.$digest();
      expect(myBinder.ignoreNModelChanges).toBe(2);
    });


    it('should not send model changes to a protocol if the ignoreNModelChanges is greater than 0', function () {
      scope.myModel = [];
      var spy = spyOn(protocol, 'processChanges');
      var myBinder = binder(scope, 'myModel', protocol, {
        query: { id: 'abc' },
        type: obBinderTypes.COLLECTION
      });

      myBinder.ignoreNModelChanges = 2;

      myBinder.onModelChange.call(myBinder, [{
        addedCount: 2,
        added: [{foo: 'bar'}, {baz: 'foo'}],
        removed: [],
        index: 0
      }]);

      expect(spy).not.toHaveBeenCalled();
      expect(myBinder.ignoreNModelChanges).toBe(0);

      myBinder.onModelChange.call(myBinder, [{
        addedCount: 2,
        added: [{foo: 'bar'}, {baz: 'foo'}],
        removed: [],
        index: 0
      }]);

      expect(spy).toHaveBeenCalled();
    });


    it('should decrement the ignoreNModelChanges value for each affected object in changes from the model', function () {
      scope.myModel = [];
      var myBinder = binder(scope, 'myModel', protocol, {
        query: { id: 'abc' },
        type: obBinderTypes.COLLECTION
      });

      myBinder.ignoreNModelChanges = 2;

      myBinder.onModelChange.call(myBinder, [{
        addedCount: 2,
        added: [{foo: 'bar'}, {baz: 'foo'}],
        removed: [],
        index: 0
      }]);

      expect(myBinder.ignoreNModelChanges).toBe(0);
    });
  });


  describe('Constructor', function () {
    it('should return a binder object', function () {
      var myBinder = binder(scope, 'myModel', protocol, {
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
        binder(scope, 'myModel', null, {
          query: {}
        });
      }).toThrow(new Error("protocol is required"))
    })


    it('should cause model changes to go through binder.onModelChange', function () {
      var spy = spyOn(protocol, 'processChanges');
      myBinder.scope[myBinder.model] = ['foo', 'bar'];
      myBinder.onModelChange.call(myBinder, [sampleChange]);
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
    var myBinder = binder(scope, 'hello', protocol);

    expect(myBinder.scope.hello).toBe('world');
  });


  it('should throw an error when scope is not provided', function () {
    expect(function () {
      binder(null, 'super', protocol);
    }).toThrow(new Error('scope is required'));
  });


  it('should throw an error when model is not provided', function () {
    expect(function () {
      binder(scope, null, protocol);
    }).toThrow(new Error('model is required'));
  });


  describe('key', function () {
    it('should allow setting of a `key` property, which should be used to uniquely identify elements', function () {
      var myBinder = binder(scope, 'foo', protocol, {
        key: 'id'
      });

      expect(myBinder.key).toBe('id');
    });


    it('should throw an error when anything other than a string is passed as key', function () {
      expect(function () {
        binder(scope, 'foo', protocol, {
          key: {"true" : 'that'}
        });
      }).toThrow(new Error('key must be a string'));
    });
  });
});
