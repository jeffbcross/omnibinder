var http = require('http');

var uid = '4fc31f64e4b0769539c32f7e'.split('');

var nextUid = function() {
  var index = uid.length;
  var digit;

  while(index) {
    index--;
    digit = uid[index].charCodeAt(0);
    if (digit == 57 /*'9'*/) {
      uid[index] = 'A';
      return uid.join('');
    }
    if (digit == 90  /*'Z'*/) {
      uid[index] = '0';
    } else {
      uid[index] = String.fromCharCode(digit + 1);
      return uid.join('');
    }
  }
  uid.unshift('0');
  return uid.join('');
}

var DbStore = function() {
	var store = [];
	var map = {};

	this.create = function(data) {
		data._id = {
			$oid: nextUid()
		};

		store.push(data);
		map[data._id.$oid] = data;
		return data;
	};

	this.getAll = function() {
		return store;
	};

	this.remove = function(id) {
		var item = map[id];

		if (!item) return false;

		delete map[id];
		store.splice(store.indexOf(item), 1);
		return true;
	};

	this.update = function(id, data) {
		var item = map[id];

		if (!item) return false;

		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				item[key] = data[key];
			}
		}

		return item;
	};
};

var db = new DbStore();
db.create({text: 'Try AngularJs', done: false});
db.create({text: 'Visit Boston', done: true});
db.create({text: 'Drink some beers', done: false});

var handler = {

	GET: function(req, resp) {
		resp.writeHead(200);
		resp.write(JSON.stringify(db.getAll()));
		resp.end();
	},

	PUT: function(req, resp, id) {
		var data = '';
		req.on('data', function(buffer) {
			data += buffer.toString();
		});

		req.on('end', function() {
			var item = db.update(id, JSON.parse(data));

			if (item) {
				resp.writeHead(200);
				resp.write(JSON.stringify(item));
			} else {
				resp.writeHead(404);
			}
			resp.end();
		});
	},

	POST: function(req, resp) {
		var data = '';
		req.on('data', function(buffer) {
			data += buffer.toString();
		});

		req.on('end', function() {
			resp.writeHead(201);
			var item = db.create(JSON.parse(data));
			resp.write(JSON.stringify(item));
			resp.end();
		});

	},

	DELETE: function(req, resp, id) {
		resp.writeHead(db.remove(id) ? 200 : 404);
		resp.end();
	},

	OPTIONS: function(req, resp) {
		resp.writeHead(200, {
			'Access-Control-Allow-Headers': 'origin, x-requested-with, accept, content-type',
			'Access-Control-Allow-Methods': ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
			'Access-Control-Max-Age': '1728000',
			'Allow': ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE']
		});
		resp.write(JSON.stringify(db.getAll()));
		resp.end();
	}
};

http.createServer(function(request, response) {
	// CORS
	response.setHeader('Access-Control-Allow-Credentials', 'true');
	response.setHeader('Access-Control-Allow-Origin', '*');

	var id = /items\/([a-z0-9]*)/.exec(request.url);
	handler[request.method](request, response, id && id[1]);
}).listen(80);


