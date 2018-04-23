var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

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

app.use(express.static(__dirname+'/public'));

app.listen(PORT,function(){
	console.log("listening to port"+PORT);
});