'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');
const dns = require('dns');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: {type: String,
        required: true},
  short_url: {type: String,
              unique: true}
});

const shortUrl = mongoose.model('shortURL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get('/api/shorturl/:num', function(req, res){
  shortUrl.findOne({short_url: req.params.num}, function(err, obj){
    if (obj) res.redirect(obj.original_url);
    else res.json({error: "no shortcut found"});
  })
});

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new/', function(req, res){
  let domainName = req.body.url.match(/^(?:https?:\/\/)([^\/]+\.[^\/\.]{2,}(?=\/?))/);
  if(domainName){
    shortUrl.count({}, (err, count) => {
      dns.lookup(domainName[1], (err, address) => {
        if (err) res.json({"error":"invalid URL"});
        else{
          let newUrl = new shortUrl({original_url: req.body.url, short_url: (count+1).toString(36)})
          res.json({original_url: req.body.url, short_url: (count+1).toString(36)});
          newUrl.save();
        }
      })
    });
  }
  else res.json({"error":"invalid URL"});
});

app.get('/stats', function(req, res){
  const urlCount = shortUrl.count({}, (err, count) => {
    res.json({databaseSize: count});
  })
});

app.get('/*', function(req, res){
  res.json({error: 'invalid url'});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});