var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
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
    res.render("campgrounds/new");
    });
//CREATE CAMPGROUND
router.post("/",middleware.isLoggedIn ,upload.single('image'),function(req,res) {
    var name = req.body.name;
    cloudinary.v2.uploader.upload(req.file.path, function(err , result) {
        if (err) {
            req.flash("error",err);
            return res.redirect("back");
            }
        // add cloudinary url for the image to the campground object under image property
        // req.body.image = result.secure_url;
        // req.body.imageId = result.public_id;
        var image = result.secure_url;
        var imageId = result.public_id;
        var price = req.body.price;
        var dsc = req.body.description;
        var author = {
            id: req.user._id,
            username: req.user.username
            };
        geocoder.geocode(req.body.location,function(err,data) {
            if (err || !data.length) {
                req.flash('error',err);
                return res.redirect('back');
                }
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            var newCampground = {name: name,price: price,image: image,imageId: imageId,description: dsc,author:author,location: location,lng: lng,lat: lat};
            Campground.create(newCampground,function(err,newlyCreated){
                if (err) {
                    req.flash("error", err);
                    res.redirect("back");
                    }
                else {
                    res.redirect("/campgrounds/" + newlyCreated.id);
                    }    
                });
            });   
        });    
    });

router.get("/:id",function(req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        if (err) {
            console.log(err);        
            }
        else {
            res.render("campgrounds/show",{campground:foundCampground});      
            }    
        });
    }); 
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
    Campground.findById(req.params.id,function(err,foundCampground) {
        if (err) {
            req.flash("error","That campground doesn't exist !");
            res.redirect("back");
            }
        res.render("campgrounds/edit",{campground: foundCampground});
        });
    });    
// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership , upload.single("image"), function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
            }
        Campground.findById(req.params.id, async function(err, campground){
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
                res.redirect("/campgrounds/" + campground._id);
                }
            });
        });
    });
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res) {
    Campground.findByIdAndRemove(req.params.id,async function(err,campgroundRemoved) {
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
                return res.redirect("back");
                }       
            }    
        });
    });    
    
function searchFunctioon(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    
module.exports = router;    