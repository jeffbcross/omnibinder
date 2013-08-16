describe('$binderTypes', function () {
  var $binderTypes;
  beforeEach(module('Binder'));
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

  it('should have boolean type constant', function () {
    expect($binderTypes.BOOLEAN).toEqual('boolean');
  });

  it('should have string type constant', function () {
    expect($binderTypes.STRING).toEqual('string');
  });

  it('should have number type constant', function () {
    expect($binderTypes.NUMBER).toEqual('number');
  });

  it('should have binary type constant', function () {
    expect($binderTypes.BINARY).toEqual('binary');
  });

  it('should have binary stream type constant', function () {
    expect($binderTypes.BINARY_STREAM).toEqual('binaryStream');
  });
});
