var fs = require('fs');
var d3 = require('d3');
var R = require('ramda');

fs.readFile('data/all.csv', 'utf8', function(e, temps) {
    var data = d3.csvParse(temps);

    var rolled = d3.nest()
        .key(function(d) { return d.type; })
        .key(function(d) { return d.year; })
        .entries(data);

    fs.writeFile('data/all_grouped.json', JSON.stringify(rolled, null), function(err) {
        console.log(err)
    });
});