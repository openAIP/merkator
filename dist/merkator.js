/**
 * Merkator - Reads and writes WGS84 coordinates in sexagesimal and decimal notation.
 *
 * (c) Stephan Besser <stephan.besser@googlemail.com>
 *
 * For full copyright and license information, please review the LICENSE
 * file that was distributed with this source code.
 */
"use strict";

function Merkator() {
    this.lon = null;
    this.lat = null;
    this.rawString = "";
}

/**
 * Convert decimal value to deg/min/sec value. Seconds are floored!
 *
 * @param decimal
 * @returns {string}
 */
Merkator.prototype.convertDecToDms = function convertDecToDms(decimal) {
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
 * Read longitude and latitude coordinate pair.
 *
 * @param x WGS84 longitude decimal value
 * @param y WGS84 latitude decimal value
 *
 * @returns {*}
 */
Merkator.prototype.readCoord = function readCoord(x, y) {
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
    
    this.lon = x;
    this.lat = y;
    
    return this;
};

/**
 * Read input string. If string is a valid coordinate string, either as sexagesimal or decimal notation, a valid
 * Merkator object is returned. Otherwise the method will throw a console.log error and return false.
 *
 * @param string user input string. Should either be a WGS84 coordinate string in sexagesimal or decimal notation
 * @returns {*}
 */
Merkator.prototype.readString = function readString(string) {
    // do not process empty string
    if (string === '') {
        return false;
    }
    
    /**
     * Sexagesimal/decimal notation may be inserted in many different ways. Each possible notation is tested
     * and if it is valid, longitude and latitude decimal values are calculated and stored for further internal
     * processing. The original input string is also stored.
     */
    var sexaTokens = this._parseSexagesimalNotation(string);
    if (sexaTokens) {
        this._setFromDecimalArray(sexaTokens, string);
        
        return true;
    }
    var decTokens = this._parseDecimalNotation(string);
    if (!decTokens) {
        this._setFromDecimalArray(decTokens, string);
        console.log('Input string ' + string + ' is not a valid coordinate string!');
        
        return false;
    }
    
    return this;
};

/**
 * Return coordinate value in decimal notation.
 *
 * @returns {*}
 */
Merkator.prototype.toDecimal = function toDecimal(format) {
    var decimalString = '';
    
    format = format == undefined ? 'xy' : format.toLowerCase();
    
    if (!this.lon || !this.lat) {
        console.log('Cannot build decimal string from empty coordinate value!');
        
        return false;
    }
    
    switch (format) {
        case 'xy':
            decimalString = this.lon + ' ' + this.lat;
            break;
        default:
        case 'yx':
            decimalString = this.lat + ' ' + this.lon;
            break;
    }
    
    return decimalString;
};

/**
 * Get coordinate values as sexagesimal notation.
 *
 * @returns {string}
 */
Merkator.prototype.toSexagesimal = function toSexagesimal() {
    var xDms = this.convertDecToDms(this.lon);
    var yDms = this.convertDecToDms(this.lat);
    
    // longitude value
    (this.lon > 0) ? xDms += 'E' : xDms += 'W';
    // latitude value
    (this.lat > 0) ? yDms += 'N' : yDms += 'S';
    
    return yDms + ' ' + xDms;
};

/**
 * Return current WGS84 coordinate values as WKT string. Returns false if called before any coordinate value
 * has been read.
 *
 * @returns {*}
 */
Merkator.prototype.toWkt = function toWkt() {
    
    if (!this.lon || !this.lat) {
        console.log('Cannot build WKT string from empty coordinate value!');
        
        return false;
    }
    
    return 'POINT(' + this.lon + ' ' + this.lat + ')';
};

/**
 * Return coordinate longitude value in decimal.
 *
 * @returns {*}
 */
Merkator.prototype.getLon = function getLon() {
    return this.lon;
};

/**
 * Return coordinate latitude value in decimal.
 *
 * @returns {*}
 */
Merkator.prototype.getLat = function getLat() {
    return this.lat;
};

/**
 * Returns the raw user input string.
 *
 * @returns {string}
 */
Merkator.prototype.getInputString = function getInputString() {
    return this.rawString;
};

/**
 * Trim string and remove all whitespaces.
 *
 * @param string
 * @returns {*}
 */
Merkator.prototype._cleanseString = function _cleanseString(string) {
    if (!string) {
        return false;
    }
    string = string.replace(/,/g, ' ');
    
    return string.replace(/\s+/g, ' ').trim(); // trim string
};

/**
 * Search a string for a decimal coordinate representation using a regex. Returns false if string doesnt
 * match the decimal regex. Returns an array of x and y coordinates if a string in decimal notation is
 * found.
 *
 * @param string
 * @returns {*}
 */
Merkator.prototype._parseDecimalNotation = function _parseDecimalNotation(string) {
    /**
     * Default ordering for coordinates is LAT/LON . Regex works for both LAT/LON and LON/LAT.
     *
     * 1.) 34.45456 -101.21354
     * 2.) 34.45456, -101.21354
     */
    var searchDecimal = /^([-+]?([0-8]?\d(\.\d+)?|90(\.0+)?))[,\s]([-+]?(180(\.0+)?|((1[0-7]\d)|([0-9]?\d))(\.\d+)?))$/;
    var stripDelimiterRegex = /[^A-Za-z0-9- \.]/;
    
    var cleanString = this._cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
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
 * Check a string for a sexagesimal coordinate representation using a regex. Returns false if string doesnt
 * match the sexagesimal regex. Returns an array of x and y coordinates if a string in sexagesimal notation is
 * found.
 *
 * @param string
 * @returns {*}
 */
Merkator.prototype._parseSexagesimalNotation = function _parseSexagesimalNotation(string) {
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
    
    var cleanString = this._cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
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
    var x = this._toDecimals(lonDeg, lonMin, lonSec);
    var y = this._toDecimals(latDeg, latMin, latSec);
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
 * Convert degrees, minutes and seconds to decimals.
 *
 * @param deg integer
 * @param min integer
 * @param sec float
 * @returns {number}
 */
Merkator.prototype._toDecimals = function _toDecimals(deg, min, sec) {
    var minutes = parseFloat(min) + parseFloat(sec) / 60;
    
    return parseFloat(deg) + parseFloat(minutes) / 60;
};

/**
 * Sets x and y coordinate value from an array.
 *
 * @param searchArr array returned from parseDecimalNotation() or parseDecimalNotation()
 * @param string raw user input string
 * @returns {*}
 */
Merkator.prototype._setFromDecimalArray = function _setFromDecimalArray(decimalArr, string) {
    var x = parseFloat(decimalArr[0]);
    var y = parseFloat(decimalArr[1]);
    
    this.lon = x;
    this.lat = y;
    this.rawString = string;
    
    return this;
};

module.exports = Merkator;
