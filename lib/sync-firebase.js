'use strict';

angular.module('SyncResource')
  .factory('syncFirebase', function ($q, $rootScope, syncEvents) {
    function FirebaseProtocol (options) {
      if (!options || !options.url) throw new Error("FirebaseProtocol requires options.url");
      this.options = options;
      this.fb = new Firebase(options.url);
    };

    FirebaseProtocol.prototype.change = function (query, delta) {
    };

    FirebaseProtocol.prototype.create = function (binder, delta) {
      var deferred = $q.defer();

      this.fb.child(binder.query.path).push(delta.data, function (err) {
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

    FirebaseProtocol.prototype.update = function (binder, delta) {
      if (!binder.query || !binder.query.path) throw new Error('Update requires query.path');
      var deferred = $q.defer();
      
      this.fb.child(binder.query.path).update(delta.data, function (err) {
        if (err) return deferred.reject(err);
        deferred.resolve();
      });

      return deferred.promise;
    };

    FirebaseProtocol.prototype.remove = function (query, delta) {
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

    FirebaseProtocol.prototype.subscribe = function (binder, callback) {
      if(!binder.query || !binder.query.path) throw new Error('Subscribe requires binder.query.path');
      
      this.fb.child(binder.query.path).on('child_changed', function (snapshot) {
        callback.call(this, {
          type: syncEvents.UPDATE,
          data: snapshot.val()
        });
      });

      this.fb.child(binder.query.path).on('child_added', function (snapshot) {
        callback.call(this, {
          type: syncEvents.ADD,
          data: snapshot.val()
        });
      });

      this.fb.child(binder.query.path).on('child_removed', function (snapshot) {
        callback.call(this, {
          type: syncEvents.REMOVE,
          data: snapshot.val()
        });
      });

      this.fb.child(binder.query.path).on('child_moved', function (snapshot) {
        //TODO: Make sure move is understood. I don't think it means moved order, I think it means moved to a different child path.
        callback.call(this, {
          type: syncEvents.MOVE,
          data: snapshot.val()
        })
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