angular.module('SyncResource')
  .factory('$binder', function () {
    function Binder(scope, modelName, query, transform) {
      if (!scope) throw new Error('Scope is required');
      if (!modelName) throw new Error('modelName is required');

      this.scope = scope;
      this.model = modelName;
      this.query = query;
      this.transform = transform;
    }

    Binder.prototype.val = function () {
      return this.scope[this.model];
    };

    return function () {
      var binder = Object.create(Binder.prototype);
      Binder.apply(binder, arguments);
      return binder;
    };
  });