'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope) {
    function Synchronizer (config) {
      var self = this;

      this.config = config;

      // var bindToObject = function () {
      //   //Get initial object from server
      //   this.config.protocol.getObject(config.id, function (obj) {
      //     this.config.scope[config.model] = obj;
      //     this.config.scope.$digest();
      //   });
        
      //   //Listen for changes
      //   this.config.protocol.subscribeToObject(config.id, function (message) {
      //     this.config.scope[config.model] = message;
      //     this.lastUpdate = angular.copy(message);
      //     this.config.scope.$digest();
      //   });
        
      //   //Push changes
      //   this.config.scope.$watch(config.model, function (newVal, oldVal) {
      //     if (!angular.equals(newVal, oldVal) && !angular.equals(newVal, this.lastUpdate)) {
      //       this.config.protocol.updateObject(config.id, newVal);
      //     }
          
      //   }, true);
      // }

      // var bindToCollection = function () {
      //   self.config.protocol.getCollection(function (models) {
      //     self.config.scope[self.config] = models;
      //     self.config.scope.$digest();
      //   });
        
      //   self.config.protocol.subscribeToCollection(function (event, model) {
      //     switch (event) {
      //       case 'create':
      //         if (Array.isArray(self.config.scope[self.config])) {
      //           self.config.scope[self.config].push(model);
      //         }
      //         else {
      //           self.config.scope[self.config] = [model];
      //         }    
      //         break;
      //       case 'delete':
      //         var found;
      //         self.config.scope[self.config].forEach(function (item, i, list) {
      //           if(found) return;
      //           if (item.id === model.id) {
      //             list.splice(i, 1);
      //             found = true;
      //           }
      //         });
      //         break;
      //       case 'update':
      //         var found;
      //         self.config.scope[self.config].forEach(function (item, i, list) {
      //           if(found) return;
      //           if (item.id === model.id) {
      //             list[i] = model;
      //             found = true;
      //           }
      //         });
      //         break;
      //       default:
      //         //NOOP
      //     }

      //     self.config.scope.$digest();
      //   });

    //     //Push changes
    //     self.config.scope.$watch(config.model, function (newVal, oldVal) {
    //       if (newVal && !Array.isArray(newVal)) throw new Error("Synced models without an id must be an Array.");

    //       //TODO
          
    //     }, true);
    //   };

    //   if (config.id) {
    //     bindToObject();
    //   }
    //   else {
    //     bindToCollection();
    //   }
    }

    Synchronizer.prototype.bind = function (query, model) {
      var self = this;
      //Get initial object from server
      this.config.scope[model] = this.config.protocol.get(query);
      
      //Listen for changes
      this.config.protocol.subscribe(query, function (message) {
        self.config.scope[self.config.model] = message;
        self.lastUpdate = angular.copy(message);
        self.config.scope.$digest();
      });
      
      //Push changes
      this.config.scope.$watch(this.config.model, function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal) && !angular.equals(newVal, self.lastUpdate)) {
          this.config.protocol.updateObject(this.config.id, newVal);
        }
        
      }, true);
    };

    return function (config) {
      return new Synchronizer(config);
    }
  });
