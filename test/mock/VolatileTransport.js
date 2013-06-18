function VolatileProtocol (config) {
  this.host = config.host;
};

VolatileProtocol.prototype.bind = function (query, callback) {

};

VolatileProtocol.prototype.create = function (query, model, callback) {
  this.created = {
    query: query,
    model: model
  }
};

VolatileProtocol.prototype.remove = function (query, model, callback) {
  this.removed = {
    query: query,
    model: model
  }
}

VolatileProtocol.prototype.update = function (query, model, callback) {
  this.changed = {
    model: model,
    query: query
  }
}

VolatileProtocol.prototype.read = function (query) {
  return { then: function () {}}
}
VolatileProtocol.prototype.subscribe = function (query) {
  this.bound = [];
  this.bound.push({query: query}); 
}