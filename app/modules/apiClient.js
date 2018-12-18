var dbClient = require("./dbClient");
var queries = require("./queries");
var path = require("path");
var fs = require("fs");

const CONTENT_TYPE = "Content-Type"
const APPLICATION_JSON = "application/json"
const BUSINESS_ID_PLACEHOLDER = "%business_id%"
const LIST_ID_PLACEHOLDER = "%list_id%"
const SORT_BY_PLACEHOLDER = "%sort_by%"

exports.getAllRestaurants = function(req, res){
  var listtype = req.query.listtype;
  var listid;
  var sortby;
  if (listtype == "variance") {
    listid = "topvariance";
    sortby = "variance";
  } else if (listtype == "checkins") {
    listid = "topcheckins";
    sortby = "normcheckins";
  } else if (listtype == "funnyreviews") {
    listid = "topfunny";
    sortby = "funnynorm";
  } else if (listtype == "coolreviews") {
    listid = "topcool";
    sortby = "coolnorm";
  } else if (listtype == "usefulreviews") {
    listid = "topuseful";
    sortby = "usefulnorm";
  }
  dbClient.query(queries.TOP_RESTAURANT_LIST.replace(LIST_ID_PLACEHOLDER, listid).replace(SORT_BY_PLACEHOLDER, sortby), function (err, rows, fields) {
    res.setHeader(CONTENT_TYPE, APPLICATION_JSON);
    res.send(JSON.stringify(rows));
  });
};

exports.getMetadata = function(req, res) {
  var business_id = req.query.business_id;
  var query = queries.META_DATA.replace(BUSINESS_ID_PLACEHOLDER, business_id)
  if (debug) console.log(query);
  dbClient.query(query, function (err, rows, fields) {
    res.setHeader(CONTENT_TYPE, APPLICATION_JSON);
    res.send(JSON.stringify(rows[0]));
  });
};

exports.getComments = function(req, res) {
  var business_id = req.query.business_id;
  dbClient.query(queries.COMMENTS.replace(BUSINESS_ID_PLACEHOLDER, business_id), function (err, rows, fields) {
    res.setHeader(CONTENT_TYPE, APPLICATION_JSON);
    res.send(JSON.stringify(rows));
  });
};

exports.getWordGraph = function(req, res){
  var business_id = req.query.business_id;
  // https://digitalsynopsis.com/design/beautiful-color-palettes-combinations-schemes/
  var file = fs.readFileSync(path.join(appRoot+'/app/data/ratingnodes.json'), 'utf8');
  var obj = JSON.parse(file);
  dbClient.query(queries.WORD_GRAPH.replace(BUSINESS_ID_PLACEHOLDER, business_id), function (err, rows, fields) {
    res.setHeader(CONTENT_TYPE, APPLICATION_JSON);
    obj["linked_data"] = rows;
    res.send(obj);
  });
};