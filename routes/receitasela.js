var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('receitasela');
});

module.exports = router;