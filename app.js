//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const password = require(__dirname + "/password.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection and creating todolistDB
mongoose.connect(
  "mongodb+srv://admin-kartik:" +
    password.adminPassword +
    "@cluster0.ywecf.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// itemsSchema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// mongoose model of todolist
const Item = mongoose.model("Item", itemsSchema);

// 3 Documents to insert
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find(function (err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        // Inserting the items to DB
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully Saved default Items to DB.");
          }
        });
        setTimeout(function () {
          res.redirect("/");
        }, 1000);
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    }
  });
});
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  // Check if the user came from home route or any custom route
  if (listName === "Today") {
    //Home Route
    item.save();
    res.redirect("/");
  } else {
    // Custom Route
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      setTimeout(function () {
        res.redirect("/" + listName);
      }, 1000);
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customLName = _.capitalize(req.params.customListName);
  console.log(customLName);

  List.findOne({ name: customLName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        console.log("RUNS!");
        const list = new List({
          name: customLName,
          items: defaultItems,
        });
        list.save();
        setTimeout(function () {
          res.redirect("/" + customLName);
        }, 1000);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Check if the user came from home route or any custom route
  if (listName === "Today") {
    Item.findOneAndDelete({ _id: checkedItemId }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Removed the task!");
        res.redirect("/");
      }
    });
  } else {
    // Custom Routes
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
