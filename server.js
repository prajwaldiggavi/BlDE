const mysql = require('mysql');

let dbConnection;

function handleDisconnect() {
  dbConnection = mysql.createConnection({
    host: 'sql10.freesqldatabase.com',
    user: 'sql10760370',
    password: 'GUeSnpUSjf',
    database: 'sql10760370',
    port: 3306  // MySQL server's default port
  });

  dbConnection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      setTimeout(handleDisconnect, 2000); // Try reconnecting after 2 seconds
    } else {
      console.log('Connected to database');
    }
  });

  dbConnection.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect on connection loss
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = dbConnection;
