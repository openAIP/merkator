/**
 * Merkator - Reads and writes WGS84 coordinates in sexagesimal and decimal notation.
 *
 * (c) Stephan Besser <stephan.besser@googlemail.com>
 *
 * For full copyright and license information, please review the LICENSE
 * file that was distributed with this source code.
 */
"use strict";

var _self = this;
var _lon = null;
var _lat = null;
var _rawString = "";

/**
 * Returns true if string is a valid sexagesimal string, false if not.
 *
 * @param string
 * @returns {boolean}
 */
var isCoordSexagesimal = function (string) {
    // check if string is in sexagesimal notation
    var searchArr = searchSexagesimalNotation(string);
    
    // regex doesn't match string, abort...
    if (!searchArr) {
        return false;
    }
    
    return true
};

/**
 * Returns true if string is a valid decimal coordinate string, false if not.
 *
 * @param string cleaned string as returned by cleanseString()
 * @returns {boolean}
 */
var isCoordDecimal = function (string) {
    // check if string is in decimal notation
    var searchArr = searchDecimalNotation(string);
    
    // regex doesn't match string, abort...
    if (!searchArr) {
        return false;
    }
    
    return true;
};

/**
 * Tests if input string is a known and valid coordinate string. Returns true if string is valid, false if not.
 * Coordinate lon and lat values are also saved for further processing if true.
 *
 * @param string
 * @returns {boolean}
 */
var createCoordFromString = function (string) {
    // do not process empty string
    if (string === '') {
        return false;
    }
    
    /**
     * Sexagesimal/decimal notation may be inserted in many different ways. Each possible notation is tested
     * and if it is valid, longitude and latitude decimal values are calculated and stored for further internal
     * processing. The original input string is also stored.
     */
    var sexaTokens = searchSexagesimalNotation(string);
    if (sexaTokens) {
        setFromDecimalArray(sexaTokens, string);
        
        return true;
    }
    var decTokens = searchDecimalNotation(string);
    if (decTokens) {
        setFromDecimalArray(decTokens, string);
        
        return true;
    }
    
    return false;
};

/**
 * Sets x and y coordinate value from an array.
 *
 * @param searchArr array returned from searchDecimalNotation() or searchDecimalNotation()
 * @param string raw user input string
 * @returns {*}
 */
var setFromDecimalArray = function (decimalArr, string) {
    var x = parseFloat(decimalArr[0]);
    var y = parseFloat(decimalArr[1]);
    
    _lon = x;
    _lat = y;
    _rawString = string;
    
    return _self;
};

/**
 * Check a string for a sexagesimal coordinate representation using a regex. Returns false if string doesnt
 * match the sexagesimal regex. Returns an array of x and y coordinates if a string in sexagesimal notation is
 * found.
 *
 * @param string
 * @returns {*}
 */
var searchSexagesimalNotation = function (string) {
    /**
     * Regex works for almost all notations:
     *
     * 1.) 45°34'21" N 120°47'23" E
     * 1.) 45°34'21.3245" N 120°47'23.23432" E
     * 2.) 45 34 21 N 120 47 23 E
     * 3.) 45:34:21 N 120:47:23 E
     * 4.) 45:34:21N 120:47:23E
     * 4.) N 45:34:21 E 120:47:23
     * 5.) any combination of the formats above
     */
    var sexagesimalSuffixedRegex = /^(0?[0-9]|[1-8][0-9]|90)([:\s])(0?[0-9]|[1-5][0-9]|60)([:\s])(0?[0-9]|[1-5][0-9]|60)(\.\d+)?\s?([NS])\s(00?[0-9]|0?[1-9][0-9]|[1-9][0-9]|1[0-7][0-9]|180)([:\s])(0?[0-9]|[1-5][0-9]|60)([:\s])(0?[0-9]|[1-5][0-9]|60)(\.\d+)?\s?([EW])$/;
    var sexagesimalPrefixedRegex = /^([NS])\s?(0?[0-9]|[1-8][0-9]|90)([:\s])(0?[0-9]|[1-5][0-9]|60)([:\s])(0?[0-9]|[1-5][0-9]|60)(\.\d+)?\s([EW])\s?(00?[0-9]|0?[1-9][0-9]|[1-9][0-9]|1[0-7][0-9]|180)([:\s])(0?[0-9]|[1-5][0-9]|60)([:\s])(0?[0-9]|[1-5][0-9]|60)(\.\d+)?$/;
    var stripDelimiterRegex = /[^A-Za-z0-9- \.]/;
    
    var cleanString = cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
    // strip delimiter from string
    var cleanString = cleanString.replace(stripDelimiterRegex, '');
    
    // check prefixed/suffixed hemisphere, suffixed first as this is the most common notation
    var coordSexa = sexagesimalSuffixedRegex.exec(cleanString);
    if (coordSexa) {
        // lat
        var latDeg = coordSexa[1];
        var latMin = coordSexa[3];
        var latSec = coordSexa[5] + coordSexa[6];
        var latCard = coordSexa[7];
        // lon
        var lonDeg = coordSexa[8];
        var lonMin = coordSexa[10];
        var lonSec = coordSexa[12] + coordSexa[13];
        var lonCard = coordSexa[14];
    } else {
        coordSexa = sexagesimalPrefixedRegex.exec(cleanString);
        if (coordSexa) {
            // lat
            var latCard = coordSexa[1];
            var latDeg = coordSexa[2];
            var latMin = coordSexa[4];
            var latSec = coordSexa[6] + coordSexa[7];
            // lon
            var lonCard = coordSexa[8];
            var lonDeg = coordSexa[9];
            var lonMin = coordSexa[11];
            var lonSec = coordSexa[13] + coordSexa[14];
        }
    }
    
    // regex doesn't match string, abort...
    if (!coordSexa) {
        return false;
    }
    
    // convert sexagesimal to decimals
    var x = toDecimals(lonDeg, lonMin, lonSec);
    var y = toDecimals(latDeg, latMin, latSec);
    // append '-' depending on direction
    if (latCard === 'S') {
        y = parseFloat('-' + y);
    }
    if (lonCard === 'W') {
        x = parseFloat('-' + x);
    }
    
    return [x, y];
};

/**
 * Search a string for a decimal coordinate representation using a regex. Returns false if string doesnt
 * match the decimal regex. Returns an array of x and y coordinates if a string in decimal notation is
 * found.
 *
 * @param string
 * @returns {*}
 */
var searchDecimalNotation = function (string) {
    /**
     * Default ordering for coordinates is LAT/LON . Regex works for both LAT/LON and LON/LAT.
     * If notation LON/LAT is used, call switchXY afterwards.
     *
     * 1.) 34.45456 -101.21354
     * 2.) 34.45456, -101.21354
     */
    var searchDecimal = /^([-+]?([0-8]?\d(\.\d+)?|90(\.0+)?))[,\s]([-+]?(180(\.0+)?|((1[0-7]\d)|([0-9]?\d))(\.\d+)?))$/;
    var stripDelimiterRegex = /[^A-Za-z0-9- \.]/;
    
    var cleanString = cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
    // strip delimiter from string
    var cleanString = cleanString.replace(stripDelimiterRegex, '');
    
    var searchArr = searchDecimal.exec(cleanString);
    
    // regex doesn't match string, abort...
    if (!searchArr) {
        return false;
    }
    
    var x = parseFloat(searchArr[1]);
    var y = parseFloat(searchArr[5]);
    
    return [x, y];
};

/**
 * Trim string and remove all whitespaces.
 *
 * @param string
 * @returns {*}
 */
var cleanseString = function (string) {
    if (!string) {
        return false;
    }
    string = string.replace(/,/g, ' ');
    
    return string.replace(/\s+/g, ' ').trim(); // trim string
};

/**
 * Convert degrees, minutes and seconds to decimals.
 *
 * @param deg integer
 * @param min integer
 * @param sec float
 * @returns {number}
 */
var toDecimals = function (deg, min, sec) {
    var minutes = parseFloat(min) + parseFloat(sec) / 60;
    
    return parseFloat(deg) + parseFloat(minutes) / 60;
};

/**
 * Convert decimal value to deg/min/sec value. Seconds are floored!
 *
 * @param decimal
 * @returns {string}
 */
var convertDecToDms = function (decimal) {
    //we only handle positive values
    var posDegs = Math.abs(decimal);
    // The whole units of degrees will remain the same (i.e. in 121.135° longitude, start with 121°)
    var deg = Math.floor(posDegs);
    // Multiply the decimal by 60 (i.e. .135 * 60 = 8.1).
    var degDecimalX60 = (posDegs % 1) * 60;
    // The whole number becomes the minutes (8').
    var min = Math.floor(degDecimalX60);
    // Take the remaining decimal and multiply by 60. (i.e. .1 * 60 = 6).
    // The resulting number becomes the seconds (6"). Seconds can remain as a decimal.
    var sec = ((degDecimalX60 % 1) * 60).toFixed(3);
    
    return deg + '°' + min + '\'' + sec + '"';
};

/**
 * Clears internally used variables.
 *
 * @returns {*}
 */
var clearVars = function () {
    _lon = null;
    _lat = null;
    _rawString = '';
    
    return _self;
};

/**
 * Read longitude and latitude coordinate pair.
 *
 * @param x WGS84 longitude decimal value
 * @param y WGS84 latitude decimal value
 *
 * @returns {*}
 */
var readCoord = function (x, y) {
    clearVars();
    
    x = parseFloat(x);
    y = parseFloat(y);
    
    // latitude
    if (Math.abs(y) > 90) {
        console.log('Latitude value cannot be higher than 90!');
        
        return false;
    }
    // longitude
    if (Math.abs(x) > 180) {
        console.log('Longitude value cannot ben  hire than 180!');
        
        return false;
    }
    
    _lon = x;
    _lat = y;
    
    return _self;
};

/**
 * Read input string. If string is a valid coordinate string, either as sexagesimal or decimal notation, a valid
 * Merkator object is returned. Otherwise the method will throw a console.log error and return false.
 *
 * @param string user input string. Should either be a WGS84 coordinate string in sexagesimal or decimal notation
 * @returns {*}
 */
var readString = function (string) {
    clearVars();
    
    // do not process empty string
    if (string === '') {
        return false;
    }
    
    if (!createCoordFromString(string)) {
        console.log('Input string ' + string + ' is not a valid coordinate string!');
        
        return false;
    }
    
    return _self;
};

/**
 * Return coordinate value in decimal notation.
 *
 * @returns {*}
 */
var toDecimal = function (format) {
    var decimalString = '';
    
    format = format == undefined ? 'xy' : format.toLowerCase();
    
    if (!_lon || !_lat) {
        console.log('Cannot build decimal string from empty coordinate value!');
        
        return false;
    }
    
    switch (format) {
        case 'xy':
            decimalString = _lon + ' ' + _lat;
            break;
        default:
        case 'yx':
            decimalString = _lat + ' ' + _lon;
            break;
    }
    
    return decimalString;
};

/**
 * Get coordinate values as sexagesimal notation.
 *
 * @returns {string}
 */
var toSexagesimal = function () {
    var xDms = convertDecToDms(_lon);
    var yDms = convertDecToDms(_lat);
    
    // longitude value
    (_lon > 0) ? xDms += 'E' : xDms += 'W';
    // latitude value
    (_lat > 0) ? yDms += 'N' : yDms += 'S';
    
    return yDms + ' ' + xDms;
};

/**
 * Return current WGS84 coordinate values as WKT string. Returns false if called before any coordinate value
 * has been read.
 *
 * @returns {*}
 */
var toWkt = function () {
    
    if (!_lon || !_lat) {
        console.log('Cannot build WKT string from empty coordinate value!');
        
        return false;
    }
    
    return 'POINT(' + _lon + ' ' + _lat + ')';
};

/**
 * Return coordinate longitude value in decimal.
 *
 * @returns {*}
 */
var getLon = function () {
    return _lon;
};

/**
 * Return coordinate latitude value in decimal.
 *
 * @returns {*}
 */
var getLat = function () {
    return _lat;
};

/**
 * Switches Lat/Lon values if set.
 *
 * @returns {*}
 */
var switchXY = function () {
    var cX = _lon;
    var cY = _lat;
    
    _lon = cY;
    _lat = cX;
    
    return _self;
};

/**
 * Returns the raw user input string.
 *
 * @returns {string}
 */
var getInputString = function () {
    return _rawString;
};

/**
 * Check if string is a valid WGS84 sexagesimal coordinate string.
 *
 * @param string
 * @returns {boolean}
 */
var isValidSexagesimalString = function (string) {
    return isCoordSexagesimal(string);
};

/**
 * Check if a string is valid decimal WGS84 coordinate string.
 *
 * @param string
 * @returns {boolean}
 */
var isValidDecimalString = function (string) {
    return isCoordDecimal(string);
};

module.exports.readCoord = readCoord;
module.exports.readString = readString;
module.exports.toDecimal = toDecimal;
module.exports.toSexagesimal = toSexagesimal;
module.exports.toWkt = toWkt;
module.exports.getLon = getLon;
module.exports.getLat = getLat;
module.exports.getInputString = getInputString;
module.exports.isValidSexagesimalString = isValidSexagesimalString;
module.exports.isValidDecimalString = isValidDecimalString;
module.exports.switchXY = switchXY;
