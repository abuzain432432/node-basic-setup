// terminating the process is crucial here because in this case will is in unclean stage and really need to be restart
process.on('uncaughtException', err => {
  console.log(
    '################## UNHANDLED EXCEPTIONS ###############'
  );
  console.log(err);
  process.exit(1);
});

const app = require('./app');
const mongoose = require('mongoose');

const clientOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
    autoIndex: true,
  },
};
let server;
const init = async () => {
  try {
    server = app.listen(process.env.PORT, 'localhost', async () => {
      await mongoose.connect(
        process.env.DB_CONNECTION_STRING,
        clientOptions
      );
      await mongoose.connection.db.admin().command({ ping: 1 });
      console.info(`Server running at http://localhost:8000/`);
    });
  } catch (err) {
    console.log(
      '############################## MONGOOS CONNECTION ERROR #################################'
    );
    await mongoose.disconnect();
  }
};
init();

// NOTE Handling unhandled async errors gracefully
process.on('unhandledRejection', err => {
  console.log(
    '############################## NAME #################################'
  );

  console.log(err?.message);
  server.close(() => {
    process.exit(1);
  });
});
