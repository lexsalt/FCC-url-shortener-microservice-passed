require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
let bodyParser = require("body-parser")
const dns = require('dns')
let mongoose = require('mongoose');
//const urlparser = require('url')


// const client = new MongoClient(process.env.DB_URL)
// const db = client.db("urlshortner")
// const urls = db.collection("urls")

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(function middleware(req, res, next){
  console.log(req.method+" "+req.path+" - "+req.ip)
  next();
})

const URLSchema = new mongoose.Schema({
  original_url: {type: String, required: true, unique: true},
  short_url: {type: String, required: true, unique: true}
});

let URLModel = mongoose.model("url", URLSchema);

// Middleware function to parse post requests
app.use("/", bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', function(req, res) {
  let short_url = req.params.short_url;
  // Find the original url from the database
  URLModel.findOne({short_url: short_url}).then((foundURL) => {
    if (foundURL){
      let original_url = foundURL.original_url;
      res.redirect(original_url);
    } else {
      res.json({message: "The short url does not exist!"});
    }
  });
})

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url;
  // Validate the URL
  try {
    urlObj = new URL(url);
    // Validate DNS Domain
    dns.lookup(urlObj.hostname, (err, address, family) => {
      // If the DNS domain does not exist no address returned
      if (!address){
        res.json({ error: 'invalid url' })
      } 
      // We have a valid URL!
      else {
        let original_url = urlObj.href;
        // Check that URL does not already exist in database 
        URLModel.findOne({original_url: original_url}).then(
          (foundURL) => {
            if (foundURL) {
              res.json(
                {
                  original_url: foundURL.original_url,
                  short_url: foundURL.short_url
                })
          } 
          // If URL does not exist create a new short url and 
          // add it to the database
          else {
            let short_url = 1;
            // Get the latest short_url
            URLModel.find({}).sort(
              {short_url: "desc"}).limit(1).then(
                (latestURL) => {
                if (latestURL.length > 0){
                  // Increment the latest short url by adding 1
                  short_url = parseInt(latestURL[0].short_url) + 1;
                }
                resObj = {
                  original_url: original_url,
                  short_url: short_url
                }
                
                // Create an entry in the database
                let newURL = new URLModel(resObj);
                newURL.save();
                res.json(resObj);
                }
            )
          }
        })
      }
    })
  }
  // If the url has an invalid format
  catch {
    res.json({ error: 'invalid url' })
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});