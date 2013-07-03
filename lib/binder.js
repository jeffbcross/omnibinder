angular.module('SyncResource')
  .factory('$binder', function () {
    function Binder(options) {

      if (!options.scope) throw new Error('scope is required');
      if (!options.model) throw new Error('model is required');
      if (options.onProtocolChange && typeof options.onProtocolChange !== 'function' && !Array.isArray(options.onProtocolChange)) throw new Error('onProtocolChange must be a function or array');

      this.scope = options.scope;
      this.model = options.model;
      this.query = options.query;
      this.onProtocolChange = options.onProtocolChange;
      this.onModelChange = options.onModelChange;
    }

    Binder.prototype.val = function () {
      return this.scope[this.model];
    };

    return function () {
      var binder = Object.create(Binder.prototype);
      Binder.call(binder, arguments[0]);
      return binder;
    };
  });