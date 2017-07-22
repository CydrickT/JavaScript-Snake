
var BOARD_STATES = BOARD_STATES || {};
BOARD_STATES.INITIAL = 0;
BOARD_STATES.STARTING = 1;
BOARD_STATES.STARTED = 2;

var SNAKE_DIRECTIONS = SNAKE_DIRECTIONS || {};
SNAKE_DIRECTIONS.UP = 0;
SNAKE_DIRECTIONS.RIGHT = 1;
SNAKE_DIRECTIONS.DOWN = 2;
SNAKE_DIRECTIONS.LEFT = 3;

var SENSORS = SENSORS || {};
SENSORS.KEYBOARD = 0;
SENSORS.ACCELEROMETER = 1;
SENSORS.TOUCH_SCREEN = 2;

var UTILS = UTILS || {};

UTILS.getClientWidth = function () {
    var myWidth = 0;
    if (typeof window.innerWidth === "number") {
        myWidth = window.innerWidth;//Non-IE
    } else if (document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight )) {
        myWidth = document.documentElement.clientWidth;//IE 6+ in 'standards compliant mode'
    } else if (document.body && ( document.body.clientWidth || document.body.clientHeight )) {
        myWidth = document.body.clientWidth;//IE 4 compatible
    }
    return myWidth;
};

UTILS.getClientHeight = function () {
    var myHeight = 0;
    if (typeof window.innerHeight === "number") {
        myHeight = window.innerHeight;//Non-IE
    } else if (document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight )) {
        myHeight = document.documentElement.clientHeight;//IE 6+ in 'standards compliant mode'
    } else if (document.body && ( document.body.clientWidth || document.body.clientHeight )) {
        myHeight = document.body.clientHeight;//IE 4 compatible
    }
    return myHeight;
};

/**
 * @method addEventListener
 * @param {Object} obj The object to add an event listener to.
 * @param {String} event The event to listen for.
 * @param {Function} funct The function to execute when the event is triggered.
 * @param {Boolean} evtCapturing True to do event capturing, false to do event bubbling.
 */
UTILS.addEventListener = (function () {
    if (window.addEventListener) {
        return function (obj, event, funct, evtCapturing) {
            obj.addEventListener(event, funct, evtCapturing);
        };
    } else if (window.attachEvent) {
        return function (obj, event, funct) {
            obj.attachEvent("on" + event, funct);
        };
    }
})();

/**
 * @method removeEventListener
 * @param {Object} obj The object to remove an event listener from.
 * @param {String} event The event that was listened for.
 * @param {Function} funct The function that was executed when the event is triggered.
 * @param {Boolean} evtCapturing True if event capturing was done, false otherwise.
 */

UTILS.removeEventListener = (function () {
    if (window.removeEventListener) {
        return function (obj, event, funct, evtCapturing) {
            obj.removeEventListener(event, funct, evtCapturing);
        };
    } else if (window.detachEvent) {
        return function (obj, event, funct) {
            obj.detachEvent("on" + event, funct);
        };
    }
})();


/**
 * @module Snake
 * @class SNAKE
 */

var SNAKE = SNAKE || {};
