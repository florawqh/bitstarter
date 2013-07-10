#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLFILE_TMP = "d-index.html";
var URL_DEFAULT = "http://polar-lake-3486.herokuapp.com";

var assertFileExists = function(infile){
    var instr = infile.toString();
    if(!fs.existsSync(instr)){
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
	}
    return instr;
};

var cheerioHtmlFile = function(htmlfile){
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile){
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile){
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks){
	var present = $(checks[ii]).length>0;
	out[checks[ii]] = present;
	}
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};

var buildfn = function(){
    var response2console = function(result, response){
	if(result instanceof Error){
	console.error('Error: ' + util.format(response.message));
	}
	else{
	console.error("Wrote %s",HTMLFILE_TMP);
	fs.writeFileSync(HTMLFILE_TMP, result);
	var checkJson = checkHtmlFile(HTMLFILE_TMP,program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
	}

    };
    return response2console;
};

if(require.main == module){
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <html_url>','url to index.html',URL_DEFAULT)
	.parse(process.argv);
    if(program.url.toString())
    {
	var url=program.url.toString();
	var response2console = buildfn();
	rest.get(url).on('complete',response2console);
    }
    else{
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
}
else{
    exports.checkHtmlFile = checkHtmlFile;
}
