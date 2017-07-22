var BOARD_STATE_GAME_INITIAL = 0;
var BOARD_STATE_GAME_STARTING = 1;
var BOARD_STATE_GAME_STARTED = 2;

var SNAKE_DIRECTION_UP = 0;
var SNAKE_DIRECTION_RIGHT = 1;
var SNAKE_DIRECTION_DOWN = 2;
var SNAKE_DIRECTION_LEFT = 3;

var SENSOR_KEYBOARD = 0;
var SENSOR_ACCELEROMETER = 1;
var SENSOR_TOUCH_SCREEN = 2;


/**
 * @method addEventListener
 * @param {Object} obj The object to add an event listener to.
 * @param {String} event The event to listen for.
 * @param {Function} funct The function to execute when the event is triggered.
 * @param {Boolean} evtCapturing True to do event capturing, false to do event bubbling.
 */
SNAKE.addEventListener = (function () {
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

SNAKE.removeEventListener = (function () {
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


function getClientWidth() {
    var myWidth = 0;
    if (typeof window.innerWidth === "number") {
        myWidth = window.innerWidth;//Non-IE
    } else if (document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight )) {
        myWidth = document.documentElement.clientWidth;//IE 6+ in 'standards compliant mode'
    } else if (document.body && ( document.body.clientWidth || document.body.clientHeight )) {
        myWidth = document.body.clientWidth;//IE 4 compatible
    }
    return myWidth;
}

/*
 This function returns the height of the available screen real estate that we have
 */
function getClientHeight() {
    var myHeight = 0;
    if (typeof window.innerHeight === "number") {
        myHeight = window.innerHeight;//Non-IE
    } else if (document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight )) {
        myHeight = document.documentElement.clientHeight;//IE 6+ in 'standards compliant mode'
    } else if (document.body && ( document.body.clientWidth || document.body.clientHeight )) {
        myHeight = document.body.clientHeight;//IE 4 compatible
    }
    return myHeight;
}