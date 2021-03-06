var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Using this template, the cheerio documentation,
// and what you've learned in class so far, scrape a website
// of your choice, save information from the page in a result array, and log it to the console.
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 8080;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));



// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/tmzHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


FIXME:
//Get Handlebars to work!
// Set Handlebars.
// var exphbs = require("express-handlebars");

// app.engine("handlebars", exphbs({
//     defaultLayout: "main",
//     // partialsDir: path.join(__dirname, "/views/layouts/partials")
// }));
// app.set("view engine", "handlebars");


app.get("/scrape", function (req, res) {
  // Make a request call to grab the HTML body from the site of your choice
  axios.get("http://www.tmz.com/").then(function (response) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("a.headline").each(function (i, element) {

      // An empty array to save the data that we'll scrape
      var result = {};

      result.title = $(this).children().text();
      result.link = $(this).attr("href");


      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);

        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete!");
  });

});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for saving an Article 
app.post("/articles/save/:id", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.findOneAndUpdate({_id: req.params.id}, {saved: true})
    .then(function (savedArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(savedArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for deleting an article from saved 
app.post("/articles/save/:id", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.findOneAndUpdate({_id: req.params.id}, {saved: false})
    .then(function (unsaveArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(unsaveArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        note: dbNote._id
      }, {
        new: true
      });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.delete("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.deleteOne(req.body)
    .then(function (dbNote) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbNote);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({
      _id: req.params.id
    })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});