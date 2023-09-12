require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
let bodyparser = require("body-parser")
const dns = require('dns')
const urlparser = require('url')

const client = new MongoClient(process.env.DB_URL)
const db = client.db("urlshortner")
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(function middleware(req, res, next){
  console.log(req.method+" "+req.path+" - "+req.ip)
  next();
})

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url
  console.log("url")
  console.log(url)
  // Validating the URL
  try {
    urlObj = new URL(url)
    console.log(urlObj)
    dns.lookup(urlObj.hostname, async (err, address, family) => {
      // if the dns domain doesnt exist no address will be returned
      if (!address) {
        console.log(`invalid url: ${address}`)
        res.json({error: 'Invalid URL'})
      } else { // means we have a valid URL
        const urlCount = await urls.countDocuments({})
        let original_url = urlObj.href
        let storedUrl = urlObj.hostname
        console.log(storedUrl)
        let short_url = urlCount
        const urlDoc = {
          storedUrl,
          short_url: urlCount
        }
  
        const result = await urls.insertOne(urlDoc)
        res.json({
          original_url: original_url, short_url: short_url
        })
      }
    })
  }
  catch {
    res.json({error: "invalid url"})
  }
  //const parsed = urlparser.parse(url)
  //console.log(parsed)
  //console.log(parsed.pathname)
  

});

/* 

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log("body:")
  console.log(req.body)
  const url = req.body.url
  console.log("url")
  console.log(url)
  const parsed = urlparser.parse(url)
  //console.log(parsed)
  console.log(parsed.pathname)
  
  const dnslookup = dns.lookup(parsed.pathname, async (err, address) => {
    if (!address){
      res.json({error: "Invalid URL"})
    } else {

      const urlCount = await urls.countDocuments({})
      const urlDoc = {
        url,
        short_url: urlCount
      }

      const result = await urls.insertOne(urlDoc)
      console.log(result);
      res.json({ original_url: url, short_url: urlCount })
      
    }
  })
});

*/


// app.get("/api/short_url/:short_url", async (req, res) => {
//   console.log("underScore")
//   const shorturl1 = req.params.short_url
//   console.log(`params: ${req.params.short_url}`)
//   const urlDoc = await urls.findOne({ short_url: +shorturl1 })
//   console.log(`params: ${urlDoc.url}`)
//   res.redirect(urlDoc.storedUrl)
// })

app.get("/api/shorturl/:shorturl", async (req, res) => {
  console.log("no underScore")
  const shorturl1 = req.params.shorturl
  console.log(`params: ${req.params.shorturl}`)
  const urlDoc = await urls.findOne({ short_url: +shorturl1 })
  console.log(`type: ${typeof(urlDoc)}`)
  if (urlDoc !== "null") {
    console.log(" no es nulo")
  }
  // need to catch errors
  console.log(`urlDoc: ${urlDoc}`)
  console.log(urlDoc)
  console.log(urlDoc.storedUrl)
  console.log(`params: ${urlDoc.url}`)
  res.redirect(`https://${urlDoc.storedUrl}`)
  
  
})

// app.get("/api/shorturl/undefined", async (req, res) => {
//   console.log("undefined")
//   res.json({
//     error: "Wrong format"
//   })
// })

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
