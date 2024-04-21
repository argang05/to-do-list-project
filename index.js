import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

main().catch(err => console.log(err));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB")
}

const itemsSchema = new mongoose.Schema({
    name : String
});

const Item = mongoose.model("Item" , itemsSchema);

const item1 = new Item({
    name : "Welcome to your todolist!"
});

const item2 = new Item({
    name : "Hit the + button to add new item."
});

const item3 = new Item({
    name : "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name : String,
    items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);

let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let today  = new Date();
let currDate = today.toLocaleDateString("en-US", options);

app.get("/", (req,res) =>{
    const getItems = async() => {
        try{
            const items = await Item.find({});
            if(items.length === 0){
                console.log("Successfully inserted the default items!");
                Item.insertMany(defaultItems);
                res.redirect("/");
            }else{
                res.render("index.ejs",
                    {
                        currentDate : currDate,
                        newItems : items
                    });
            }
        }catch(error){
            console.log(error);
        }
    }
    getItems();
});

app.get("/:customListName" , (req,res) =>{
    const customListName = _.capitalize(req.params.customListName);
    const findOneElement = async() =>{
        try{
            const foundElement = await List.findOne({name : customListName});
            if(!foundElement){
                //Create a new List:
                const list = new List({
                    name : customListName,
                    items : defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                //Render existing list:
                res.render("index.ejs" , {
                    currentDate : foundElement.name,
                    newItems : foundElement.items
                });
            }
        }catch(error){
            console.log(error);
        }
    };
    findOneElement();
});

app.post("/",(req,res) =>{
    const newItm = req.body["newItem"];
    const listName = req.body.list;
    const item = new Item({
        name : newItm
    });
    if(listName === currDate){
        item.save();
        res.redirect("/");
    }else{
        const findOneElem = async() => {
            try{
                const foundElem = await List.findOne({name : listName});
                foundElem.items.push(item);
                foundElem.save();
                res.redirect("/"+listName);
            }catch(error){
                console.log(error);
            }
        }
        findOneElem();
    }
}); 

app.post("/delete" , (req,res) => {
    const checkedItemId = req.body.cheqbox;
    const listName = req.body.listName;
    if(listName === currDate){
        const deleteByID = async() =>{
            try{
                await Item.findByIdAndRemove(checkedItemId);
                console.log("Successfully deleted the item!");
                res.redirect("/");
            }catch(error){
                console.log(error);
            }
        };
        deleteByID();
    }else{
        const deleteListElem = async() => {
            try{
                const foundElem = await List.findOneAndUpdate({name : listName} , 
                    {$pull : {items : {_id : checkedItemId}}});
                res.redirect("/"+listName);
            }catch(error){
                console.log(error);
            }
        };
        deleteListElem();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});