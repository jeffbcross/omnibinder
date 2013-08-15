'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q, $binder, $differ, $modelWriter, syncEvents, unHash) {
    function Synchronizer (config) {
      this.config = config;
    }









    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    };
  });
