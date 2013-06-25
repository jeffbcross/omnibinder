'use strict';

angular.module('SyncResource')
  .factory('syncFirebase', function ($q, $rootScope, syncEvents) {
    function FirebaseProtocol (options) {
      if (!options || !options.url) throw new Error("FirebaseProtocol requires options.url");
      this.options = options;
      this.fb = new Firebase(options.url);
    };

    FirebaseProtocol.prototype.create = function (query, data) {
      var deferred = $q.defer();

      this.fb.child(query.path).push(data, function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });

      return deferred.promise;
    };

    FirebaseProtocol.prototype.read = function (query) {
      if (!query || !query.path) throw new Error('Read requires query.path');
      var deferred = $q.defer();

      $timeout(function () {
        deferred.resolve(this.fb.child(query.path).val());
      });

      return deferred.promise;
    };

    FirebaseProtocol.prototype.update = function (binder, query, data) {
      if (!query || !query.path) throw new Error('Update requires query.path');
      var deferred = $q.defer();
      
      this.fb.child(query.path).update(data, function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });

      return deferred.promise;
    };

    FirebaseProtocol.prototype.remove = function (query, delta) {
      console.log('firebase.remove', query, delta);
      var deferred = $q.defer()
        , ref = this.fb.child(query.path).startAt(delta.position).endAt(delta.position);

      ref.remove(function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });

      return deferred.promise;
    };

    FirebaseProtocol.prototype.pluck = function (list, item) {
      var found;
      angular.forEach(list, function (li, i) {
        if (found) return;
        if (item.id === li.id) {
          list.splice(i, 1);
          found = true;
        }
      });
    };

    FirebaseProtocol.prototype.updateItem = function (list, item) {
      var found;
      angular.forEach(list, function (li, i) {
        if (found) return;
        if (item.id === li.id) {
          list[i] = item;
          found = true;
        }
      });
    };

    FirebaseProtocol.prototype.subscribe = function (binder, query, callback) {
      if(!query || !query.path) throw new Error('Subscribe requires query.path');
      
      // this.fb.child(query.path).once('value', function (snapshot) {
      //   callback.call(this, syncEvents.GET, snapshot.val());
      // });

      this.fb.child(query.path).on('child_changed', function (snapshot) {
        callback.call(this, syncEvents.UPDATE, snapshot.val());
      });

      this.fb.child(query.path).on('child_added', function (snapshot) {
        callback.call(this, syncEvents.ADD, snapshot.val());
      });

      this.fb.child(query.path).on('child_removed', function (snapshot) {
        callback.call(this, syncEvents.REMOVE, snapshot.val());
      });

      this.fb.child(query.path).on('child_moved', function (snapshot) {
        //TODO: Make sure move is understood. I don't think it means moved order, I think it means moved to a different child path.
        callback.call(this, syncEvents.MOVE)
      });
    };

    FirebaseProtocol.prototype.unsubscribe = function (query) {
      this.fb.child(query.path).off()
    };

    return function (config) {
      var protocol = Object.create(FirebaseProtocol.prototype);
      FirebaseProtocol.call(protocol, config);
      return protocol;
    };
  });