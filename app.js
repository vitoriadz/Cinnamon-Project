var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const crypto = require('crypto')
const {MongoClient} = require('mongodb');
const session = require('express-session');
const flash = require('express-flash');
var createError = require('http-errors');

const uri = "mongodb+srv://vitoriadz:IlwP4RUxa648Fs1e@cinnamon.0drnod3.mongodb.net/"
const client = new MongoClient(uri)
var aboutRouter = require('./routes/about');
var home1Router = require('./routes/home1');
var favoritosRouter = require('./routes/favoritos');
var comentariosRouter = require('./routes/comentarios');
var receitas1Router = require('./routes/receitas1');
var receitasrapRouter = require('./routes/receitasrap');
var receitaselaRouter = require('./routes/receitasela');
var receitasmelhRouter = require('./routes/receitasmelh');

const dbName = 'gerador';

var app = express();

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

const authTokens = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret: '53cR3t@_P@ssw0rd#f0r-Cinnamon!',
    resave: false,
    saveUninitialized: false
}));


app.use(flash());
app.use('/about', aboutRouter);
app.use('/home1', home1Router);
app.use('/favoritos', favoritosRouter);
app.use('/comentarios', comentariosRouter);
app.use('/receitas1', receitas1Router);
app.use('/receitas1/receitasela', receitaselaRouter);
app.use('/receitas1/receitasrap', receitasrapRouter);
app.use('/receitas1/receitasmelh', receitasmelhRouter);

app.get('/', function(req, res) {
  res.render('home');
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { email, firstName, lastName, password, confirmPassword } = req.body;

  if (password === confirmPassword) {
    checkUser(client, email).then((result) => {
      if (result) {
        req.flash('error', 'O usuário já está registrado!');
        res.redirect('/register');
      } else {
        const hashedPassword = getHashedPassword(password);

        register(client, {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword
        }).then(() => {
          req.flash('success', 'O registro foi completo! Faça a login para prosseguir!');
          res.redirect('/login');
        }).catch((error) => {
          req.flash('error', 'Tivemos um erro. Tente novamente!');
          res.redirect('/register');
        });
      }
    });
  } else {
    req.flash('error', 'As senhas não coincidem!');
    res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
    res.render('login', { message: req.flash('error')[0] });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    login(client, email, hashedPassword).then((user) => {
        
      if (user) {
            const authToken = generateAuthToken();

            authTokens[authToken] = user;
            res.cookie('AuthToken', authToken);
            res.redirect('/protected');
        } else {
            req.flash('error', 'Senha ou email inválidos!');
        const authCookie = user._id.toString();
    res.cookie('authCookie', authCookie, { maxAge: 9000000000, httpOnly: true });
    if (authCookie) {
    console.log('Usuário autenticado', authCookie);
  } else {
    console.log('Usuário não autenticado');
    }
            res.redirect('/login');
        }
    });
});
    
app.use((req, res, next) => {
  const authToken = req.cookies['AuthToken'];
  req.user = authTokens[authToken];
  next();
});

app.get('/protected', (req, res) => {
    if (req.user) {
        res.render('protected');
    } else {
        res.render('login', {
            message: 'Faça o login para prosseguir',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/logout', (req, res) => {
  res.clearCookie('AuthToken')
  res.redirect('/')
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

async function checkUser(client, email) {
  try {
    await client.connect()
    const result = await client.db("cinn").collection("collection").findOne({
      email: email
    })
    if (result) {
      return result
    } else {
      return false
    }
  } finally {
    await client.close()
  }
}

async function login(client, email, password) {
  try {
    await client.connect()
    const result = await client.db("cinn").collection("collection").findOne({
      email: email,
      password: password      
    })
    if (result) {
      return result
    } else {
      return false
    }
  } finally {
    await client.close()
  }
}

async function register(client, user) {
  try {
    await client.connect()
    await client.db("cinn").collection("collection").insertOne(user)
  } finally {
    await client.close()
  }
}

module.exports = app;