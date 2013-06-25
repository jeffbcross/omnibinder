describe('$binder', function () {
  var $binder, scope;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$binder_, $rootScope) {
    $binder = _$binder_;
    scope = $rootScope;
  }));

  it('should exist', function () {
    expect(!!$binder).toBe(true);
  });

  it('should accept scope as the first argument', function () {
    scope.hello = 'world';
    var binder = $binder(scope, 'hello');
    expect(binder.scope.hello).toEqual('world');
  });

  it('should accept a model name as the second argument', function () {
    scope.super = 'heroic';
    var binder = $binder(scope, 'super');
    expect(binder.model).toEqual('super');
    expect(binder.val()).toEqual('heroic');
  });

  it('should throw an error when scope is not provided', function () {
    var msg;
    try {
      var binder = $binder(null, 'super');  
    }
    catch (e) {
      msg = e.message;
    }
    expect(msg).toEqual('Scope is required');
  });

  it('should throw an error when modelName is not provided', function () {
    var msg;

    try {
      var binder = $binder(scope);
    }
    catch (e) {
      msg = e.message;
    }

    expect(msg).toEqual('modelName is required');
  });
});