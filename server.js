var express    = require('express'); 
var app        = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router



// /api
require('./rest/api.js')(router);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', router);

// START THE REST SERVER
// =============================================================================
app.listen(port);
console.log('Servidor REST rodando na porta ' + port);