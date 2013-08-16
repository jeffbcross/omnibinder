describe('Differ', function () {
  var differ, syncEvents, captureFunctionArgs;

  beforeEach(module('Binder'))
  beforeEach(inject(function (_differ_, _syncEvents_, $captureFuncArgs) {
    differ = _differ_;
    syncEvents = _syncEvents_;
    captureFunctionArgs = $captureFuncArgs;
  }));

  describe('Delta Parsing', function () {
    describe('findRemovedItem', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findRemovedItem.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should find the removed item from an array when comparing two arrays of strings', function () {
        var delta = {
          newVal: ['foo', 'bar'],
          oldVal: ['foo', 'bar', 'baz']
        };

        delta = differ.findRemovedItem({}, delta);
        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of objects', function () {
        var delta = {
          newVal: [{foo: true}, {bar: 'yes'}],
          oldVal: [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}]
        };

        delta = differ.findRemovedItem({}, delta);
        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of mixed types', function () {
        var delta = {
          newVal: ['foo', 'bar'],
          oldVal: ['foo', 'bar', {baz: 'duh!'}]
        };

        delta = differ.findRemovedItem({}, delta);
        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });
    });

    describe('compareStrings', function () {
      it('should exist', function () {
        expect(!!differ.compareStrings).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.compareStrings.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should determine the correct type of comparison to make', function () {
        var delta = {
          newVal: 'long',
          oldVal: 'l'
        };

        delta = differ.compareStrings({}, delta);
        expect(delta.type).toEqual(syncEvents.ADD);

        delta = {
          newVal: 's',
          oldVal: 'short'
        };

        delta = differ.compareStrings({}, delta);
        expect(delta.type).toEqual(syncEvents.REMOVE);

        delta = {
          newVal: 'same',
          oldVal: 'same'
        };

        delta = differ.compareStrings({}, delta);
        expect(delta.type).toEqual(syncEvents.NONE);
      });
    });

    describe('findAddedItem', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findAddedItem.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should find the added item from an array when comparing two arrays of strings', function () {
        var delta = {
          newVal: ['baz', 'foo', 'bar'],
          oldVal: ['foo', 'bar']
        };

        delta = differ.findAddedItem({}, delta);
        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(0);
        expect(delta.type).toEqual(syncEvents.ADD);
      });

      it('should find the added item from an array when comparing two arrays of objects', function () {
        var delta = {
          newVal: [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}],
          oldVal: [{foo: true}, {bar: 'yes'}]
        };

        delta = differ.findAddedItem({}, delta);
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);

      });

      it('should find the added item from an array when comparing two arrays of mixed types', function () {
        var delta = {
          newVal: ['foo', {baz: 'duh!'}, 'bar'],
          oldVal: ['foo', 'bar']
        };

        differ.findAddedItem({}, delta);
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(1);
      });
    });

    describe('findUpdatedItem', function () {
      it('should exist', function () {
        expect(!!differ.findUpdatedItem).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findUpdatedItem.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      //TODO: More tests
    });

    describe('findAddedString', function () {
      it('should exist', function () {
        expect(!!differ.findAddedString).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findAddedString.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should find the first new string when comparing two versions', function () {
        var delta = {
          oldVal: "I'm a teapot.",
          newVal: "I'm a little teapot."
        };

        differ.findAddedString({}, delta);
        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);
        expect(delta.type).toEqual(syncEvents.ADD);
      });
    });

    describe('findRemovedString', function () {
      it('should exist', function () {
        expect(!!differ.findRemovedString).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findRemovedString.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should find the removed string', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a teapot."
        };

        delta = differ.findRemovedString({}, delta);
        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);
        expect(delta.type).toEqual(syncEvents.REMOVE);


        delta = {
          oldVal: "I sure am a little teapot.",
          newVal: "You're a little teapot."
        };

        delta = differ.findRemovedString({}, delta);
        expect(delta.data).toEqual("You're");
        expect(delta.position).toEqual(0);
        expect(delta.type).toEqual(syncEvents.UPDATE);
      });
    });

    describe('findChangedString', function () {
      it('should exist', function () {
        expect(!!differ.findChangedString).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findChangedString.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should find a single difference between two strings of the same length', function () {
        var delta = {
          oldVal: "Can you find the needle in this haystack?",
          newVal: "Can you find the peanut in this haystack?"
        };

        differ.findChangedString({}, delta);
        expect(delta.data).toEqual('peanut');
        expect(delta.position).toEqual(17);
      });
    });

    describe('compareArrays', function () {
      it('should exist', function () {
        expect(!!differ.compareArrays).toBe(true);
      });

      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.compareArrays.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should determine the correct type of comparison to make', function () {
        var delta = {
          newVal: ['1'],
          oldVal: ['1','2']
        };

        differ.compareArrays({}, delta);
        expect(delta.type).toEqual(syncEvents.REMOVE);


        delta = {
          newVal: ['1','2'],
          oldVal: ['1']
        };

        delta = differ.compareArrays({}, delta);
        expect(delta.type).toEqual(syncEvents.ADD);

        delta = {
          newVal: ['1'],
          oldVal: ['2']
        };

        delta = differ.compareArrays({}, delta);
        expect(delta.type).toEqual(syncEvents.UPDATE);
      });

      it('should account for newly created arrays', function () {
        var delta = {
          newVal: ['foo']
        };

        delta = differ.compareArrays({}, delta);
        expect(delta.data).toEqual('foo');
      });
    })

    describe('determineDelta', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.determineDelta.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toBeUndefined();
      });

      it('should return an object with type, position, and data properties', function () {
        var delta = {
          oldVal: ['foo'],
          newVal: ['foo', 'bar']
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('bar');
      });

      it('should know when an array has removed an item', function () {
        var delta = {
          oldVal: ['foo', 'baz', 'bar'],
          newVal: ['foo', 'bar']
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.REMOVE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has added an item', function () {
        var delta = {
          oldVal: ['foo', 'bar'],
          newVal: ['foo', 'bar', 'baz']
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(2);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has an updated item', function () {
        var delta = {
          oldVal: ['foo', 'bar'],
          newVal: ['foo', 'baze']
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.UPDATE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baze');
      });

      it('should handle situations with no oldData', function () {
        var delta = {
          newVal: "I'm a teapot."
        };

        differ.determineDelta({}, delta);
        expect(delta.data).toEqual("I'm a teapot.");
        expect(delta.type).toEqual(syncEvents.CREATE);
      });

      it('should find the first diff in an added-to string.', function () {
        var delta = {
          newVal: "I'm a little teapot.",
          oldVal: "I'm a teapot."
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(6);
        expect(delta.data).toEqual('little ');
      });

      it('should find the first diff in a removed-from string', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a teapot."
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.data).toEqual('little ');
        expect(delta.type).toEqual(syncEvents.REMOVE);
        expect(delta.position).toEqual(6);
      });

      it('should treat a diff as an update when the diff length is greater than the length delta between old and new strings', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a big teapot."
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.data).toEqual('big');
        expect(delta.type).toEqual(syncEvents.UPDATE);
        expect(delta.position).toEqual(6);
      });

      it('should find the first diff in an equal-length string', function () {
        var delta = {
          oldVal: "I'm a stupid teapot.",
          newVal: "I'm a little teapot."
        };

        delta = differ.determineDelta({}, delta);
        expect(delta.data).toEqual('little');
        expect(delta.type).toEqual(syncEvents.UPDATE);
      });

      it('should return an event type of NONE if no new or old input is provided', function () {
        var delta = {};
        delta = differ.determineDelta({}, delta);
        expect(delta.type).toEqual(syncEvents.NONE);
      });
    });
  });

  it('should have a dictionary of event constants', function () {
    expect(syncEvents.GET).toBeDefined();
    expect(syncEvents.NONE).toBeDefined();
  });


  describe('$checkArrayForDupe', function () {
    it('should exist', function () {
      expect(!!differ.checkArrayForDupe).toBe(true);
    });

    it('should have the correct signature', function () {
      var args = captureFunctionArgs(differ.checkArrayForDupe.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    });

    it('should add a duplicate property to delta if newValue is equal to binder.data', function () {
      var binder = {data: ['foo', 'bar']}
        , delta = {data: 'bar'};

      differ.checkArrayForDupe(binder, delta);
      expect(delta.duplicate).toBe(true);
    });

    it('should not add a duplicate property to a delta if newVal is NOT equal to binder.data', function () {
      var binder = {data: ['foo']}
        , delta = {newVal: ['bar']};

      delta = differ.checkArrayForDupe(binder, delta);
      expect(!delta.duplicate).toBe(true);
    });

    it('should use binder.key to check for dupes if present', function () {
      var binder = {data: [{id: 1}], key: 'id'}
        , delta = {data: {id: 1, foo:'bar'}};

      delta = differ.checkArrayForDupe(binder, delta);
      expect(delta.duplicate).toBe(true);
    });
  });
});