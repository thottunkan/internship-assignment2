var express = require('express');
var router = express.Router();
var connection = require("../config/connection")
var productHelper = require("../helpers/productHelpers")
const { v4: uuid } = require('uuid');
const { merge, route } = require('../app');

var userobj ={};

/* GET users listing. */
router.get('/signup', function(req, res, next) {
  res.render("../views/reg.hbs",{normal:true})
});

router.post('/signup', function(req, res, next) {
  var user = {
    userid:uuid(),
    name:req.body.name,
    email:req.body.email,
    phone:req.body.phone,
    address:req.body.address,
    location:req.body.location,
    username:req.body.username,
    password:req.body.password,
    usertype:req.body.usertype

  }
  productHelper.findUser(user.email).then((user)=>{
    if (user) {
        res.redirect("signup")
    }else{
      connection.getDatabase().collection("users").insertOne(user).then((result) => {
        
        res.render("../views/login.hbs",{normal:true})
      }).catch((err) => {
        console.log(err)
      });
    }
  })
  

 
  
});

router.get("/login",(req,res,next)=>{
  res.render("../views/login.hbs",{normal:true})
})


//login route
router.post("/login",  (req,res,next)=>{
  const credentials = {
    email:req.body.email,
    password:req.body.password
  }
  const result =  connection.getDatabase().collection("users").find(credentials).toArray((err,data)=>{
    if (err) {
      res.redirect("/login")
      console.log(err)
    }
    var usertype = data[0].usertype;
    if (usertype === "deliveryguy") {

      req.session.user = data;
      res.redirect("home/dg")
      
    } else if(usertype === "customer"){
      req.session.user = data;
      res.redirect("home")
    }
    else{
      req.session.user = data;
      //res.send("admin")
      res.redirect("admin")
    }
  });
  console.log(result)
  //res.render("../views/login.hbs")
})

router.get("/home",(req,res,next)=>{
  var user = req.session.user
  if(user){
    productHelper.getAllProducts().then((products)=>{
      console.log(req.session.user)
      res.render("../views/home.hbs",{data:userobj,user:true,title:"home",products:products,userdetails:user})
    })
  }else{
    res.redirect("login")
  }
  
})

router.get("/home/dg",(req,res,next)=>{
  var user = req.session.user
  if(user){
    productHelper.getAllProducts().then((products)=>{
      console.log(req.session.user)
      res.render("../views/dghome.hbs",{data:userobj,dgheader:true,title:"home",products:products,userdetails:user})
    })
  }else{
    res.redirect("/login")
  }
  
})

router.get("/cart",(req,res,next)=>{
  productHelper.getAllCartItems().then((cartitems)=>{
    res.render("../views/cart.hbs",{user:true,title:"Cart",cartitems:cartitems})
  })
})

router.get("/viewproduct",(req,res,next)=>{
  res.render("../views/viewproduct.hbs",{user:true})
 });

 //purchase route
router.get("/purchase/:cartid",(req,res,next)=>{
  console.log(req.path)
  productHelper.purchaseItem(req.params.cartid).then((data)=>{
    console.log("purchaseid "+ data)
    res.redirect("user/cart")
  })
  
});

 //addto cart route
 router.get("/viewproduct/addtocart/:productid",(req,res,next)=>{
 
  productHelper.getProduct(req.params.productid).then((data)=>{
     const cartdetails ={cartid:uuid(), productdetails:data,userdetails:req.session.user}
     productHelper.addToCart(cartdetails,(cartitem)=>{
       res.redirect("/user/cart")
     })
     
  })
 })


 //admin routes

router.get("/admin",(req,res,next)=>{
    res.render("../views/admin.hbs",{admin:true,title:"admin panel"})
 })

router.get("/admin/addproduct",(req,res,next)=>{
  
    res.render("../views/admin-addproduct.hbs",{title:"add product",admin:false})
    
})

router.post("/admin/addproduct",(req,res,next)=>{
  let image = req.files.image;
  console.log(image)//image is the name of the field
  var prodobj = {
    productid:uuid(),
    productname:req.body.productname,
    productprice:req.body.productprice,
    productdesc:req.body.productdesc,
    address:req.body.address,
    location:req.body.location
  }
  productHelper.addProduct(prodobj,(productid)=>{
    image.mv("./public/product-images/"+productid+".jpg",(err,done)=>{
      if (!err) {
        res.render("../views/admin-addproduct.hbs",{title:"add product",admin:false})
        console.log("product added")
      } else {
        console.log(err)
      }
    })
  })
  
  console.log("post add prod")
})

router.get("/admin/allorders",(req,res,next)=>{
   productHelper.getAllOrders().then(function(orders){
     productHelper.getAllDeliveryGuy().then((deliveryguys)=>{
       console.log(deliveryguys)
      res.render("../views/orders.hbs",{admin:false,title:"orders",orders:orders,deliveryguys:deliveryguys})
     })
     
   })
})

router.get("/viewproduct/:productid",(req,res,next)=>{
  productHelper.getProduct(req.params.productid).then((result)=>{
    res.render("../views/viewproduct.hbs",{product:result,user:true,title:"Product Info"})
  })
})

router.get("/signout",(req,res)=>{
  req.session.destroy()  ;
  res.clearCookie('connect.sid')
  res.redirect("login")
})

module.exports = router;
