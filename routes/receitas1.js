var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('receitas1');
});

module.exports = router;