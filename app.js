var express = require("express");
var app = express();
var path = require("path");
global.appRoot = path.resolve(__dirname);
global.debug = false; // If you want more verbose messages
var apiClient = require("./app/modules/apiClient")

/* Make public folder accessible */
app.use('/', express.static(path.join(__dirname, 'public')))

/* Screens */
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/app/screens/index.html'));
});

/* Expose and handle endpoints */
app.get('/api/restaurants', apiClient.getAllRestaurants);
app.get('/api/wordgraph', apiClient.getWordGraph);
app.get('/api/metadata', apiClient.getMetadata);
app.get('/api/comments', apiClient.getComments);


/* Start the app! */
var port = process.env.PORT || 8080
app.listen(port);
console.log(`Running at Port ${port}
http://localhost:${port}
NOTE: To properly shut down the server, please use ctrl+C.
Otherwise you'll need to manually kill the process using port 8080.
Enjoy!`);