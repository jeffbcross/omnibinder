describe('obBinderTypes', function () {
  var obBinderTypes;
  beforeEach(module('OmniBinder'));
  beforeEach(inject(function (_obBinderTypes_) {
    obBinderTypes = _obBinderTypes_;
  }));

  it('should exist', function () {
    expect(!!obBinderTypes).toBe(true);
  });

  it('should have collection type constant', function () {
    expect(obBinderTypes.COLLECTION).toEqual('collection');
  });

  it('should have object type constant', function () {
    expect(obBinderTypes.OBJECT).toEqual('object');
  });

  it('should have boolean type constant', function () {
    expect(obBinderTypes.BOOLEAN).toEqual('boolean');
  });

  it('should have string type constant', function () {
    expect(obBinderTypes.STRING).toEqual('string');
  });

  it('should have number type constant', function () {
    expect(obBinderTypes.NUMBER).toEqual('number');
  });

  it('should have binary type constant', function () {
    expect(obBinderTypes.BINARY).toEqual('binary');
  });

  it('should have binary stream type constant', function () {
    expect(obBinderTypes.BINARY_STREAM).toEqual('binaryStream');
  });
});
