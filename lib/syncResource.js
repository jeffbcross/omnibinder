'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q) {
    function Synchronizer (config) {
      var self = this;
      this.config = config;
    }

    Synchronizer.prototype.bind = function (query, model) {
      var self = this
        , deferred = $q.defer();
      
      //Listen for changes
      this.config.protocol.subscribe(query, function (ev, message) {
        self.lastUpdate = angular.copy(message);
        
        if (ev === 'read') {
          deferred.resolve(message);
        }
        else {
          self.config.scope[model] = message;

          //TODO: Get rid of this.
          self.config.scope.$apply();
        }
      });
      
      //Push changes
      this.config.scope.$watch(model, function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal) && !angular.equals(newVal, self.lastUpdate)) {
          self.config.protocol.update(query, newVal);
        }
      }, true);

      return deferred.promise;
    };

    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    }
  });
