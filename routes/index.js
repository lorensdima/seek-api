var express = require("express");
var router = express.Router();
var store = require("app-store-scraper");

/* GET home page. */
router.get("/", function (req, res, next) {
   res.render("index", { title: "Express" });
});

router.get("/test", async function (req, res) {
   let data = await store.list({
      collection: store.collection.TOP_FREE_IPAD,
      category: store.category.GAMES_ACTION,
      num: 2,
   });
   res.json(data);
});

module.exports = router;
