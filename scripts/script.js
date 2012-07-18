var csv = require('csv');

csv().fromPath('./relics_history.csv')
    .transform(function (row, index) {
        // TODO collect only necessary columns
        return [].concat(row[2], row[3]);
    })
    .on('data', function (row) {
        // process data
        return row;
    })
    .on('end', function (counter) {
        console.log( counter.toString() + ' rows parsed');
    })
    .on('error', function (err) {
        console.log(err);
        process.exit();
    });

function parse(results) {
}
