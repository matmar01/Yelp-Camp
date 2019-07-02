var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');

var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
        }
    });
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
        }
    cb(null, true);
    };
var upload = multer({ storage: storage, fileFilter: imageFilter})

cloudinary.config({ 
    cloud_name: 'zuma', 
    api_key: 424594264594727, 
    api_secret: process.env.CLOUDINARY_API_SECRET
    });

 
var options = {
    provider: 'here',
    httpAdapter: 'https',
    // for Google Maps
    // apiKey: process.env.GEOCODER_API_KEY,
    appId: process.env.HEREGEO_APPID,
    appCode: process.env.HEREGEO_APPCODE,
    formatter: null
    };
 
var geocoder = NodeGeocoder(options);


router.get("/",function(req,res) {
    var noMatch = "";
    if (req.query.search) {
        const regex = new RegExp(searchFunctioon(req.query.search),'gi');
        Campground.find({name: regex},function(err, allCampgrounds){
            if(err) {
                console.log(err);        
                }    
            else {
                if (allCampgrounds.length < 1) {
                    noMatch = "No campgrounds found with that name!";                
                    }
                res.render("campgrounds/index",{campgrounds:allCampgrounds,noMatch: noMatch,page: "campgrounds"}); 
                }    
            });  
        }
    else {
        Campground.find({},function(err, allCampgrounds){
            if(err) {
                console.log(err);        
                }    
            else {
                res.render("campgrounds/index",{campgrounds:allCampgrounds,page: "campgrounds",noMatch: noMatch}); 
                }    
            });  
        }   
    });    

router.get("/new",middleware.isLoggedIn,function(req, res) {
    var check = false;
    res.render("campgrounds/new",{check:check});
    });
//CREATE CAMPGROUND
router.post("/",middleware.isLoggedIn ,upload.single('image'),function(req,res) {
    geocoder.geocode(req.body.location,function(err,data) {
        if (err) {
                req.flash("error",err.message);
                return res.redirect("back");
                }
        if (!data.length) {
            check = true;
            var resendCampground = {name: req.body.name,price: req.body.price,dsc: req.body.description,location: req.body.location};
            req.flash("error","Location not found");
            return res.render("campgrounds/new",{campground: resendCampground,check: check});
            }
        // add cloudinary url for the image to the campground object under image property
        // req.body.image = result.secure_url;
        // req.body.imageId = result.public_id;
        var check = false;
        var name = req.body.name;
        var price = req.body.price;
        var dsc = req.body.description;
        var author = {
            id: req.user._id,
            username: req.user.username
            };
        cloudinary.v2.uploader.upload(req.file.path,async function(err , result) {
            if (err) {
                req.flash("error",err.message);
                return res.redirect("back");
                }
            try {
                var lat = data[0].latitude;
                var lng = data[0].longitude;
                var location = data[0].formattedAddress;
                var image = result.secure_url;
                var imageId = result.public_id;
                var newCampground = {name: name,price: price,image: image,imageId: imageId,
                description: dsc,author:author,location: location,lng: lng,lat: lat};
                let newlyCreated = await Campground.create(newCampground);
                let user = await User.findById(req.user._id).populate('followers').exec();
                let newNotification = {
                    username: req.user.username,
                    campgroundId: newlyCreated.slug
                    };
                for (const follower of user.followers) {
                    let notification = await Notification.create(newNotification);  
                    follower.notifications.push(notification);
                    follower.save();
                    }    
                req.flash("success","New campground successfully created");    
                return res.redirect("/campgrounds/" + newlyCreated.slug);    
                }
            catch (err) {
                req.flash("error",err.message);
                return res.redirect("back");
                } 
            });   
        });    
    });

router.get("/:slug",function(req, res) {
    Campground.findOne({slug: req.params.slug}).populate("comments likes").exec(function(err, foundCampground) {
        if (err) {
            console.log(err);        
            }
        else {
            res.render("campgrounds/show",{campground:foundCampground});      
            }    
        });
    }); 
router.get("/:slug/edit",middleware.checkCampgroundOwnership,function(req, res) {
    Campground.findOne({slug: req.params.slug},function(err,foundCampground) {
        if (err) {
            req.flash("error","That campground doesn't exist !");
            res.redirect("back");
            }
        res.render("campgrounds/edit",{campground: foundCampground});
        });
    });    
// UPDATE CAMPGROUND ROUTE
router.put("/:slug", middleware.checkCampgroundOwnership , upload.single("image"), function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
            }
        Campground.findOne({slug: req.params.slug}, async function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
                } 
            else {
                if (req.file) {
                    try {
                        await cloudinary.v2.uploader.destroy(campground.imageId);
                        console.log(campground.imageId);
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                        campground.image = result.secure_url;
                        campground.imageId = result.public_id;
                        }  
                    catch(err) {
                        req.flash("error", err);
                        return res.redirect("back");
                        } 
                    }
                campground.lat = data[0].latitude;
                campground.lng = data[0].longitude;
                campground.location = data[0].formattedAddress;
                campground.name = req.body.name;  
                campground.description = req.body.description;
                campground.price = req.body.price;
                campground.save();
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground.slug);
                }
            });
        });
    });
//DELETE CAMPGROUND 
router.delete("/:slug",middleware.checkCampgroundOwnership,function(req,res) {
    Campground.findOneAndRemove({slug: req.params.slug},async function(err,campgroundRemoved) {
        if (err) {
            req.flash("error",err);
            return res.redirect("/back");        
            }
        else {
            try {
                await Comment.deleteMany( {_id: { $in: campgroundRemoved.comments } });
                await cloudinary.v2.uploader.destroy(campgroundRemoved.imageId);
                req.flash("success","Campground deleted successfully");
                return res.redirect("/campgrounds");
                }
            catch(err) {
                req.flash("error",err);
                return res.redirect("/campgrounds");
                }       
            }    
        });
    });   
//LIKE ROUTE
router.post("/:slug/like",middleware.isLoggedIn,async function(req,res) {
    try {
        let foundCampground = await Campground.findOne({slug: req.params.slug});
        alreadyLiked = false;
        foundCampground.likes.forEach(function(like) {
            if (like.equals(req.user._id)) {
                alreadyLiked = true;
                }
            });
        if (alreadyLiked) {
            foundCampground.likes.pull(req.user._id);
            req.flash("success","You disliked this campground");
            }      
        else {
            foundCampground.likes.push(req.user);
            req.flash("success","You liked this campground");
            }
        await foundCampground.save();
        return res.redirect("/campgrounds/" + req.params.slug);
        }
    catch(err) {
        console.log(err);
        req.flash("error",err.message);
        res.render("/campgrounds/" + req.params.slug);
        }    
    });     
    
function searchFunctioon(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    
module.exports = router;    