angular.module('SyncResource')
  .factory('$binder', function ($timeout, $q) {
    function Binder(options) {
      var self = this;

      if (!options.scope) throw new Error('scope is required');
      if (!options.model) throw new Error('model is required');
      if (options.onProtocolChange && typeof options.onProtocolChange !== 'function' && !Array.isArray(options.onProtocolChange)) throw new Error('onProtocolChange must be a function or array');
      if (options.onModelChange && typeof options.onModelChange !== 'function') throw new Error('onModelChange must be a function');

      this.scope = options.scope;
      this.model = options.model;
      this.query = options.query;
      this.type = options.type;
      this.onModelChange = options.onModelChange || this.onModelChange;;
      this.onProtocolChange = options.onProtocolChange || this.onProtocolChange;
    }

    Binder.prototype.onChange = function (binder, delta) {
      var deferred = $q.defer();
      $timeout(function () {
        deferred.resolve(delta);
      }, 0);
      return deferred.promise;
    }

    Binder.prototype.onModelChange = Binder.prototype.onChange;
    Binder.prototype.onProtocolChange = Binder.prototype.onChange;

    Binder.prototype.val = function () {
      return this.scope[this.model];
    };

    return function () {
      var binder = Object.create(Binder.prototype);
      Binder.call(binder, arguments[0]);
      return binder;
    };
  });