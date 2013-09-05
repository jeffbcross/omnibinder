describe('obObserver', function () {
  var obObserver, scope, obBinderTypes;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function ($rootScope, _obObserver_, _obBinderTypes_) {
    scope = $rootScope;
    obBinderTypes = _obBinderTypes_;
    obObserver = _obObserver_;
  }));


  it('should exist', function () {
    expect(!!obObserver).toBe(true);
  });


  describe('observeCollection', function () {
    if (!Object.observe) return
    it('should be a function', function () {
      expect(typeof obObserver.observeCollection).toBe('function');
    });


    it('should immediately respond to model changes', function () {
      var spy = spyOn(angular, 'noop');
      runs(function () {
        scope.myModel = [{foo: 'bar'}];

        obObserver.observeCollection(scope.myModel, angular.noop);

        scope.myModel.push({bar: 'baz'});
        scope.$digest();
      });

      waitsFor(function () {
        return spy.callCount;
      }, 100, 'spy to be called');

      runs(function () {
        expect(spy).toHaveBeenCalled();
      });
    });


    it('should respond to changes to objects that were already in the model array', function () {
      var spy = spyOn(angular, 'noop');

      runs(function () {
        scope.myModel = [{foo: 'bar'}];

        obObserver.observeCollection(scope.myModel, angular.noop);

        scope.myModel[0].foo = 'changed';
      });

      waitsFor(function () {
        return spy.callCount;
      }, 250, 'spy to be called');

      runs(function () {
        expect(spy).toHaveBeenCalled();
        expect(spy.callCount).toBe(1);
      });
    });


    it('should respond to changes to objects that were added within the model array', function () {
      var spy = spyOn(angular, 'noop');
      var initialObject = {foo: 'bar'};
      var secondObject = {baz: 'bar'};
      var changes = [{addedCount: 1, removed: [initialObject], index: 0}];
      var secondChanges = [{ addedCount: 1, removed: [{baz: 'bar'}], index: 0 }];

      runs(function () {
        scope.myModel = [initialObject];

        obObserver.observeCollection(scope.myModel, angular.noop);

        scope.myModel.splice(0, 1, secondObject);
      });

      waitsFor(function () {
        return spy.callCount;
      }, 100, 'spy to be called');

      runs(function () {
        expect(spy).toHaveBeenCalledWith(changes);
        expect(spy.callCount).toBe(1);

        spy.reset();
        scope.myModel[0].baz = 'updated';
      });

      waitsFor(function () {
        return spy.callCount;
      }, 250, "spy to be called a 2nd time");

      runs(function () {
        expect(spy).toHaveBeenCalledWith(secondChanges);
        expect(spy.callCount).toBe(1);
      });
    });


    it('should unobserve objects after they\'ve been removed from the collection', function () {
      var spy, obj, collection, i = 0;

      runs(function () {
        spy = spyOn(angular, 'noop');
        obj = {foo: 'bar'};
        collection = [obj];

        obObserver.observeCollection(collection, angular.noop);
        collection.splice(0, 1);
      });

      waitsFor(function () {
        return ++i > 10;
      }, 100, "10 loops");

      runs(function () {
        obj.foo = 'baz';
      });

      waitsFor(function () {
        return ++i > 20;
      }, 100, "10 more loops");

      runs(function () {
        expect(spy.callCount).toBe(1);
      });
    });
  });
});
