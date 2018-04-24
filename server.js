var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var app = express();
var db = require('./db.js');

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;


var middleware = {
	requireAuthentication: function(req, res, next) {
		next();
	}
}

app.use(middleware.requireAuthentication);
app.use(bodyParser.json());

app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

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

	db.todo.findAll({where:where}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});
});

app.get('/todos/:id', function(req, res) {
	var getId = parseInt(req.params.id, 10);

	db.todo.findById(getId).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON())
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});
});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, "description", "visible");

	db.todo.create({
		description: body.description,
		visible: body.visible
	}).then(function(todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.send(400).json(e);
	});
});

app.delete('/todos/:id', function(req, res) {
	var getId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: getId
	});
	if (matchedTodo) {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	} else {
		res.status(404).send({
			"error": "no item found"
		});
	}

});

app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, "description", "visible");
	var validAttributes = {};

	var getId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: getId
	});

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('visible') && _.isBoolean(body.visible)) {
		validAttributes.visible = body.visible;
	} else if (body.hasOwnProperty('visible')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString('description') && body.description.trim().length >= 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	matchedTodo = _.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);
});

app.use(express.static(__dirname + '/public'));

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("listening to port" + PORT);
	});
})