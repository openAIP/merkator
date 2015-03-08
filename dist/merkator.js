/**
 * Merkator - Reads and writes WGS84 coordinates in sexagesimal and decimal notation.
 *
 * (c) Stephan Besser <stephan.besser@googlemail.com>
 *
 * For full copyright and license information, please review the LICENSE
 * file that was distributed with this source code or visit http://www.gnu.org/licenses/gpl-3.0
 *
 * @constructor
 */
function Merkator() {
    "use strict";


    var _this = this;
    _this.lon = null;
    _this.lat = null;
    _this.rawString = "";

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

        // run several checks to make sure we have a valid coordinate latitude longitude pair
        // latitude
        // degrees
        if (searchArr[1] > 90) {
            console.log('Latitude degrees value cannot be higher than 90!');

            return false;
        }
        // minutes
        if (searchArr[2] > 60) {
            console.log('Latitude minutes value cannot be higher than 60!');

            return false;
        }
        // seconds
        if (searchArr[3] > 60) {
            console.log('Latitude seconds value cannot be higher than 60!');

            return false;
        }

        // direction
        if (searchArr[4] !== 'N' && searchArr[4] !== 'S') {
            console.log('Latitude direction must be either \'N\' or \'S\'!');

            return false;
        }

        // longitude
        // degrees
        if (searchArr[5] > 180) {
            console.log('Longitude degrees value cannot be higher than 180!');

            return false;
        }
        // minutes
        if (searchArr[6] > 60) {
            console.log('Longitude minutes value cannot be higher than 60!');

            return false;
        }
        // seconds
        if (searchArr[7] > 60) {
            console.log('Longitude seconds value cannot be higher than 60!');

            return false;
        }
        // directions
        if (searchArr[8] !== 'E' && searchArr[8] !== 'W') {
            console.log('Longitude direction must be either \'E\' or \'W\'!');

            return false;
        }

        return true;
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

        // run some sanity checks for the input lat and lon values
        var y = parseFloat(searchArr[1]);
        var x = parseFloat(searchArr[2]);

        // latitude
        if (Math.abs(y) > 90) {
            console.log('Latitude value cannot be higher than 90!');

            return false;
        }
        // longitude
        if (Math.abs(x) > 180) {
            console.log('Longitude value cannot be higher than 180!');

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
        /**
         * Sexagesimal/decimal notation may be inserted in many different ways. Each possible notation is tested
         * and if it is valid, longitude and latitude decimal values are calculated and stored for further internal
         * processing. The original input string is also stored.
         */
        if (isCoordSexagesimal(string) === true) {
            return setCoordSexagesimal(searchSexagesimalNotation(string), string);
        }

        if (isCoordDecimal(string) === true) {
            return setCoordDecimal(searchDecimalNotation(string), string);
        }

        return false;
    };

    /**
     * Sets x and y coordinate value from an array returned from searchSexagesimalNotation().
     *
     * @param searchArr array returned from searchSexagesimalNotation()
     * @param string raw user input string
     * @returns {Merkator}
     */
    var setCoordSexagesimal = function (searchArr, string) {
        // convert sexagesimal to decimals
        var y = toDecimals(searchArr[1], searchArr[2], searchArr[3]);
        var x = toDecimals(searchArr[5], searchArr[6], searchArr[7]);
        // append '-' depending on direction
        if (searchArr[4] === 'S') {
            y = parseFloat('-' + y);
        }
        if (searchArr[8] === 'W') {
            x = parseFloat('-' + x);
        }
        _this.lon = x;
        _this.lat = y;
        _this.rawString = string;

        return true;
    };

    /**
     * Sets x and y coordinate value from an array returned from searchDecimalNotation().
     *
     * @param searchArr array returned from searchDecimalNotation()
     * @param string raw user input string
     * @returns {Merkator}
     */
    var setCoordDecimal = function (searchArr, string) {
        var y = parseFloat(searchArr[1]);
        var x = parseFloat(searchArr[2]);

        _this.lon = x;
        _this.lat = y;
        _this.rawString = string;

        return true;
    };

    /**
     * Search a string for a sexagesimal coordinate representation using a regex. Returns false if string doesnt
     * match the sexagesimal regex. Returns an array of x and y coordinates if a string in sexagesimal notation is
     * found.
     *
     * @param string
     * @returns {*}
     */
    var searchSexagesimalNotation = function (string) {
        var cleanString = cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
        /**
         * Regex works for:
         *
         * 1.) 45°34'21" N 120°47'23" E
         * 1.) 45°34'21.3245" N 120°47'23.23432" E
         * 2.) 45 34 21 N 120 47 23 E
         * 3.) any combination of the two formats above
         */
        var searchSexagesimal = /^#?(\d{1,2})[°]?#?(\d{1,2})[']?#?([0-9]{1,2}\.?[0-9]+)["]?#?([NS])#?(\d{1,3})[°]?#?(\d{1,2})[']?#?([0-9]{1,2}\.?[0-9]+)["]?#?([EW])#?$/;
        var coordSexa = searchSexagesimal.exec(cleanString);

        // regex doesn't match string, abort...
        if (!coordSexa) {
            return false;
        }

        return coordSexa;
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
        var cleanString = cleanseString(string); // get clean string, runs of whitespaces replaced by '#'
        /**
         * Regex works only for (lat lon):
         *
         * 1.) 34.45456 -101.21354
         */
        var searchDecimal = /^#?(-?[0-9]{1,2}\.?[0-9]+)#(-?[0-9]{1,3}\.?[0-9]+)#?$/;
        var searchArr = searchDecimal.exec(cleanString);

        // regex doesn't match string, abort...
        if (!searchArr) {
            return false;
        }

        return searchArr;
    };

    /**
     * Trim string and remove all whitespaces.
     *
     *
     * @param string
     * @returns {*}
     */
    var cleanseString = function (string) {
        if (!string) {
            return false;
        }

        return string.replace(/\s+/g, '#'); // trim string and replace runs of whitespaces with '#'
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
     * Read longitude and latitude coordinate pair.
     *
     * @param x WGS84 longitude decimal value
     * @param y WGS84 latitude decimal value
     */
    this.readCoord = function (x, y) {

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
        _this.lon = x;
        _this.lat = y;

        return true;
    };

    /**
     * Read input string. If string is a valid coordinate string, either as sexagesimal or decimal notation, a valid
     * Merkator object is returned. Otherwise the method will throw a console.log error and return false.
     *
     * @param string user input string. Should either be a WGS84 coordinate string in sexagesimal or decimal notation
     * @returns {*}
     */
    this.readString = function (string) {
        if (createCoordFromString(string)) {
            return _this;
        }
        console.log('Input string ' + string + ' is not a valid coordinate string!');

        return false;
    };

    /**
     * Return coordinate value in decimal notation.
     *
     * @returns {*}
     */
    this.toDecimal = function () {
        if (!_this.lon || !_this.lat) {
            console.log('Cannot build decimal string from empty coordinate value!');

            return false;
        }

        return _this.lat + ' ' + _this.lon;
    };

    /**
     * Get coordinate values as sexagesimal notation.
     *
     * @returns {string}
     */
    this.toSexagesimal = function () {
        // longitude value
        var xDms = convertDecToDms(_this.lon);
        (_this.lon > 0) ? xDms += 'E' : xDms += 'W';
        // latitude value
        var yDms = convertDecToDms(lat);
        (_this.lat > 0) ? yDms += 'N' : yDms += 'S';

        return yDms + ' ' + xDms;
    };

    /**
     * Return current WGS84 coordinate values as WKT string. Returns false if called before any coordinate value
     * has been read.
     *
     * @returns {*}
     */
    this.toWkt = function () {

        if (!_this.lon || !_this.lat) {
            console.log('Cannot build WKT string from empty coordinate value!');

            return false;
        }

        return 'POINT(' + _this.lon + ' ' + _this.lat + ')';
    };

    /**
     * Return coordinate longitude value in decimal.
     *
     * @returns {*}
     */
    this.getLon = function () {
        return _this.lon;
    };

    /**
     * Return coordinate latitude value in decimal.
     *
     * @returns {*}
     */
    this.getLat = function () {
        return _this.lat;
    };

    /**
     * Returns the raw user input string.
     *
     * @returns {string}
     */
    this.getInputString = function () {
        return _this.rawString;
    };

    /**
     * Check if string is a valid WGS84 sexagesimal coordinate string.
     *
     * @param string
     * @returns {boolean}
     */
    this.isValidSexagesimalString = function (string) {
        return isCoordSexagesimal(string);
    };

    /**
     * Check if a string is valid decimal WGS84 coordinate string.
     *
     * @param string
     * @returns {boolean}
     */
    this.isValidDecimalString = function (string) {
        return isCoordDecimal(string);
    };
}

