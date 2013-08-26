function DeltaFactory () {};

DeltaFactory.prototype.addChange = function (change) {
  if (!change.type) throw new Error('Change must contain a type');

  this.changes.push(change);
};


DeltaFactory.prototype.updateObject = function (object) {
  this.object = object;
  angular.forEach(this.changes, function (change, i, list) {
    list[i].object = object;
  });
};

/*
  Q: Why should this be its own factory?

  A: To provide a basic interface and validation for
     changes attached to deltas.

  Q: Why shouldn't a simple array of changes be passed
     between models and protocols via Binder?

  A: Having a delta object allows the ability to supply arbitrary
     metadata for a changeset.
*/
angular.module('OmniBinder')
  .factory('obDelta', function () {
    return function (change) {
      var delta = Object.create(DeltaFactory.prototype);
      DeltaFactory.call(delta);
      delta.changes = [];

      if (change) delta.addChange(change);

      return delta;
    };
  });