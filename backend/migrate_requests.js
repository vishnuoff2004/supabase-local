require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

const seq = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false,
});

seq.query(`
  CREATE TABLE IF NOT EXISTS DriverAgencyRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driverId INT NOT NULL,
    agencyId INT NOT NULL,
    status ENUM('Pending','Accepted','Denied') NOT NULL DEFAULT 'Pending',
    message VARCHAR(255),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_driver (driverId),
    INDEX idx_agency (agencyId)
  ) ENGINE=InnoDB;
`)
.then(() => { console.log('DriverAgencyRequests table created successfully'); seq.close(); })
.catch(e => { console.error('Error:', e.message); seq.close(); });
