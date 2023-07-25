require('dotenv').config();
const express = require('express');
const server = express();
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = passportJWT;
const cookieParser = require('cookie-parser');
const { User } = require('./model/UserModel');
const { isAuth, sanitizeUser, cookieExtractor } = require('./services/common');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);
const { Order } = require('./model/OrderModel');

const productRoutes = require('./routes/ProductRoutes');
const categoriesRoutes = require('./routes/CategoriesRoutes');
const brandsRoutes = require('./routes/BrandsRoutes');
const userRoutes = require('./routes/UserRoutes');
const authRoutes = require('./routes/AuthRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const cartRoutes = require('./routes/CartRoutes');
// Webhook

const endpointSecret = process.env.ENDPOINT_SECRET;

server.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;

        const order = await Order.findById(
          paymentIntentSucceeded.metadata.orderId
        );
        order.paymentStatus = 'received';
        await order.save();

        break;
      // ... handle other event types
      default:
        
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

// JWT options 
server.use(express.static('build'));
server.use(cookieParser());

const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY; 

server.use(
  session({
    secret: process.env.SESSION_KEY, 
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);

//middlewares

server.use(passport.initialize());
server.use(passport.session());
server.use(
  cors({
    credentials: true, 
    exposedHeaders: ['X-Total-Count'],
  })
);

server.use(express.json()); // to parse req.body

// we can also use JWT token for client-only auth
server.use('/products', isAuth, productRoutes.router);
server.use('/categories', isAuth, categoriesRoutes.router);
server.use('/brands', isAuth, brandsRoutes.router);
server.use('/users',  isAuth, userRoutes.router);
server.use('/auth', authRoutes.router);
server.use('/cart', isAuth, cartRoutes.router); 
server.use('/orders', isAuth, orderRoutes.router);

// this line we add to make react router work in case of other routes doesnt match
server.get('*', (req, res) =>
  res.sendFile(path.resolve('build', 'index.html'))
);
       
// Passport Strategies  
passport.use( 
  'local',
  new LocalStrategy({ usernameField: 'email' }, async function (
    email,
    password,
    done
  ) {
    // by default passport uses username
    
    try {
      const user = await User.findOne({ email: email });
      
      if (!user) {
        return done(null, false, { message: 'invalid credentials' }); // for safety
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        'sha256',
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: 'invalid credentials' });
          }
          const token = jwt.sign(
            sanitizeUser(user),
            process.env.JWT_SECRET_KEY
          );
          done(null, { id: user.id, role: user.role, token }); // this lines sends to serializer
        }
      );
    } catch (err) {
      done(err);
    }
  })
);

passport.use( 
  'jwt',
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user)); // this calls serializer
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

// this changes session variable req.user when called from authorized request

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// Payments

// This is your test secret API key.

server.post('/create-payment-intent', async (req, res) => {
  const { totalAmount, orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // for decimal compensation
    currency: 'inr',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
  
});

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('database connected');
}

server.listen(process.env.PORT, () => {
  console.log('server started');
});