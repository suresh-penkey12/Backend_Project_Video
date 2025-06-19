let express = require("express");
let middleware =require("../middleware/middleware");
let router = express.Router();
let controler = require("../Controllers/connections_controller");
router.get("/",controler.root);
router.post("/assign/:email/:status",middleware,controler.assign);
router.get("/requests/:email",middleware,controler.requests);
router.get("/membor_requests/:email",middleware,controler.membor_requests);
router.get("/response/:action/:email/:result",middleware,controler.response);
router.get("/friends/:email",middleware,controler.friends);
router.get("/memborships/:email",middleware,controler.memborships);
router.post("/payment",controler.payment);
router.delete("/delete/:email",middleware,controler.deletemember);
router.post("/mail/:email",middleware,controler.mail)
module.exports=router;