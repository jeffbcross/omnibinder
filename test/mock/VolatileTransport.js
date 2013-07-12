function VolatileProtocol (config) {
  this.host = config.host;
};

VolatileProtocol.prototype.change = function (binder, delta) {
  this.created = {
    model: delta.data
  };
};

VolatileProtocol.prototype.bind = function (query, callback) {

};

VolatileProtocol.prototype.create = function (query, delta, callback) {
  this.created = {
    query: query,
    model: delta.data
  }
};

VolatileProtocol.prototype.remove = function (binder, delta, callback) {
  this.removed = {
    query: binder.query,
    delta: delta
  }
}

VolatileProtocol.prototype.update = function (binder, delta, callback) {
  this.changed = {
    model: delta.data,
    query: binder.query
  }
}

VolatileProtocol.prototype.read = function (query) {
  return { then: function () {}}
}
VolatileProtocol.prototype.subscribe = function (query) {
  this.bound = [];
  this.bound.push({query: query});
}