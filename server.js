var express = require('express');
var app = express();

var PORT = process.env.PORT || 3000;

var todos = [
	{
		"id":1,
		"description": "Need to book ticket",
		"visible": true
	},
	{
		"id":2,
		"description": "pay power bill",
		"visible": false
	},
	{
		"id":3,
		"description": "buy mac laptop",
		"visible":true
	}
]


var middleware = {
	requireAuthentication: function(req,res,next){
		console.log("entered in private route");
		next();
	}
}

app.use(middleware.requireAuthentication);

app.get('/about',function(req,res){
	res.send('About Page');
});

app.get('/todos',function(req,res){
	res.json(todos);
});

app.get('/todos/:id',function(req,res){
	var getId = parseInt(req.params.id,10);
	var matchedTodo;
	todos.forEach(function(todo){
		if(todo.id === getId){
			matchedTodo = todo;
		}
	});
	if(matchedTodo) {
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