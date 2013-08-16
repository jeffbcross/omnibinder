describe('$binder', function () {
  var $binder, $q, scope, $timeout, binder, captureFunctionArgs, protocol, syncEvents, modelWriter, myBinder;

  beforeEach(module('Binder'));
  beforeEach(inject(function (_$binder_, $rootScope, _$q_, _$timeout_, $captureFuncArgs, _syncEvents_, _modelWriter_) {
    modelWriter = _modelWriter_;
    syncEvents = _syncEvents_;
    captureFunctionArgs = $captureFuncArgs;
    protocol = {
      host: 'localhost',
      change: function () {},
      add: function () {},
      remove: function () {}
    };
    $binder = _$binder_;
    $timeout = _$timeout_;
    $q = _$q_;
    scope = $rootScope;
    binder = $binder(protocol);
    myBinder = binder.bind({
      scope: scope,
      model: 'model',
      query: {id: 'abc', path: 'foo.bar'}
    });
  }));

  it('should exist', function () {
    expect(!!$binder).toBe(true);
  });

  it('should accept a protocol and return a binder', function () {
  })

  describe('.bind()', function () {
    it('should return a prototypically inherited instance of binder', function () {
      var binder = $binder(protocol);
      binder.foo = 'bar';
      binder.model = 'baz';
      var myBinder = binder.bind({
        scope: scope,
        model: 'myModel'
      });

      expect(typeof myBinder.onProtocolChange).toBe('function');
      expect(myBinder.model).toBe('myModel');
      expect(myBinder.foo).toBe('bar');
    });
  })

  describe('onModelChange', function () {
    it('should exist', function () {
      expect(!!binder.onModelChange).toBe(true);
    });

    it('should have the correct signature', function () {
      var args = captureFunctionArgs(binder.onModelChange.toString());
      expect(args[0]).toBe('newVal');
      expect(args[1]).toBe('oldVal');
      expect(args[2]).toBeUndefined();
    })

    it('should call protocol.create when new data is added', function () {
      var spy = spyOn(protocol, 'change');
      binder.onModelChange(['foo', 'addme'], ['foo']);
      scope.$digest();

      binder.onModelChange.call(binder, ['foo'], ['foo', 'remove'], binder);
      scope.$digest();

      binder.onModelChange.call(binder, ['too'], ['foo'], binder);
      scope.$digest();

      expect(spy.callCount).toBe(3);
    });
  });

  describe('Array Methods', function () {
    describe('push', function () {
      it('should throw an error if the binder does not have "collection" type', function () {
        expect(function () {
          myBinder.push('foobar');
        }).toThrow(new Error("Cannot call push on non-collection binder. Binder must be instantiated with type: binderTypes.COLLECTION"));
      });

      it('should call modelWriter.push when calling binder.push', function () {
        var spy = spyOn(modelWriter, 'push');
        myBinder.type = 'collection';
        myBinder.push('foo');
        scope.$apply();
        expect(spy).toHaveBeenCalled();
      });

      it('should immediately invoke the change pipeline to the protocol', function () {
        var spy = spyOn(protocol, 'add');
        myBinder.type = 'collection';
        myBinder.push('foo');
        scope.$apply();
        expect(spy).toHaveBeenCalled();
      });

      it('should add the model to the queue of unsynced changes in the binder', function () {
        myBinder.type = 'collection';
        myBinder.push('foo');
        scope.$apply();
        expect(myBinder.unsyncedChanges.length).toBe(1);
        expect(myBinder.unsyncedChanges[0].data).toBe('foo');
      })
    })
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
      expect(!!binder.onProtocolChange).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(binder.onProtocolChange.toString());
      expect(args[0]).toBe('delta');
      expect(args[1]).toBeUndefined();
    });

    it('should update the model after reading data from the protocol', function () {
      var deferred = $q.defer();
      deferred.promise.then(function (msg) {
        expect(msg).toBe('readme');
      });

      binder.onProtocolChange.call(binder, binder, {
        type: syncEvents.READ,
        data: 'readme'
      });

      scope.$digest();
    });

    it('should update the model array after adding ADD event from the protocol', function () {
      var spy = spyOn(modelWriter, 'addedFromProtocol');
      scope.myModel = ['please'];
      binder.type = 'collection';
      binder.onProtocolChange({
        type: syncEvents.ADD,
        data: 'readme'
      });

      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });

    it('should update the model array after REMOVE event from the protocol', function () {
      var spy = spyOn(modelWriter, 'removedFromProtocol');
      scope.myModel = ['please', 'readme'];
      binder.onProtocolChange({
        type: syncEvents.REMOVE,
        data: 'readme'
      });
      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });


  describe('sendToModel', function () {
    it('should exist', function () {
      expect(!!binder.sendToModel).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(binder.sendToModel.toString());
      expect(args[0]).toBe('delta');
      expect(args[1]).toBeUndefined();
    });
  });

  describe('bind', function () {
    it('should return a binder object', function () {
      expect(typeof binder.then).not.toBe('function');
      expect(typeof binder.query).toBe('object');
      expect(binder.query.id).toBe('abc');
      expect(typeof binder.val).toBe('function');
    });

    it('should cause model changes to go through binder.onModelChange', function () {
      var spy = spyOn(protocol, 'change');
      binder.onModelChange('Fooey', 'Booey');
      scope.$apply();

      expect(spy).toHaveBeenCalled();
    });
  });

  it('should accept a configured protocol when creating a binder', function () {
    expect(typeof binder.protocol).toBe('object');
    expect(binder.protocol.host).toBe('localhost');
  });

  it('should accept scope as the first argument', function () {
    scope.hello = 'world';
    var binder = $binder({
      scope: scope,
      model: 'hello'
    });

    expect(binder.scope.hello).toBe('world');
  });

  it('should accept a model name as the second argument', function () {
    scope.super = 'heroic';
    var binder = $binder({
      scope: scope,
      model: 'super'
    });

    expect(binder.model).toBe('super');
    expect(binder.val()).toBe('heroic');
  });

  it('should throw an error when scope is not provided', function () {
    var msg;
    try {
      var binder = $binder({
        scope: null,
        model: 'super'
      });
    }
    catch (e) {
      msg = e.message;
    }
    expect(msg).toBe('scope is required');
  });

  it('should throw an error when modelName is not provided', function () {
    var msg;

    try {
      var binder = $binder({
        scope: scope
      });
    }
    catch (e) {
      msg = e.message;
    }

    expect(msg).toBe('model is required');
  });

  describe('onModelChange', function () {
    it('should throw an error if I pass in something other than function', function () {
      var msg, binder;
      try {
        binder = $binder({
          scope: scope,
          model: 'foo',
          onModelChange: {change: this}
        })
      }
      catch (e) {
        msg = e.message;
      }

      expect(msg).toBe('onModelChange must be a function');
    });
  });

  describe('key', function () {
    it('should allow setting of a `key` property, which should be used to uniquely identify elements', function () {
      var binder = $binder({
        scope: scope,
        model: 'foo',
        key: 'id'
      });

      expect(binder.key).toBe('id');
    });

    it('should throw an error when anything other than a string is passed as key', function () {
      var message;
      try {
        var binder = $binder({
          scope: scope,
          model: 'foo',
          key: {"true" : 'that'}
        });
      }
      catch (e) {
        message = e.message;
      }

      expect(message).toBe('key must be a string');
    });
  });

  describe('.change()', function () {
    it('should exist', function () {
      expect(typeof binder.change).toBe('function');
    });

    it('should only invoke one change pipeline when calling change', function () {
      scope.products = [];
      var spy = spyOn(binder, 'change');
      scope.$apply();
      binder.change({type: 'add', data: [{title: 'Widget'}]})
      scope.$apply();

      expect(spy.callCount).toBe(1);
    });
  });
});
