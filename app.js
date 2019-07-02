require("dotenv").config();

var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose"),
    passport = require("passport"),
    localStrategy = require("passport-local");
var app = express();
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");
var methodOverride = require("method-override");
var flash = require("connect-flash");

var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var authRoutes = require("./routes/index");

// mongoose.connect("mongodb://localhost:27017/yelp_camp",{useNewUrlParser: true});
mongoose.connect("mongodb+srv://Zuma:pasvord@yelpcamp-56hrq.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.use(methodOverride("_method"));
app.locals.moment = require("moment");
// seedDB();

//PASSSPORT CONF
app.use(require("express-session")({
    secret: "I don't know!",
    resave: false,
    saveUninitialized: false
    }));
    
app.use(flash());    
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req,res,next) {
    res.locals.currentUser = req.user;
    if (req.user) {
        try {
            let user = await User.findById(req.user._id).populate("notifications",null,{isRead: false}).exec();
            if (user.notifications) {
                res.locals.notifications = user.notifications.reverse();      
                }
            else {
                res.locals.notifications = [];            
                }
            }
        catch(err) {
            console.log(err.message);
            }    
        }   
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
    });
    
app.use(authRoutes);
app.use("/campgrounds/:slug/comments",commentRoutes);
app.use("/campgrounds",campgroundRoutes);

app.listen(3000 , function() {
    console.log("Yelp camp server started!!");
    });
  