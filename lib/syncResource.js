'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope) {
    function Synchronizer (config) {
      var scope = config.scope
        , lastUpdate
        , transport = Object.create(config.Transport.prototype);

      config.Transport.call(transport, config);

      var bindToObject = function () {
        //Get initial object from server
        transport.getObject(config.id, function (obj) {
          scope[config.model] = obj;
          scope.$digest();
        });
        
        //Listen for changes
        transport.subscribeToObject(config.id, function (message) {
          scope[config.model] = message;
          lastUpdate = angular.copy(message);
          scope.$digest();
        });
        
        //Push changes
        scope.$watch(config.model, function (newVal, oldVal) {
          if (!angular.equals(newVal, oldVal) && !angular.equals(newVal, lastUpdate)) {
            transport.updateObject(config.id, newVal);
          }
          
        }, true);
      }

      var bindToCollection = function () {
        transport.getCollection(function (models) {
          scope[config.model] = models;
          scope.$digest();
        });
        
        transport.subscribeToCollection(function (event, model) {
          switch (event) {
            case 'create':
              if (Array.isArray(scope[config.model])) {
                scope[config.model].push(model);
              }
              else {
                scope[config.model] = [model];
              }    
              break;
            case 'delete':
              var found;
              scope[config.model].forEach(function (item, i, list) {
                if(found) return;
                if (item.id === model.id) {
                  list.splice(i, 1);
                  found = true;
                }
              });
              break;
            case 'update':
              var found;
              scope[config.model].forEach(function (item, i, list) {
                if(found) return;
                if (item.id === model.id) {
                  list[i] = model;
                  found = true;
                }
              });
              break;
            default:
              //NOOP
          }

          scope.$digest();
        });

        //Push changes
        scope.$watch(config.model, function (newVal, oldVal) {
          if (newVal && !Array.isArray(newVal)) throw new Error("Synced models without an id must be an Array.");

          //TODO
          
        }, true);
      };

      if (config.id) {
        bindToObject();
      }
      else {
        bindToCollection();
      }
    }

    return function (config) {
      return new Synchronizer(config);
    }
  });
