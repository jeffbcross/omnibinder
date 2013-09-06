describe('Binder>Observer Integration', function () {
  var obObserver,
      obBinder,
      scope,
      protocol,
      obBinderTypes;

  beforeEach(module('OmniBinder'));

  beforeEach(inject(function ($rootScope, _obBinder_, _obObserver_, _obBinderTypes_) {
    scope = $rootScope;
    obBinderTypes = _obBinderTypes_;
    obObserver = _obObserver_;
    obBinder = _obBinder_;

    protocol = {
      processChanges: angular.noop,
      subscribe: angular.noop
    };
  }));


  it('should call obObserver.observeCollection when creating a binder instance', function () {
    var binder,
        spy = spyOn(obObserver, 'observeCollection');

    scope.myModel = [];

    binder = obBinder(scope, 'myModel', protocol, {
      type: obBinderTypes.COLLECTION
    });

    expect(spy).toHaveBeenCalled();
  });


  it('should call onModelChange when a bound collection has had an item added to it', function () {
    var binder,
        spy;

    runs(function () {
      scope.myCollection = [];
      spy = spyOn(Binder.prototype, 'onModelChange');
      binder = obBinder(scope, 'myCollection', protocol, {
        type: obBinderTypes.COLLECTION
      });

      scope.myCollection.push({foo: 'bar'});
    });

    waitsFor(function () {
      return spy.callCount;
    }, 100, "spy to be called");

    runs(function () {
      expect(spy).toHaveBeenCalled();
    });
  });
})