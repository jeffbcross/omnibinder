angular.module('SyncResource')
  .factory('$binder', function () {
    function Binder(options) {
      var self = this;

      if (!options.scope) throw new Error('scope is required');
      if (!options.model) throw new Error('model is required');
      if (options.onProtocolChange && typeof options.onProtocolChange !== 'function' && !Array.isArray(options.onProtocolChange)) throw new Error('onProtocolChange must be a function or array');
      if (options.onModelChange && typeof options.onModelChange !== 'function' && !Array.isArray(options.onModelChange)) throw new Error('onModelChange must be a function or array');

      this.scope = options.scope;
      this.model = options.model;
      this.query = options.query;
      this.onProtocolChange = options.onProtocolChange;


      /*
        Check for transformation pipelines provided to binder.
        Bi-directional, accepts either a function or array of 
        functions for changes to protocol and changes to local model.
      */
      angular.forEach(['onProtocolChange', 'onModelChange'], function (pipeline) {
        if (typeof options[pipeline] === 'function') {
          self[pipeline] = options[pipeline];  
        }
        else if (Array.isArray(options[pipeline])) {
          if (options[pipeline].length === 1) {
            self[pipeline + 'Chain'] = options[pipeline][0];
          }
          else {
            self[pipeline + 'Chain'] = options[pipeline];
            var i = 0;

            self[pipeline] = function (binder, delta, done) {
              function iteratorFactory () {
                fn = self[pipeline + 'Chain'][i] || done;
                i++;
                return function () {
                  fn.call(self, binder, delta, iteratorFactory());
                }
              }

              iteratorFactory().call(self);
            };
          }
        }
      });
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