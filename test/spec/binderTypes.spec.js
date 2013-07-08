describe('$binderTypes', function () {
  var $binderTypes;
  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$binderTypes_) {
    $binderTypes = _$binderTypes_;
  }));

  it('should exist', function () {
    expect(!!$binderTypes).toBe(true);
  });

  it('should have collection type constant', function () {
    expect($binderTypes.COLLECTION).toEqual('collection');
  });

  it('should have object type constant', function () {
    expect($binderTypes.OBJECT).toEqual('object');
  });
});