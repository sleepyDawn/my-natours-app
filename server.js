const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION: Shutting down....');
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected successfully!'));

console.log('checking environment : ', process.env.NODE_ENV);

// console.log(app.get('env'));
// console.log(process.env);

// 4. Start Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port: ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDELED REJECTION: Shutting down....');
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
