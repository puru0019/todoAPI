var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var app = express();
var db = require('./db.js');
var bcrypt = require('bcrypt');
var cryptojs = require('crypto-js');

var PORT = process.env.PORT || 3000;

var middleware = {
	requireAuthentication: function(req, res, next) {
		var token = req.get('Auth') || '';

		db.token.findOne({
			where: {
				tokenHash: cryptojs.MD5(token).toString()
			}
		}).then(function(tokenInstance) {
			if (!tokenInstance) {
				throw new Error();
			}
			req.token = tokenInstance;
			return db.user.findByToken(token);
		}).then(function(user) {
			req.user = user;
			next();
		}).catch(function() {
			res.status(401).send();
		});
	}
}

app.use(bodyParser.json());

app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {
		userId: req.user.get("id")
	};

	if (query.hasOwnProperty('visible') && query.visible === 'true') {
		where.visible = true;
	} else if (query.hasOwnProperty('visible') && query.visible === 'false') {
		where.visible = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});
});

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var getId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where: {
			id: getId,
			userId: req.user.get("id")
		}
	}).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON())
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});
});

app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "description", "visible");

	db.todo.create({
		description: body.description,
		visible: body.visible
	}).then(function(todo) {
		req.user.addTodo(todo).then(function() {
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
	}, function(e) {
		res.send(400).json(e);
	});
});

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var getId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: getId,
			userId: req.user.get("id")
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: "No rows found"
			});
		} else {
			res.status(204).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});

app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "description", "visible");
	var attributes = {};

	var getId = parseInt(req.params.id, 10);


	if (body.hasOwnProperty('visible')) {
		attributes.visible = body.visible;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findOne({
		where: {
			id: getId,
			userId: req.user.get("id")
		}
	}).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});

app.post('/users', function(req, res) {
	var body = _.pick(req.body, "email", "password");

	db.user.create(body).then(function(user) {
		var userDetails = user.toPublicJSON(user);
		res.json(userDetails);
	}, function(e) {
		res.status(400).json(e);
	});
});

app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, "email", "password");
	var userInstance, userDetails;

	db.user.authenticate(body).then(function(user) {
			userDetails = user.toPublicJSON(user);
			var token = user.generateToken(user.id, 'authentication');
			userInstance = user;

			return db.token.create({
				token: token
			});

		}).then(function(tokenInstance) {
			res.header("Auth", tokenInstance.get('token')).json(userDetails);
		})
		.catch(function(e) {
			res.status(401).send();
		})
});

app.delete('/users/login', middleware.requireAuthentication, function(req,res) {
	req.token.destroy().then(function(){
		res.status(204).send();
	}).catch(function() {
		res.status(401).send();
	});
});

app.use(express.static(__dirname + '/public'));

db.sequelize.sync({
	force: true
}).then(function() {
	app.listen(PORT, function() {
		console.log("listening to port" + PORT);
	});
})