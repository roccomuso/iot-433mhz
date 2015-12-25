var figlet = require('figlet');
 
figlet('IoT-433Mhz', function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
});