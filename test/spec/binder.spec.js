describe('binder', function () {
  var binder, $q, scope, $timeout, binder, captureFunctionArgs, protocol, syncEvents, modelWriter, myBinder;

  beforeEach(module('Binder'));
  beforeEach(inject(function (_binder_, $rootScope, _$q_, _$timeout_, $captureFuncArgs, _syncEvents_, _modelWriter_) {
    modelWriter = _modelWriter_;
    syncEvents = _syncEvents_;
    captureFunctionArgs = $captureFuncArgs;
    protocol = {
      host: 'localhost',
      change: function () {},
      add: function () {},
      remove: function () {}
    };
    binder = _binder_;
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

  it('should accept a protocol and return a binder', function () {
  })

  describe('onModelChange', function () {
    it('should exist', function () {
      expect(!!myBinder.onModelChange).toBe(true);
    });

    it('should have the correct signature', function () {
      var args = captureFunctionArgs(myBinder.onModelChange.toString());
      expect(args[0]).toBe('newVal');
      expect(args[1]).toBe('oldVal');
      expect(args[2]).toBeUndefined();
    })

    it('should call protocol.change when new data is added', function () {
      var spy = spyOn(protocol, 'change');
      myBinder.onModelChange(['foo', 'addme'], ['foo']);
      scope.$digest();

      myBinder.onModelChange.call(myBinder, ['foo'], ['foo', 'remove'], myBinder);
      scope.$digest();

      myBinder.onModelChange.call(myBinder, ['too'], ['foo'], myBinder);
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
        var spy = spyOn(myBinder, 'sendToProtocol');

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
      expect(args[0]).toBe('delta');
      expect(args[1]).toBeUndefined();
    });

    it('should update the model array after adding ADD event from the protocol', function () {
      var spy = spyOn(modelWriter, 'addedFromProtocol');
      scope.myModel = ['please'];
      myBinder.type = 'collection';
      myBinder.onProtocolChange({
        type: syncEvents.PUSH,
        data: 'readme'
      });

      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });

    it('should update the model array after REMOVE event from the protocol', function () {
      var spy = spyOn(modelWriter, 'removedFromProtocol');
      scope.myModel = ['please', 'readme'];
      myBinder.onProtocolChange({
        type: syncEvents.DELETE,
        data: 'readme'
      });
      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });


  describe('sendToModel', function () {
    it('should exist', function () {
      expect(!!myBinder.sendToModel).toBe(true);
    });

    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(myBinder.sendToModel.toString());
      expect(args[0]).toBe('delta');
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
      var spy = spyOn(protocol, 'change');
      myBinder.onModelChange('Fooey', 'Booey');
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

  describe('.change()', function () {
    it('should exist', function () {
      expect(typeof myBinder.change).toBe('function');
    });

    it('should only invoke one change pipeline when calling change', function () {
      scope.products = [];
      var spy = spyOn(myBinder, 'change');
      scope.$apply();
      myBinder.change({type: 'add', data: [{title: 'Widget'}]})
      scope.$apply();

      expect(spy.callCount).toBe(1);
    });
  });
});
