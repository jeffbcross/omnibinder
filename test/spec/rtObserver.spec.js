describe('rtObserver', function () {
  var rtObserver, scope, binderTypes;

  beforeEach(module('Binder'));
  beforeEach(inject(function ($rootScope, _rtObserver_, _binderTypes_) {
    scope = $rootScope;
    binderTypes = _binderTypes_;
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

      rtObserver.observeCollection(binderTypes.COLLECTION, scope, 'myModel', caller.callback);

      scope.myModel.push('baz');
      scope.$digest();

      expect(spy).toHaveBeenCalled();
    });
  });
})