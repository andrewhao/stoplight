require("babel-core/register");
var Stoplight = require("./stoplight").default;
var util = require('util');
var stoplight = new Stoplight();
var path = process.argv.slice(2);
stoplight.stopsFromGpx(path.toString())
  .then(function(v) { console.log(util.inspect(v)) })
