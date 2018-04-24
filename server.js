var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var app = express();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;


var middleware = {
	requireAuthentication: function(req,res,next){
		next();
	}
}

app.use(middleware.requireAuthentication);
app.use(bodyParser.json());

app.get('/about',function(req,res){
	res.send('About Page');
});

app.get('/todos',function(req,res){
	res.json(todos);
});

app.get('/todos/:id',function(req,res){
	var getId = parseInt(req.params.id,10);
	var matchedTodo = _.findWhere(todos, {id:getId});
	if(matchedTodo) {
		res.json(matchedTodo);
	}
	else {
		res.status(404).send();
	}

});

app.post('/todos',function(req,res){
	var body = _.pick(req.body,"description","visible");

	if(!_.isBoolean(body.visible) || !_.isString(body.description) || body.description.trim().length === 0){
		return res.status(400).send();
	}
	body.description = body.description.trim();
	body.id = todoNextId++;
	todos.push(body);
	res.json(body);
});

app.delete('/todos/:id',function(req,res){
	var getId = parseInt(req.params.id,10);
	var matchedTodo = _.findWhere(todos, {id:getId});
	if(matchedTodo) {
		todos = _.without(todos,matchedTodo);
		res.json(matchedTodo);
	}
	else {
		res.status(404).send();
	}

});

app.use(express.static(__dirname+'/public'));

app.listen(PORT,function(){
	console.log("listening to port"+PORT);
});