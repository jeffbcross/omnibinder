describe('Differ', function () {
  var differ, syncEvents;

  beforeEach(module('SyncResource'))
  beforeEach(inject(function (_differ_, _syncEvents_) {
    differ = _differ_;
    syncEvents = _syncEvents_;
  }));

  describe('Delta Parsing', function () {
    describe('findRemovedItem', function () {
      it('should find the removed item from an array when comparing two arrays of strings', function () {
        var newArr = ['foo', 'bar'];
        var oldArr = ['foo', 'bar', 'baz'];
        var delta = differ.findRemovedItem(newArr, oldArr);

        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of objects', function () {
        var newArr = [{foo: true}, {bar: 'yes'}];
        var oldArr = [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}];
        var delta = differ.findRemovedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });

      it('should find the removed item from an array when comparing two arrays of mixed types', function () {
        var newArr = ['foo', 'bar'];
        var oldArr = ['foo', 'bar', {baz: 'duh!'}];

        var delta = differ.findRemovedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });
    });

    describe('compareStrings', function () {
      it('should exist', function () {
        expect(!!differ.compareStrings).toBe(true);
      });

      it('should determine the correct type of comparison to make', function () {
        expect(differ.compareStrings('long', 'l').type).toEqual(syncEvents.ADD);
        expect(differ.compareStrings('s', 'short').type).toEqual(syncEvents.REMOVE);
        expect(differ.compareStrings('same', 'same').type).toEqual(syncEvents.UPDATE);
      });
    });
    
    describe('findAddedItem', function () {
      it('should find the added item from an array when comparing two arrays of strings', function () {
        var newArr = ['baz', 'foo', 'bar'];
        var oldArr = ['foo', 'bar'];
        var delta = differ.findAddedItem(newArr, oldArr);

        expect(delta.data).toEqual('baz');
        expect(delta.position).toEqual(0);
      });

      it('should find the added item from an array when comparing two arrays of objects', function () {
        var newArr = [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}];
        var oldArr = [{foo: true}, {bar: 'yes'}];
        
        var delta = differ.findAddedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(2);
      });

      it('should find the added item from an array when comparing two arrays of mixed types', function () {
        var newArr = ['foo', {baz: 'duh!'}, 'bar'];
        var oldArr = ['foo', 'bar'];

        var delta = differ.findAddedItem(newArr, oldArr);

        expect(typeof delta).toEqual('object');
        expect(delta.data.baz).toEqual('duh!');
        expect(delta.position).toEqual(1);
      });
    });

    describe('findUpdatedItem', function () {
      it('should exist', function () {
        expect(!!differ.findUpdatedItem).toBe(true);
      });

      //TODO: More tests
    });

    describe('findAddedString', function () {
      it('should exist', function () {
        expect(!!differ.findAddedString).toBe(true);
      });

      it('should find the first new string when comparing two versions', function () {
        var oldStr = "I'm a teapot.";
        var newStr = "I'm a little teapot.";
        var delta = differ.findAddedString(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);
      });
    });

    describe('findRemovedString', function () {
      it('should exist', function () {
        expect(!!differ.findRemovedString).toBe(true);
      });

      it('should find the removed string', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a teapot.";
        var delta = differ.findRemovedString(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.position).toEqual(6);

        var oldStr = "I sure am a little teapot.";
        var newStr = "You're a little teapot.";
        var delta = differ.findRemovedString(newStr, oldStr);

        expect(delta.data).toEqual("You're");
        expect(delta.position).toEqual(0);
      });
    });

    describe('findChangedString', function () {
      it('should exist', function () {
        expect(!!differ.findChangedString).toBe(true);
      });

      it('should find a single difference between two strings of the same length', function () {
        var oldStr = "Can you find the needle in this haystack?";
        var newStr = "Can you find the peanut in this haystack?";
        var delta = differ.findChangedString(newStr, oldStr);

        expect(delta.data).toEqual('peanut');
        expect(delta.position).toEqual(17);
      });
    });

    describe('compareArrays', function () {
      it('should exist', function () {
        expect(!!differ.compareArrays).toBe(true);
      });

      it('should determine the correct type of comparison to make', function () {
        expect(differ.compareArrays(['1'], ['1','2']).type).toEqual(syncEvents.REMOVE);
        expect(differ.compareArrays(['1','2'], ['1']).type).toEqual(syncEvents.ADD);
        expect(differ.compareArrays(['1'],['2']).type).toEqual(syncEvents.UPDATE);
      });
    })

    describe('determineDelta', function () {
      it('should return an object with type, position, and data properties', function () {
        var oldArr = ['foo'];
        var newArr = ['foo', 'bar'];
        var delta = differ.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('bar');
      });

      it('should know when an array has removed an item', function () {
        var oldArr = ['foo', 'baz', 'bar'];
        var newArr = ['foo', 'bar'];
        var delta = differ.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncEvents.REMOVE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has added an item', function () {
        var oldArr = ['foo', 'bar'];
        var newArr = ['foo', 'bar', 'baz'];
        var delta = differ.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(2);
        expect(delta.data).toEqual('baz');
      });

      it('should know when an array has an updated item', function () {
        var oldArr = ['foo', 'bar'];
        var newArr = ['foo', 'baze'];
        var delta = differ.determineDelta(newArr, oldArr);

        expect(delta.type).toEqual(syncEvents.UPDATE);
        expect(delta.position).toEqual(1);
        expect(delta.data).toEqual('baze');
      });

      it('should handle situations with no oldData', function () {
        var newStr = "I'm a teapot.";
        var delta = differ.determineDelta(newStr);

        expect(delta.data).toEqual("I'm a teapot.");
        expect(delta.type).toEqual(syncEvents.CREATE);
      });

      it('should find the first diff in an added-to string.', function () {
        var oldStr = "I'm a teapot.";
        var newStr = "I'm a little teapot.";
        var delta = differ.determineDelta(newStr, oldStr);

        expect(delta.type).toEqual(syncEvents.ADD);
        expect(delta.position).toEqual(6);
        expect(delta.data).toEqual('little ');
      });

      it('should find the first diff in a removed-from string', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a teapot.";
        var delta = differ.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('little ');
        expect(delta.type).toEqual(syncEvents.REMOVE);
        expect(delta.position).toEqual(6);
      });

      it('should treat a diff as an update when the diff length is greater than the length delta between old and new strings', function () {
        var oldStr = "I'm a little teapot.";
        var newStr = "I'm a big teapot.";
        var delta = differ.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('big');
        expect(delta.type).toEqual(syncEvents.UPDATE);
        expect(delta.position).toEqual(6);
      });

      it('should find the first diff in an equal-length string', function () {
        var oldStr = "I'm a stupid teapot.";
        var newStr = "I'm a little teapot.";
        var delta = differ.determineDelta(newStr, oldStr);

        expect(delta.data).toEqual('little');
        expect(delta.type).toEqual(syncEvents.UPDATE);
      });

      it('should return an event type of NONE if no new or old input is provided', function () {
        var msg;
        try {
          var delta = differ.determineDelta(null, null);  
        }
        catch (e) {
          msg = e;
        }
        expect(delta.type).toEqual(syncEvents.NONE);
      })
    });
  });

  it('should have a dictionary of event constants', function () {
    expect(syncEvents.GET).toBeDefined();
    expect(syncEvents.NONE).toBeDefined();
  });
});