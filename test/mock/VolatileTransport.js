function VolatileProtocol (config) {
  this.host = config.host;
};

VolatileProtocol.prototype.bind = function (query, callback) {

};

VolatileProtocol.prototype.get = function (query) {
  return { then: function () {}}
}
VolatileProtocol.prototype.subscribe = function (query) {
  this.bound = [];
  this.bound.push({query: query}); 
}