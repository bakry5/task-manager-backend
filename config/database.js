const mongoose = require('mongoose');

let connectionPromise = null;

const dbConnection = () => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 20000,
    })
    .then((conn) => {
      console.log(`Database Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      console.error(`Database Error: ${err}`);
      connectionPromise = null;
    });

  return connectionPromise;
};

module.exports = dbConnection;
