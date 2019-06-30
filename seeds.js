var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var seeds = [{
    name: "Cloud's Rest", 
    price: 50.25,
    image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
    imageId : "10131087094_c1c0a1c859",
    location: "Pomer, Medulin, Hrvatska",
    lng: 13.8966,
    lat: 44.82429,
    createdAt : "2019-06-26T17:22:07.063Z",
    author : {
        id: "5d10e02df8d9910c367d008e",
        username: "Zuma"
        },
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"},
    {
    name: "Desert Mesa", 
    price: 50.25,
    image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
    imageId : "10131087094_c1c0a1c859",
    location: "Pomer, Medulin, Hrvatska",
    lng: 13.8966,
    lat: 44.82429,
    createdAt : "2019-06-26T17:22:07.063Z",
    author : {
        id: "5d10e02df8d9910c367d008e",
        username: "Zuma"
        },
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"},
    {
    name: "Canyon Floor",
    price: 50.25, 
    image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
    imageId : "10131087094_c1c0a1c859",
    location: "Pomer, Medulin, Hrvatska",
    lng: 13.8966,
    lat: 44.82429,
    createdAt : "2019-06-26T17:22:07.063Z",
    author : {
        id: "5d10e02df8d9910c367d008e",
        username: "Zuma"
        },
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"}
    ];

async function seedDB() {
    try {
        await Comment.deleteMany({});
        await Campground.deleteMany({});
        seeds.forEach(async function(seed) {
            let campground = await Campground.create(seed); 
            let comment = await Comment.create({
                text:"Ok but no internet",
                createdAt : "2019-06-26T17:22:07.063Z",
                author : {
                    id: "5d10e02df8d9910c367d008e",
                    username: "Zuma"
                    }
                });
            campground.comments.push(comment);
            campground.save();
            });
        }
    catch(err) {
        console.log(err);   
        }    
    } 

module.exports = seedDB;   