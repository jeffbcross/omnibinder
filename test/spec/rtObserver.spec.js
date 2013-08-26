describe('rtObserver', function () {
  var rtObserver, scope, obBinderTypes;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function ($rootScope, _rtObserver_, _obBinderTypes_) {
    scope = $rootScope;
    obBinderTypes = _obBinderTypes_;
    rtObserver = _rtObserver_;
  }));


  it('should exist', function () {
    expect(!!rtObserver).toBe(true);
  });


  describe('observeCollection', function () {
    it('should be a function', function () {
      expect(typeof rtObserver.observeCollection).toBe('function');
    });


    it('should immediately respond to model changes', function () {
      var caller = {callback: function () {}};
      var spy = spyOn(caller, 'callback');

      scope.myModel = ['foobar'];

      rtObserver.observeCollection(obBinderTypes.COLLECTION, scope, 'myModel', caller.callback);

      scope.myModel.push('baz');
      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });
})