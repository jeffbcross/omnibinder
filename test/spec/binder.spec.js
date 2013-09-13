describe('obUnsyncedChanges', function () {
  var obUnsyncedChanges;
  beforeEach(module('OmniBinder'));

  beforeEach(inject(function (_obUnsyncedChanges_) {
    obUnsyncedChanges = _obUnsyncedChanges_;
  }));


  it('should exist', function () {
    expect(!!obUnsyncedChanges).toBe(true);
  });

  describe('.add()', function () {
    it('should create an unsyncedChanges object on the binder if one does not exist', function () {
      var binder = {};

      expect(binder.unsyncedChanges).toBeUndefined();

      obUnsyncedChanges.add(binder, 'model', []);
      expect(typeof binder.unsyncedChanges).toBe('object');
    });


    it('should add a change to unsyncedChanges for the correct destination', function () {
      var binder = {};
      var changes = [{addedCount: 1, removed: [], index: 0}];
      obUnsyncedChanges.add(binder, 'model', changes);

      expect(binder.unsyncedChanges.model).toEqual(changes);
    });
  });

  describe('.check()', function () {
    it('should return changes that are not already in the queue', function () {
      var change = {addedCount: 1, removed: [], index: 0};
          changes = [{addedCount: 1, removed: [], index: 1}],
          binder = {
            unsyncedChanges: {
              model: [
                change
              ]
            }
          };

      expect(obUnsyncedChanges.check(binder, 'model', changes)).toEqual(changes);
      expect(obUnsyncedChanges.check(binder, 'model', [change])).toEqual([]);
    });


    it('should create an unsyncedChanges object on the binder if does not exist', function () {
      binder = {};
      expect(binder.unsyncedChanges).toBeUndefined();

      obUnsyncedChanges.check(binder);

      expect(binder.unsyncedChanges).toBeDefined();
    });
  });
});


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
