describe('Differ', function () {
  var differ, syncEvents, captureFunctionArgs;

  beforeEach(module('SyncResource'))
  beforeEach(inject(function (_$differ_, _syncEvents_, $captureFuncArgs) {
    differ = _$differ_;
    syncEvents = _syncEvents_;
    captureFunctionArgs = $captureFuncArgs;
  }));

  describe('Delta Parsing', function () {
    describe('findRemovedItem', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findRemovedItem.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should find the removed item from an array when comparing two arrays of strings', function () {
        var delta = {
          newVal: ['foo', 'bar'],
          oldVal: ['foo', 'bar', 'baz']
        }, callback;

        differ.findRemovedItem({}, delta, function () {
          expect(delta.data).toEqual('baz');
          expect(delta.position).toEqual(2);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the removed item from an array when comparing two arrays of objects', function () {
        var delta = {
          newVal: [{foo: true}, {bar: 'yes'}],
          oldVal: [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}]
        }, callback;
        
        differ.findRemovedItem({}, delta, function () {
          expect(typeof delta).toEqual('object');
          expect(delta.data.baz).toEqual('duh!');
          expect(delta.position).toEqual(2);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the removed item from an array when comparing two arrays of mixed types', function () {
        var delta = {
          newVal: ['foo', 'bar'],
          oldVal: ['foo', 'bar', {baz: 'duh!'}]
        }, callback;

        differ.findRemovedItem({}, delta, function () {
          expect(typeof delta).toEqual('object');
          expect(delta.data.baz).toEqual('duh!');
          expect(delta.position).toEqual(2);
          callback = true;
        });

        expect(callback).toBe(true);
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should determine the correct type of comparison to make', function () {
        var delta = {
          newVal: 'long',
          oldVal: 'l'
        }, callback = 0;
        differ.compareStrings({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.ADD);
          callback++;
        });

        delta = {
          newVal: 's',
          oldVal: 'short'
        };

        differ.compareStrings({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.REMOVE);
          callback++;
        });

        delta = {
          newVal: 'same',
          oldVal: 'same'
        };

        differ.compareStrings({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.NONE);
          callback++;
        });

        expect(callback).toEqual(3);
      });
    });
    
    describe('findAddedItem', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.findAddedItem.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should find the added item from an array when comparing two arrays of strings', function () {
        var delta = {
          newVal: ['baz', 'foo', 'bar'],
          oldVal: ['foo', 'bar']
        }, callback;

        differ.findAddedItem({}, delta, function () {
          expect(delta.data).toEqual('baz');
          expect(delta.position).toEqual(0);
          expect(delta.type).toEqual(syncEvents.ADD);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the added item from an array when comparing two arrays of objects', function () {
        var delta = {
          newVal: [{foo: true}, {bar: 'yes'}, {baz: 'duh!'}],
          oldVal: [{foo: true}, {bar: 'yes'}]
        }, callback;

        differ.findAddedItem({}, delta, function () {
          expect(delta.data.baz).toEqual('duh!');
          expect(delta.position).toEqual(2);
          callback = true;
        });
        expect(callback).toBe(true);
      });

      it('should find the added item from an array when comparing two arrays of mixed types', function () {
        var delta = {
          newVal: ['foo', {baz: 'duh!'}, 'bar'],
          oldVal: ['foo', 'bar']
        }, callback;

        differ.findAddedItem({}, delta, function () {
          expect(delta.data.baz).toEqual('duh!');
          expect(delta.position).toEqual(1);  
          callback = true;
        });

        expect(callback).toBe(true);
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should find the first new string when comparing two versions', function () {
        var delta = {
          oldVal: "I'm a teapot.",
          newVal: "I'm a little teapot."
        }, callback;

        differ.findAddedString({}, delta, function () {
          expect(delta.data).toEqual('little ');
          expect(delta.position).toEqual(6);
          expect(delta.type).toEqual(syncEvents.ADD);
          callback = true;
        });
        
        expect(callback).toBe(true);
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should find the removed string', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a teapot."
        }, callback = 0;
        
        differ.findRemovedString({}, delta, function (){
          expect(delta.data).toEqual('little ');
          expect(delta.position).toEqual(6);
          expect(delta.type).toEqual(syncEvents.REMOVE);
          callback++;
        });

        delta = {
          oldVal: "I sure am a little teapot.",
          newVal: "You're a little teapot."
        };
        
        differ.findRemovedString({}, delta, function () {
          expect(delta.data).toEqual("You're");
          expect(delta.position).toEqual(0);
          expect(delta.type).toEqual(syncEvents.UPDATE);
          callback++;
        });
        expect(callback).toEqual(2);
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should find a single difference between two strings of the same length', function () {
        var delta = {
          oldVal: "Can you find the needle in this haystack?",
          newVal: "Can you find the peanut in this haystack?"
        }, callback;

        differ.findChangedString({}, delta, function () {
          expect(delta.data).toEqual('peanut');
          expect(delta.position).toEqual(17);
          callback = true;
        });

        expect(callback).toBe(true);
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
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should determine the correct type of comparison to make', function () {
        var delta = {
          newVal: ['1'],
          oldVal: ['1','2']
        }, callback = 0;

        differ.compareArrays({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.REMOVE);
          callback++;
        });

        delta = {
          newVal: ['1','2'],
          oldVal: ['1']
        };
        differ.compareArrays({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.ADD);
          callback++;
        });
        
        delta = {
          newVal: ['1'],
          oldVal: ['2']
        };
        differ.compareArrays({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.UPDATE);
          callback++;
        });
        
        expect(callback).toEqual(3);
      });

      it('should account for newly created arrays', function () {
        var delta = {
          newVal: ['foo', 'bar']
        };

        differ.compareArrays({}, delta, function () {
          expect(delta.data).toEqual(['foo', 'bar']);
        });
      });
    })

    describe('determineDelta', function () {
      it('should implement proper middleware signature', function () {
        var args = captureFunctionArgs(differ.determineDelta.toString());
        expect(args[0]).toEqual('binder');
        expect(args[1]).toEqual('delta');
        expect(args[2]).toEqual('next');
        expect(args[3]).toBeUndefined();
      });

      it('should return an object with type, position, and data properties', function () {
        var delta = {
          oldVal: ['foo'],
          newVal: ['foo', 'bar']
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.ADD);
          expect(delta.position).toEqual(1);
          expect(delta.data).toEqual('bar');
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should know when an array has removed an item', function () {
        var delta = {
          oldVal: ['foo', 'baz', 'bar'],
          newVal: ['foo', 'bar']
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.REMOVE);
          expect(delta.position).toEqual(1);
          expect(delta.data).toEqual('baz');
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should know when an array has added an item', function () {
        var delta = {
          oldVal: ['foo', 'bar'],
          newVal: ['foo', 'bar', 'baz']
        }, callback;

        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.ADD);
          expect(delta.position).toEqual(2);
          expect(delta.data).toEqual('baz');
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should know when an array has an updated item', function () {
        var delta = {
          oldVal: ['foo', 'bar'],
          newVal: ['foo', 'baze']
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.UPDATE);
          expect(delta.position).toEqual(1);
          expect(delta.data).toEqual('baze');
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should handle situations with no oldData', function () {
        var delta = {
          newVal: "I'm a teapot."
        }, callback;

        differ.determineDelta({}, delta, function () {
          expect(delta.data).toEqual("I'm a teapot.");
          expect(delta.type).toEqual(syncEvents.CREATE);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the first diff in an added-to string.', function () {
        var delta = {
          newVal: "I'm a little teapot.",
          oldVal: "I'm a teapot."
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.ADD);
          expect(delta.position).toEqual(6);
          expect(delta.data).toEqual('little ');
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the first diff in a removed-from string', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a teapot."
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.data).toEqual('little ');
          expect(delta.type).toEqual(syncEvents.REMOVE);
          expect(delta.position).toEqual(6);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should treat a diff as an update when the diff length is greater than the length delta between old and new strings', function () {
        var delta = {
          oldVal: "I'm a little teapot.",
          newVal: "I'm a big teapot."
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.data).toEqual('big');
          expect(delta.type).toEqual(syncEvents.UPDATE);
          expect(delta.position).toEqual(6);

          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should find the first diff in an equal-length string', function () {
        var delta = {
          oldVal: "I'm a stupid teapot.",
          newVal: "I'm a little teapot."
        }, callback;
        
        differ.determineDelta({}, delta, function () {
          expect(delta.data).toEqual('little');
          expect(delta.type).toEqual(syncEvents.UPDATE);
          callback = true;
        });

        expect(callback).toBe(true);
      });

      it('should return an event type of NONE if no new or old input is provided', function () {
        
        var delta = {};
        differ.determineDelta({}, delta, function () {
          expect(delta.type).toEqual(syncEvents.NONE);
        });
      })
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
      expect(args[2]).toEqual('next');
      expect(args[3]).toBeUndefined();
    });

    it('should add a duplicate property to delta if newValue is equal to binder.data', function () {
      var binder = {data: ['foo', 'bar']}
        , delta = {data: 'bar'}
        , callback;

      differ.checkArrayForDupe(binder, delta, function () {
        expect(delta.duplicate).toBe(true);
        callback = true;
      });

      expect(callback).toBe(true);
    });

    it('should not add a duplicate property to a delta if newVal is NOT equal to binder.data', function () {
      var binder = {data: ['foo']}
        , delta = {newVal: ['bar']}
        , callback;

      differ.checkArrayForDupe(binder, delta, function () {
        expect(!delta.duplicate).toBe(true);
        callback = true;
      });

      expect(callback).toBe(true);
    })
  });
});