const { Driver } = require('../src/models');

async function fixImageUrls() {
  try {
    const drivers = await Driver.findAll();
    let fixed = 0;

    for (const driver of drivers) {
      let changed = false;

      if (driver.licenseDocUrl && driver.licenseDocUrl.includes('localhost:9000')) {
        const path = driver.licenseDocUrl.replace(/^https?:\/\/localhost:9000\/travel-agency\//, '');
        driver.licenseDocUrl = `/api/images/${path}`;
        changed = true;
      }

      if (driver.vehicleRcUrl && driver.vehicleRcUrl.includes('localhost:9000')) {
        const path = driver.vehicleRcUrl.replace(/^https?:\/\/localhost:9000\/travel-agency\//, '');
        driver.vehicleRcUrl = `/api/images/${path}`;
        changed = true;
      }

      if (changed) {
        await driver.save();
        fixed++;
        console.log(`Fixed driver ID ${driver.id}: ${driver.name}`);
      }
    }

    console.log(`\nDone. Fixed ${fixed} driver records.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixImageUrls();
