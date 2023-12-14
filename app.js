// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model(
    "List",
    listSchema
);

const Item = mongoose.model(
    "item",
    itemsSchema
);

const item1 = new Item({
    name: "welcome to your todolist"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];



app.get("/", function(req,res) {

    Item.find({}).then(function(foundItems) {
        if (foundItems.length == 0) {
            Item.insertMany(defaultItems).then(function() {
                console.log("successfully saved default items to DB");
            }).catch(function(err) {
                console.log(err);
            });
            res.redirect("/");
        }else {
            res.render("list",{listTitle: "Today", newListItems: foundItems});
        }
    }).catch(function(err) {
        console.log(err);
    });
});

app.get("/:customListName", function(req,res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(foundList) {
        if (foundList === null) {
            const list = new List({
                name: customListName,
                items: defaultItems
            })
            list.save();
            res.redirect("/" + customListName);
        }else {
            res.render("list", {listTitle: customListName, newListItems: foundList.items});
        }
        //console.log(foundList);
    }).catch(function(err) {
        console.log(err);
    });
});

app.post("/",function(req,res) {
    let itemName = req.body.newItem;
    let listName = req.body.list;
    let newItem = Item({
        name: itemName
    });
    
    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    }else {
        List.findOne({name: listName}).then(function(foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(function(err) {
            console.log(err);
        });
    }
});

app.post("/delete",function(req,res) {
    const checkedItemId = req.body.checkbox;
    const curListName = req.body.listName;
    
    if (curListName === "Today") {
        Item.findByIdAndDelete(checkedItemId).then(function() {
            console.log("successfully deleted");
            res.redirect("/");
        }).catch(function(err) {
            console.log(err);
        });
    }else {
        List.findOneAndUpdate({name: curListName}, {$pull: {items: {_id:checkedItemId}}}).then(function(foundList) {
            res.redirect("/" + curListName);
        }).catch(function(err) {
            console.log(err);
        })
    }
});

app.get("/about", function(req,res) {
    res.render("about");
});
const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Server is running on port 3000");
});