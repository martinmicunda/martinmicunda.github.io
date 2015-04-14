---
layout: post

title: Build a hybrid mobile app with Ionic, Cordova, Node.js, MongoDB, Redis, Ansible and Vagrant part II
subtitle: "Build backend code with Node.js, MongoDB and Redis"

excerpt: "In part 1 of this series I showed you how to prepare development environment with Vagrant and Ansible. In this second post we gonna build back-end code with Node.js, MongoDB and Redis for our ionic-photo-gallery app."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---
In [part 1](http://martinmicunda.com/2015/04/10/build-ionic-photo-gallery-app-I/) of this series I showed you how to prepare development environment with Vagrant and Ansible. In this second post we gonna build back-end code with Node.js, MongoDB and Redis for our `ionic-photo-gallery` app.

 - [part I - prepare the development environment with Vagrant and Ansible](http://martinmicunda.com/2015/04/10/build-ionic-photo-gallery-app-I/)
 - **part II - build backend code with Node.js, MongoDB and Redis**
 - part III - build hybrid mobile app with Ionic and Apache Cordova

The code for this project can be found on the [GitHub](https://github.com/martinmicunda/ionic-photo-gallery).

##Code Organisation
I prefer split my code by modules/features more then put all controller files to controllers folder and all model files to models folder so in the end your structure should look like this:
![server-code-organisation](https://raw.githubusercontent.com/martinmicunda/martinmicunda.github.io/master/images/posts/ionic-app-code-structure-server.png)
> **NOTE**: I took some inspiration from [MEAN.JS](http://meanjs.org/).

##Install Dependencies
Before we start write any code we need to install all server dependencies that are required for this project. Create `package.json` file under `ionic-photo-gallery/server/` directory:

```bash
$ mkdir server && cd server
$ touch package.json
```

and copy below code to package.json:

*ionic-photo-gallery/server/package.json*

```json
{
    "name": "ionic-photo-gallery-server",
    "version": "0.0.0",
    "private": true,
    "main": "index.js",
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index -w 'src/**/*' --ext 'js json'",
        "debug": "nodemon index --debug -w 'src/**/*' --ext 'js json'",
        "lint": "jshint src/**/*.js",
        "postmerge": "npm install",
        "pretest": "npm run lint"
    },
    "keywords": [
        "ionic",
        "mobile"
    ],
    "dependencies": {
        "express": "^4.12.3",
        "mm-node-logger": "^0.0.*",
        "colors": "^1.0.3",
        "morgan": "^1.5.2",
        "helmet": "^0.7.0",
        "body-parser": "^1.12.2",
        "method-override": "^2.3.2",
        "passport": "^0.2.1",
        "passport-local": "^1.0.0",
        "mongoose": "^3.8.25",
        "redis": "^0.12.1",
        "jsonwebtoken": "^4.2.1",
        "path": "^0.11.14",
        "glob": "^5.0.3",
        "lodash": "^3.5.0",
        "bcryptjs": "^2.1.0",
        "cors": "^2.5.3",
        "multer": "^0.1.8"
    },
    "devDependencies": {
        "jshint": "latest",
        "nodemon": "^1.3.7"
    }
}
```

then you run:

```bash
$ npm install
```

##Utils
We gonna use path utils function to load specific files in this project e.g. routes, config.

*ionic-photo-gallery/server/src/utils/path-utils.js*

```javascript
'use strict';

var _    = require('lodash');
var glob = require('glob');
var path = require('path');

function getGlobbedPaths(globPatterns, excludes) {
    // URL paths regex
    var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

    // The output array
    var output = [];

    // If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob
    if (_.isArray(globPatterns)) {
        globPatterns.forEach(function(globPattern) {
            output = _.union(output, getGlobbedPaths(globPattern, excludes));
        });
    } else if (_.isString(globPatterns)) {
        if (urlRegex.test(globPatterns)) {
            output.push(globPatterns);
        } else {
            var files = glob.sync(globPatterns);
            if (excludes) {
                files = files.map(function(file) {
                    if (_.isArray(excludes)) {
                        for (var i in excludes) {
                            file = file.replace(excludes[i], '');
                        }
                    } else {
                        file = file.replace(excludes, '');
                    }
                    return file;
                });
            }
            output = _.union(output, files);
        }
    }

    return output;
}

exports.getGlobbedPaths = getGlobbedPaths;
```

##Configuration
###Config
If you have heard about "[The Twelve-Factor App](http://12factor.net/config)" then you probably know we should store config in environment variables so we don't need to create multiple config files for development, test, and production environments. For this reason we have installed [direnv](http://direnv.net/) in [part 1](http://martinmicunda.com/2015/04/10/build-ionic-photo-gallery-app-I/) on our Vagrant box. `direnv` is an environment variable manager so before each prompt it checks for the existence of an `.envrc` file in the current and parent directories. If the file exists, it is loaded into a bash sub-shell and all exported variables are then captured by direnv and then made available to our application. If you want to use `direnv` create `.envrc` file under `ionic-photo-gallery/server/` directory.

*ionic-photo-gallery/server/.envrc*

```
export NODE_PORT=3000
export NODE_ENV=development
	.
	.
	.
```

> **NOTE:** I always add this file to `.gitignore` so it never happens I commit sensitive information.

I still prefer to have one config file for my environment variables in my app as an abstraction layer or at least defined the default values.

*ionic-photo-gallery/server/src/config/config.js*

```javascript
'use strict';

var config = {};

config.environment = process.env.NODE_ENV || 'development';

// Upload files in memory
config.uploadFilesInMemory = false;

// Populate the DB with sample data
config.seedDB = true;

// Token settings
config.token = {
    secret: process.env.TOKEN_SECRET || 'ionic-photo-gallery',
    expiration: process.env.TOKEN_EXPIRATION || 60*60*24 //24 hours
};

// Server settings
config.server = {
    host: '0.0.0.0',
    port: process.env.NODE_PORT || 3000
};

// MongoDB settings
config.mongodb = {
    dbURI: "mongodb://127.0.0.1:27017/ionic-photo-gallery",
    dbOptions: {"user": "", "pass": ""}
};

// Redis settings
config.redis = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    options: {

    }
};

// Export configuration object
module.exports = config;
```

###Mongoose
I am using this file across all my projects as it try follow best practice for creating, maintaining and using a Mongoose connection like:

- open the connection when the app process start
- start the app server when after the database connection is open (optional)
- monitor the connection events (`connected`, `error` and `disconnected`)
- close the connection when the app process terminates

*ionic-photo-gallery/server/src/config/mongoose.js*

```javascript
'use strict';

var logger   = require('mm-node-logger')(module);
var mongoose = require('mongoose');
var config   = require('./config');

function createMongooseConnection(cb) {
    // create the database connection
    mongoose.connect(config.mongodb.dbURI, config.mongodb.dbOptions);

    // when successfully connected
    mongoose.connection.on('connected', function () {
        logger.info('Mongoose connected to ' + config.mongodb.dbURI);
    });

    // if the connection throws an error
    mongoose.connection.on('error', function (err) {
        logger.error('Mongoose connection error: ' + err);
    });

    // when the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        logger.info('Mongoose disconnected');
    });

    // when the connection is open
    mongoose.connection.once('open', function () {
        if(cb && typeof(cb) === 'function') {cb();}
    });

    // if the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            logger.info('Mongoose disconnected through app termination');
            process.exit(0);
        });
    });
}

module.exports = createMongooseConnection;
```

### Redis
Maybe you ask why do we need Redis for this project. Well the main reason is security. Let's say user hit the signout button and your token would be removed from the TokenService on the Ionic/Angular side, but it's still a valid token and could be hijacking and used by an attacker to make request on the API until its expiration which is handled by [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken). So if user signin we generate and store token in Redis and if user hit signout button we remove that token from Redis so the token can't be use any more. You will find more about token in [authentication section](#authentication).
> **NOTE**: If you are using `https` you could avoid the need to store token in Redis.

*ionic-photo-gallery/server/src/config/redis.js*

```javascript
var redis  = require('redis');
var logger = require('mm-node-logger')(module);
var config = require('./config');

var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on('connect', function () {
    logger.info('Redis connected to ' + config.redis.host + ':' + config.redis.port);
});

redisClient.on('error', function (err) {
    logger.error('Redis error: ' + err);
});

module.exports = redisClient;
```

##Seed
Sometimes I like when I have option to have fresh database with some mock data each time application start. To turn on seed data just set `config.seedDB` in `config.js` to `true`.

*ionic-photo-gallery/server/src/config/seed.js*

```javascript
'use strict';

var logger   = require('mm-node-logger')(module);
var mongoose = require('mongoose');
var User     = require('../user/user.model');
var Image    = require('../image/image.model');

var testUserId = mongoose.Types.ObjectId();

User.find({}).remove(function() {
    User.create({
            _id: testUserId,
            provider: 'local',
            name: 'Test',
            email: 'test@test.com',
            password: 'test'
        }, function() {
            logger.info('Finished populating users');
        }
    );
});

Image.find({}).remove(function() {
    Image.create({
        fileName : 'Slovakia',
        url : 'http://www.rocketroute.com/wp-content/uploads/Carpathian-mountains-Slovakia-685x458.jpg?125416',
        user: testUserId
    }, function() {
        logger.info('Finished populating images');
    });
});
```

##Express
I gonna split the code to small pieces to give you better overview how express config code works. First we gonna add all dependencies:

*ionic-photo-gallery/server/src/config/express.js*

```javascript
'use strict';

var cors           = require('cors');
var path           = require('path');
var morgan         = require('morgan');
var helmet         = require('helmet');
var multer         = require('multer');
var logger         = require('mm-node-logger')(module);
var express        = require('express');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var pathUtils      = require('../utils/path-utils');
var config         = require('./config');
```

Initialise application middleware:

```javascript
function initMiddleware(app) {
    // Showing stack errors
    app.set('showStackError', true);

    // Enable jsonp
    app.enable('jsonp callback');

    // Environment dependent middleware
    if (config.environment === 'development') {
        // Enable logger (morgan)
        app.use(morgan('dev'));

        // Disable views cache
        app.set('view cache', false);
    } else if (config.environment === 'production') {
        app.locals.cache = 'memory';
    }

    // Request body parsing middleware should be above methodOverride
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());

    // Add multipart handling middleware
    app.use(multer({
        dest: './uploads/',
        inMemory: config.uploadFilesInMemory
    }));

    // Setting router and the static folder for uploaded files
    app.use('/uploads', express.static(path.resolve('./uploads')));
}
```

> **NOTE:** I am using multer to upload images that user have captured via the camera phone and you have option to store images in memory or on disk by setting `config.uploadFilesInMemory` in `config.js` file. If this project would go to production I would use `S3` and `CDN` instead of `multer`.

Configure Helmet headers configuration to secure Express headers:

```javascript
function initHelmetHeaders(app) {
    app.use(helmet.xframe());
    app.use(helmet.xssFilter());
    app.use(helmet.nosniff());
    app.use(helmet.ienoopen());
    app.disable('x-powered-by');
}
```

Configure CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests:

```javascript
function initCrossDomain(app) {
    app.use(cors());
    app.use(function(req, res, next) {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
        res.set('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token');

        next();
    });
}
```

Configure app config files:

```javascript
function initGonfig(app) {
    pathUtils.getGlobbedPaths(path.join(__dirname, '../**/*.config.js')).forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
}
```

Configure app routes files:

```javascript
function initRoutes(app) {
    pathUtils.getGlobbedPaths(path.join(__dirname, '../**/*.routes.js')).forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
}
```

Populate DB with sample data:

```javascript
function initDB() {
    if(config.seedDB) {
        require('./seed');
    }
}
```

Initialise the Express application:

```javascript
function init() {
    var app = express();
    initMiddleware(app);
    initHelmetHeaders(app);
    initCrossDomain(app);
    initGonfig(app);
    initRoutes(app);
    initDB();

    return app;
}
```

Export the express config module:

```javascript
module.exports.init = init;
```

The `express.js` file can be found [here](https://github.com/martinmicunda/ionic-photo-gallery/blob/master/server%2Fsrc%2Fconfig%2Fexpress.js).


##Modules

###Authentication
I am using [passport](https://www.npmjs.com/package/passport) and [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) for authentication. First we need to create local passport strategy but if you want to you can add more strategies e.g. facebook, google.

*ionic-photo-gallery/server/src/authentication/strategies/local.js*

```javascript
'use strict';

var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

function localStrategy(User, config) {
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, callback) {
            User.findOne({
                email: email.toLowerCase()
            }, function(err, user) {
                if (err) return callback(err);

                // no user found with that email
                if (!user) {
                    return callback(null, false, { message: 'The email is not registered.' });
                }
                // make sure the password is correct
                user.comparePassword(password, function(err, isMatch) {
                    if (err) { return callback(err); }

                    // password did not match
                    if (!isMatch) {
                        return callback(null, false, { message: 'The password is not correct.' });
                    }

                    // success
                    return callback(null, user);
                });
            });
        }
    ));
}

module.exports = localStrategy;
```

Configure authentication:

*ionic-photo-gallery/server/src/authentication/authentication.config.js*

```javascript
'use strict';

var path      = require('path');
var passport  = require('passport');
var User      = require('../user/user.model.js');
var config    = require('../config/config');
var pathUtils = require('../utils/path-utils');

module.exports = function(app) {
    // Initialize strategies
    pathUtils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function(strategy) {
        require(path.resolve(strategy))(User, config);
    });

    // Add passport's middleware
    app.use(passport.initialize());
};
```

Token controller is responsible for creating, deleting and verifying token:

*ionic-photo-gallery/server/src/authentication/token.controller.js*

```javascript
'use strict'

var jwt    = require('jsonwebtoken');
var redis  = require('../config/redis');
var config = require('../config/config');

function extractTokenFromHeader(headers) {
    if (headers == null) throw new Error('Header is null');
    if (headers.authorization == null) throw new Error('Authorization header is null');

    var authorization = headers.authorization;
    var authArr = authorization.split(' ');
    if (authArr.length !== 2) throw new Error('Authorization header value is not of length 2');

    var token = authArr[1];

    try {
        jwt.verify(token, config.token.secret);
    } catch(err) {
        throw new Error('The token is not valid');
    }

    return token;
}
```

Create a new JWT token and stores it in redis with payload data for a particular period of time:

```javascript
function createToken(payload, cb) {
    var ttl = config.token.expiration;

    if(payload != null && typeof payload !== 'object') { return cb(new Error('payload is not an Object')) }
    if(ttl != null && typeof ttl !== 'number') { return cb(new Error('ttl is not a valid Number')) }

    var token = jwt.sign(payload, config.token.secret, { expiresInMinutes: config.token.expiration });

    // stores a token with payload data for a ttl period of time
    redis.setex(token, ttl, JSON.stringify(payload), function(token, err, reply) {
        if (err) { return cb(err); }

        if(reply) {
            cb(null, token);
        } else {
            cb(new Error('Token not set in Redis'));
        }
    }.bind(null, token));
}
```

Expires a token by deleting the entry in redis:

```javascript
function expireToken(headers, cb) {
    try {
        var token = extractTokenFromHeader(headers);

        if(token == null) {return cb(new Error('Token is null'));}

        // delete token from redis
        redis.del(token, function(err, reply) {
            if(err) {return cb(err);}

            if(!reply) {return cb(new Error('Token not found'));}

            return cb(null, true);
        });
    } catch (err) {
        return cb(err);
    }
}
```

Verify if token is valid:

```javascript
function verifyToken(headers, cb) {
    try {
        var token = extractTokenFromHeader(headers);

        if(token == null) {return cb(new Error('Token is null'));}

        // gets the associated data of the token
        redis.get(token, function(err, userData) {
            if(err) {return cb(err);}

            if(!userData) {return cb(new Error('Token not found'));}

            return cb(null, JSON.parse(userData));
        });
    } catch (err) {
        return cb(err);
    }
}
```

Export the token controller module:

```javascript
module.exports = {
    createToken: createToken,
    expireToken: expireToken,
    verifyToken: verifyToken
};
```

Authentication controller it uses in `authentication.routes.js` and it keeps basic functionality like signin, signout, signup and check if API request is authenticated:

*ionic-photo-gallery/server/src/authentication/authentication.controller.js*

```javascript
'use strict';
var logger   = require('mm-node-logger')(module);
var passport = require('passport');
var token    = require('./token.controller.js');
var User     = require('../user/user.model.js');
```

Signin with email after passport authentication:

```javascript
function signin(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        var error = err || info;
        if (error) return res.status(401).send(error);

        // Remove sensitive data before login
        user.password = undefined;
        user.salt = undefined;

        token.createToken(user, function(res, err, token) {
            if(err) {
                logger.error(err);
                return res.status(400).send(err);
            }

            res.status(201).json({token: token});
        }.bind(null, res));
    })(req, res, next)
}
```

Signout user and expire token:

```javascript
function signout(req, res) {
    token.expireToken(req.headers, function(err, success) {
        if (err) {
            logger.error(err.message);
            return res.status(401).send(err.message);
        }

        if(success) {
            delete req.user;
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });
}
```

Create new user and login user in:

```javascript
function signup(req, res) {
    var email = req.body.email || '';
    var password = req.body.password || '';

    if (email == '' || password == '') {
        return res.sendStatus(400);
    }

    // Init Variables
    var user = new User(req.body);
    // Add missing user fields
    user.provider = 'local';

    // Then save the user
    user.save(function(err, user) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            // Remove sensitive data before login
            user.password = undefined;
            user.salt = undefined;

            token.createToken(user, function(res, err, token) {
                if (err) {
                    logger.error(err.message);
                    return res.status(400).send(err);
                }

                res.status(201).json({token: token});
            }.bind(null, res));
        }
    });
}
```

Middleware to verify the token and attaches the user object to the request if authenticated:

```javascript
function isAuthenticated(req, res, next) {
    token.verifyToken(req.headers, function(next, err, data) {
        if (err) {
            logger.error(err.message);
            return res.status(401).send(err.message);
        }

        req.user = data;

        next();
    }.bind(null, next));
}
```

 Export the authentication controller module:

```javascript
module.exports = {
    signin: signin,
    signout: signout,
    signup: signup,
    isAuthenticated: isAuthenticated
};
```

Authentication routes file is basically our API endpoint and we keep this file really simple as all our logic is in controllers:

*ionic-photo-gallery/server/src/authentication/authentication.routes.js*

```javascript
'use strict';

var authentication = require('./authentication.controller.js');

function setAuthenticationRoutes(app) {
    app.route('/auth/signin').post(authentication.signin);
    app.route('/auth/signout').get(authentication.signout);
    app.route('/auth/signup').post(authentication.signup);
}

module.exports = setAuthenticationRoutes;
```

###User
First we need to create user schema:

*ionic-photo-gallery/server/src/user/user.model.js*

```javascript
'use strict';

var bcrypt   = require('bcryptjs');
var mongoose = require('mongoose');

var SALT_WORK_FACTOR = 10;
var authTypes = ['github', 'twitter', 'facebook', 'google'];

var validateLocalStrategyProperty = function(property) {
    return ((this.provider !== 'local' && !this.updated) || property.length);
};

var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        validate: [validateLocalStrategyProperty, 'Please fill in your name']
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        lowercase: true,
        validate: [validateLocalStrategyProperty, 'Please fill in your email'],
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    },
    avatar: {
        type: String,
        default: 'https://raw.githubusercontent.com/martinmicunda/employee-scheduling-ui/master/src/images/anonymous.jpg?123456'
    },
    provider: {
        type: String,
        required: 'Provider is required'
    },
    updated: {
        type: Date
    },
    created: {
        type: Date,
        default: Date.now
    }
});
```

then add validations for email and password fields:

```javascript
UserSchema
    .path('email')
    .validate(function(email) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return email.length;
    }, 'Email cannot be blank');

UserSchema
    .path('password')
    .validate(function(password) {
        if (authTypes.indexOf(this.provider) !== -1) return true;
        return password.length;
    }, 'Password cannot be blank');

UserSchema
    .path('email')
    .validate(function(value, respond) {
        var self = this;
        this.constructor.findOne({email: value}, function(err, user) {
            if(err) throw err;
            if(user) {
                if(self.id === user.id) return respond(true);
                return respond(false);
            }
            respond(true);
        });
    }, 'The specified email address is already in use.');
```

add pre-save hook (execute before each user.save() call):

```javascript
UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) { return next(); }

    // password changed so we need to hash it (generate a salt)
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) { return next(err); }

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) { return next(err); }

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});
```

add schema method to comparePassword:

```javascript
UserSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        cb(err, isMatch);
    });
};
```

and in the end we export schema:

```javascript
module.exports = mongoose.model('User', UserSchema);
```

The user controller is responsible only for getting users list or user details:

*ionic-photo-gallery/server/src/user/user.controller.js*

```javascript
'use strict';

var logger = require('mm-node-logger')(module);
var User   = require('./user.model.js');

function findById(req, res) {
    return User.findById(req.params.id, 'name email avatar', function (err, user) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            res.json(user);
        }
    });
}

function findAll(req, res) {
    User.find(function(err, users) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            res.json(users);
        }
    });
}

module.exports = {
    findById: findById,
    findAll: findAll
};

```

We have only two endpoints here and we are using `authentication.isAuthenticated` middleware to check if API request is authenticated:

*ionic-photo-gallery/server/src/user/user.routes.js*

```javascript
'use strict';

var user           = require('./user.controller.js');
var authentication = require('../authentication/authentication.controller.js');

function setUserRoutes(app) {
    app.route('/users/:id').get(authentication.isAuthenticated, user.findById);
    app.route('/users').get(authentication.isAuthenticated, user.findAll);
}

module.exports = setUserRoutes;
```

###Image
The image module is really simple as it just store and delete images. So let's first create model:

*ionic-photo-gallery/server/src/image/image.model.js*

```javascript
'use strict';

var mongoose = require('mongoose');
var User = require('../user/user.model.js');

var ImageSchema = new mongoose.Schema({
    fileName: {
        type: String
    },
    url: {
        type: String,
        trim: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User
    }
});

module.exports = mongoose.model('Image', ImageSchema);
```

then controller:

*ionic-photo-gallery/server/src/image/image.controller.js*

```javascript
'use strict';

var path   = require('path');
var logger = require('mm-node-logger')(module);
var Image  = require('./image.model.js');

function findByUser(req, res) {
    return Image.find({user: req.query.userId}, function (err, images) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            return res.json(images);
        }
    });
}

function create(req, res) {
    var image = new Image();
    image.fileName = req.files.image.name;
    image.url = path.join(req.body.url, req.files.image.path);
    image.user = req.body.userId;

    image.save(function(err, image) {
        if (err) {
            logger.error(err.message);
            return res.status(400).send(err);
        } else {
            res.status(201).json(image);
        }
    });
}

function deleteImage(req, res) {
    Image.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            logger.error(err.message);
            return res.status(500).send(err);
        } else {
            res.sendStatus(204);
        }
    });
}

module.exports = {
    findByUser: findByUser,
    create: create,
    delete: deleteImage
};
```

and then routes. The routes require authentication same like in user module:

*ionic-photo-gallery/server/src/image/image.routes.js*

```javascript
var image          = require('./image.controller.js');
var authentication = require('../authentication/authentication.controller.js');

function setImageRoutes(app) {
    app.route('/images')
        .post(authentication.isAuthenticated, image.create)
        .get(authentication.isAuthenticated, image.findByUser);

    app.route('/images/:id').delete(authentication.isAuthenticated, image.delete);

}

module.exports = setImageRoutes;
```

##Wrap Up
The last piece that we are missing is to create `index.js` file where we first create mongo connection and if connection was created successfully then init and start express app.

*ionic-photo-gallery/server/index.js*

```javascript
'use strict';

var logger  = require('mm-node-logger')(module);
var pkg     = require('./package.json');
var config  = require('./src/config/config');
var express = require('./src/config/express');
var mongodb = require('./src/config/mongoose');

mongodb(function startServer() {
    var app = express.init();

    app.listen(config.server.port, function () {
        logger.info('App is running');
    });
});
```

##Running App
###Development
To start the server you need to ssh into box:

```bash
$ vagrant ssh
```

Navigate to `ionic-photo-gallery/server` directory:

```bash
$ cd ionic-photo-gallery/server
```

>**NOTE:** **The [direnv](http://direnv.net/) is use as an environment variable manager so when you first time cd into server directory with a `.envrc` file in it, it will refuse to load the file. This is to protect you, since the contents of the .envrc will be executed by your shell, and they might come from untrusted sources. Simply run `direnv allow`, and it will trust that file until the next time it changes.**

Run server in development mode with nodemon:

```bash
$ npm run dev
```

###Debugging
To start the server in debugging mode you need to ssh into box:

```bash
$ vagrant ssh -- -L 5858:127.0.0.1:5858 #setup ssh proxy to VM
```

Navigate to `ionic-photo-gallery/server` directory:

```bash
$ cd ionic-photo-gallery/server
```

Run server in debug mode:

```bash
$ npm run debug
```

Run the following from your HOST machine, not your vagrant box:

```bash
$ telnet 127.0.0.1 5858
```
You should get a response like:

```bash
Type: connect
V8-Version: 3.14.5.9
Protocol-Version: 1
Embedding-Host: node v0.10.28
Content-Length: 0
```

Now you can debugging node.js session remotely using [WebStorm](http://www.jetbrains.com/webstorm/) or [Node Inspector](https://github.com/node-inspector/node-inspector).

##Conclusion
This post was quite long but I want you to have better understanding how back-end code works before we start developing ionic app in part 3. I would suggest you to keep eye on [MEAN.JS branch 4](https://github.com/meanjs/mean/tree/0.4.0) as you can borrow a lot of good ideas from there.

Full project you can be found on the [GitHub](https://github.com/martinmicunda/ionic-photo-gallery).