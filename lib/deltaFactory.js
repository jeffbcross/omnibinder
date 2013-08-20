function DeltaFactory () {};

DeltaFactory.prototype.addChange = function (change) {
  if (!change.type) throw new Error('Change must contain a type');
  this.changes.push(change);
};

angular.module('Binder')
  .factory('deltaFactory', function () {
    return function () {
      var delta = Object.create(DeltaFactory.prototype);
      DeltaFactory.call(delta);
      delta.changes = [];
      return delta;
    };
  })