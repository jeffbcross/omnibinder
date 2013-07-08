describe('$checkArrayForDupe', function () {
  var $checkArrayForDupe, $captureFuncArgs;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$checkArrayForDupe_, _$captureFuncArgs_) {
    $checkArrayForDupe = _$checkArrayForDupe_;
    $captureFuncArgs = _$captureFuncArgs_;
  }));
  
  it('should exist', function () {
    expect(!!$checkArrayForDupe).toBe(true);
  });

  it('should have the correct signature', function () {
    var args = $captureFuncArgs($checkArrayForDupe.toString());
    expect(args[0]).toEqual('binder');
    expect(args[1]).toEqual('delta');
    expect(args[2]).toEqual('next');
    expect(args[3]).toBeUndefined();
  });

  it('should add a duplicate property to delta if newValue is equal to binder.data', function () {
    var binder = {data: ['foo', 'bar']}
      , delta = {data: 'bar'}
      , callback;

    $checkArrayForDupe(binder, delta, function () {
      expect(delta.duplicate).toBe(true);
      callback = true;
    });

    expect(callback).toBe(true);
  });

  it('should not add a duplicate property to a delta if newVal is NOT equal to binder.data', function () {
    var binder = {data: ['foo']}
      , delta = {newVal: ['bar']}
      , callback;

    $checkArrayForDupe(binder, delta, function () {
      expect(!delta.duplicate).toBe(true);
      callback = true;
    });

    expect(callback).toBe(true);
  })
});