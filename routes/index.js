var express = require("express");
var router = express.Router();
const { processSearchQuery } = require("../processors/search-processor");

/* GET home page. */
router.get("/", function (req, res, next) {
   res.render("index", { title: "Express" });
});

router.get("/query", async function (req, res, next) {
   const searchQuery = req.query.search;
   res.json(await processSearchQuery(searchQuery));
});

module.exports = router;
