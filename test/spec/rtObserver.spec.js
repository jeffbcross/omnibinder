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
      var caller = {callback: function () {}};
      var spy = spyOn(caller, 'callback');

      scope.myModel = ['foobar'];

      obObserver.observeCollection(obBinderTypes.COLLECTION, scope, 'myModel', caller.callback);

      scope.myModel.push('baz');
      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });
})