var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var app = express();
var db = require('./db.js');

var PORT = process.env.PORT || 3000;

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

	db.todo.destroy({
		where: {
			id: getId
		}
	}).then(function(rowsDeleted) {
		if(rowsDeleted === 0) {
			res.status(404).json({error:"No rows found"});
		} else {
			res.status(204).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});

app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, "description", "visible");
	var attributes = {};

	var getId = parseInt(req.params.id, 10);
	

	if (body.hasOwnProperty('visible')) {
		attributes.visible = body.visible;
	} 

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	} 

	db.todo.findById(getId).then(function(todo){
		return todo.update(attributes);
	}, function(e) {
		res.status(500).send();
	}).then(function(todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.status(400).json(e);
	});
	
});

app.use(express.static(__dirname + '/public'));

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("listening to port" + PORT);
	});
})