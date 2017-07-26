/**
 * This class manages playing board for the game.
 * @class Board
 * @constructor
 * @namespace SNAKE
 * @param {Object} config The configuration object for the class. Set fullScreen equal to true if you want the game to take up the full screen, otherwise, set the top, left, width and height parameters.
 */

SNAKE.Board = SNAKE.Board || (function () {

    // -------------------------------------------------------------------------
    // Private static variables and methods
    // -------------------------------------------------------------------------

    var instanceNumber = 0;

    // this function is adapted from the example at http://greengeckodesign.com/blog/2007/07/get-highest-z-index-in-javascript.html
    function getNextHighestZIndex(myObj) {
        var highestIndex = 0,
            currentIndex = 0,
            ii;
        for (ii in myObj) {
            if (myObj[ii].elm.currentStyle) {
                currentIndex = parseFloat(myObj[ii].elm.style["z-index"], 10);
            } else if (window.getComputedStyle) {
                currentIndex = parseFloat(document.defaultView.getComputedStyle(myObj[ii].elm, null).getPropertyValue("z-index"), 10);
            }
            if (!isNaN(currentIndex) && currentIndex > highestIndex) {
                highestIndex = currentIndex;
            }
        }
        return (highestIndex + 1);
    }

    // -------------------------------------------------------------------------
    // Contructor + public and private definitions
    // -------------------------------------------------------------------------

    return function (inputConfig) {

        // --- private variables ---
        var me = this,
            myId = instanceNumber++,
            config = inputConfig || {},
            MAX_BOARD_COLS = 250,
            MAX_BOARD_ROWS = 250,
            blockWidth = 20,
            blockHeight = 20,
            GRID_FOOD_VALUE = -1, // the value of a spot on the board that represents snake food, MUST BE NEGATIVE
            myFood,
            mySnake,
            boardState = BOARD_STATES.STARTING,
            myKeyListener,
            myDeviceOrientationListener,
            myTouchListener,
            isPaused = false,//note: both the board and the snake can be paused
            selectedSensor = SENSORS.KEYBOARD,
            // Board components
            elmContainer, elmPlayingField, elmAboutPanel, elmLengthPanel, elmWelcome, elmTryAgain, elmPauseScreen;

        // --- public variables ---
        me.grid = [];

        // ---------------------------------------------------------------------
        // private functions
        // ---------------------------------------------------------------------

        function createBoardElements() {
            elmPlayingField = document.createElement("div");
            elmPlayingField.setAttribute("id", "playingField");
            elmPlayingField.className = "snake-playing-field";

            UTILS.addEventListener(elmPlayingField, "click", function () {
                elmContainer.focus();
            }, false);

            elmPauseScreen = document.createElement("div");
            elmPauseScreen.className = "snake-pause-screen";
            elmPauseScreen.innerHTML = "<div style='padding:10px;'>[Paused]<p/>Press [space] to unpause.</div>";

            elmAboutPanel = document.createElement("div");
            elmAboutPanel.className = "snake-panel-component";

            elmLengthPanel = document.createElement("div");
            elmLengthPanel.className = "snake-panel-component";
            elmLengthPanel.innerHTML = "Length: 1";

            elmWelcome = createWelcomeElement();
            elmTryAgain = createTryAgainElement();

            UTILS.addEventListener(elmContainer, "keyup", function (evt) {
                if (!evt) var evt = window.event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                return false;
            }, false);

            elmContainer.className = "snake-game-container";

            elmPauseScreen.style.zIndex = 10000;
            elmContainer.appendChild(elmPauseScreen);
            elmContainer.appendChild(elmPlayingField);
            elmContainer.appendChild(elmAboutPanel);
            elmContainer.appendChild(elmLengthPanel);
            elmContainer.appendChild(elmWelcome);
            elmContainer.appendChild(elmTryAgain);

            mySnake = new SNAKE.Snake({playingBoard: me, startRow: 2, startCol: 2});
            myFood = new SNAKE.Food({playingBoard: me});

            elmWelcome.style.zIndex = 1000;
        }

        function maxBoardWidth() {
            return MAX_BOARD_COLS * me.getBlockWidth();
        }

        function maxBoardHeight() {
            return MAX_BOARD_ROWS * me.getBlockHeight();
        }

        function createWelcomeElement() {
            var tmpElm = document.createElement("div");
            tmpElm.id = "sbWelcome" + myId;
            tmpElm.className = "snake-welcome-dialog";

            var welcomeTxt = document.createElement("div");

            welcomeTxt.innerHTML = "JavaScript Snake<p></p>Use the arrow keys, the accelerometer (laying your device flat and tilting it) or the edges of your touch screen to play the game. <p></p>" +
                "<select id='chosenSnakeSpeed'><option id='Easy' value='100' selected>Easy</option> <option id='Medium' value='75'>Medium</option> <option id='Difficult' value='50'>Difficult</option></select> <br /><br />";

            var highScoreTxt = document.createElement("div");
            highScoreTxt.innerHTML = "<br /><button id='high-score'>Get your current high score for this game.</button>";

            var sensorTxt = document.createElement("div");
            sensorTxt.innerHTML = "<select id='chosenSensor'><option value='" + SENSORS.KEYBOARD + "'>Keyboard</option><option value='" + SENSORS.ACCELEROMETER + "'>Accelerometer</option><option value='" + SENSORS.TOUCH_SCREEN + "'>Touch Screen</option></select><br /><br />"


            var welcomeStart = document.createElement("button");
            welcomeStart.appendChild(document.createTextNode("Play Game"));
            var loadGame = function () {
                UTILS.removeEventListener(window, "keyup", kbShortcut, false);

                tmpElm.style.display = "none";

                var sensorSelect = document.getElementById("chosenSensor");
                me.setSensorListeners(sensorSelect.options[sensorSelect.selectedIndex].value);

                me.setBoardState(BOARD_STATES.STARTING);
                me.getBoardContainer().focus();
            };

            var kbShortcut = function (evt) {
                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;
                //32 = Space, 13 = Enter
                if (keyNum === 32 || keyNum === 13) {
                    loadGame();
                }
            };
            UTILS.addEventListener(window, "keyup", kbShortcut, false);
            UTILS.addEventListener(welcomeStart, "click", loadGame, false);

            tmpElm.appendChild(welcomeTxt);
            tmpElm.appendChild(sensorTxt);
            tmpElm.appendChild(welcomeStart);
            tmpElm.appendChild(highScoreTxt);
            return tmpElm;
        }

        function createTryAgainElement() {
            var tmpElm = document.createElement("div");
            tmpElm.id = "sbTryAgain" + myId;
            tmpElm.className = "snake-try-again-dialog";
            snakeSpeed = 100;

            var tryAgainTxt = document.createElement("div");
            tryAgainTxt.innerHTML = "JavaScript Snake<p></p>You died :(.<p></p>";

            var modeSpeedTxt = document.createElement("div");
            modeSpeedTxt.innerHTML = "<select onchange='getModeTryAgain()' id='chosenSnakeSpeedTryAgain'><option id='EasyTry' value='100'>Easy</option> <option id='MediumTry' value='75'>Medium</option> <option id='DifficultTry' value='50'>Difficult</option></select> <br /><br />";;

            var sensorTxt = document.createElement("div");
            sensorTxt.innerHTML = "<select id='chosenSensorRetry'><option value='" + SENSORS.KEYBOARD + "'>Keyboard</option><option value='" + SENSORS.ACCELEROMETER + "'>Accelerometer</option><option value='" + SENSORS.TOUCH_SCREEN + "'>Touch Screen</option></select><br /><br />"

            var tryAgainStart = document.createElement("button");
            tryAgainStart.appendChild(document.createTextNode("Play Again?"));

            var highScoreTxt = document.createElement("div");
            highScoreTxt.innerHTML = "<br /><button onclick='getHighScoreTryAgain()' id='high-score-try'>Get your current high score for this game.</button>";

            var reloadGame = function () {
                tmpElm.style.display = "none";

                var sensorSelect = document.getElementById("chosenSensorRetry");
                me.setSensorListeners(sensorSelect.options[sensorSelect.selectedIndex].value);

                me.resetBoard();
                me.setBoardState(BOARD_STATES.STARTING);
                me.getBoardContainer().focus();
            };

            var kbTryAgainShortcut = function (evt) {
                if (me.getBoardState() !== BOARD_STATES.INITIAL || tmpElm.style.display !== "block") {
                    return;
                }
                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;
                //32 = Space, 13 = Enter
                if (keyNum === 32 || keyNum === 13) {
                    reloadGame();
                }
            };
            UTILS.addEventListener(window, "keyup", kbTryAgainShortcut, true);

            UTILS.addEventListener(tryAgainStart, "click", reloadGame, false);
            tmpElm.appendChild(tryAgainTxt);
            tmpElm.appendChild(modeSpeedTxt);
            tmpElm.appendChild(sensorTxt);
            tmpElm.appendChild(tryAgainStart);
            tmpElm.appendChild(highScoreTxt);
            return tmpElm;
        }


        // ---------------------------------------------------------------------
        // public functions
        // ---------------------------------------------------------------------


        me.setSensorListeners = function(sensor){

            if (sensor == SENSORS.KEYBOARD){
                selectedSensor = SENSORS.KEYBOARD;
            }
            else if (sensor == SENSORS.ACCELEROMETER){
                selectedSensor = SENSORS.ACCELEROMETER;
            }
            else if (sensor == SENSORS.TOUCH_SCREEN){
                selectedSensor = SENSORS.TOUCH_SCREEN;
            }
        };

        me.setPaused = function (val) {
            isPaused = val;
            mySnake.setPaused(val);
            if (isPaused) {
                elmPauseScreen.style.display = "block";
            } else {
                elmPauseScreen.style.display = "none";
            }
        };
        me.getPaused = function () {
            return isPaused;
        };

        getModeTryAgain = function() {

            var comboBoxSpeed = document.getElementById("chosenSnakeSpeedTryAgain");
            var speed = comboBoxSpeed.options[comboBoxSpeed.selectedIndex].value;
            snakeSpeed = speed;
        };

        setTryAgainMode = function(snakeSpeed) {

            if(snakeSpeed == 100)
                document.getElementById("EasyTry").selected = true;
            else if(snakeSpeed == 75)
                document.getElementById("MediumTry").selected = true;
            else if(snakeSpeed == 50)
                document.getElementById("DifficultTry").selected = true;
        }

        getHighScoreTryAgain = function () {
            if (localStorage.jsSnakeHighScore == undefined)
                alert('You have not played this game yet!');
            else
                alert('Your current high score is ' + localStorage.jsSnakeHighScore + '.');
        }

        /**
         * Resets the playing board for a new game.
         * @method resetBoard
         */
        me.resetBoard = function () {
            UTILS.removeEventListener(elmContainer, "keydown", myKeyListener, false);
            UTILS.removeEventListener(window, "devicemotion", myDeviceOrientationListener, false);
            UTILS.removeEventListener(elmContainer, "touchstart", myTouchListener, false);

            mySnake.reset();
            elmLengthPanel.innerHTML = "Length: 1";
            me.setupPlayingField();
            mySnake.rebirth();
        };
        /**
         * Gets the current state of the playing board. Use BOARD_STATES.INITIAL, BOARD_STATES.STARTING and BOARD_STATES.STARTED.
         * @return {Number} The state of the board.
         */
        me.getBoardState = function () {
            return boardState;
        };
        /**
         * Sets the current state of the playing board. Use BOARD_STATES.INITIAL, BOARD_STATES.STARTING and BOARD_STATES.STARTED.
         * @method setBoardState
         * @param {Number} state The state of the board.
         */
        me.setBoardState = function (state) {
            boardState = state;
        };
        /**
         * @method getGridFoodValue
         * @return {Number} A number that represents food on a number representation of the playing board.
         */
        me.getGridFoodValue = function () {
            return GRID_FOOD_VALUE;
        };
        /**
         * @method getPlayingFieldElement
         * @return {DOM Element} The div representing the playing field (this is where the snake can move).
         */
        me.getPlayingFieldElement = function () {
            return elmPlayingField;
        };
        /**
         * @method setBoardContainer
         * @param {DOM Element or String} myContainer Sets the container element for the game.
         */
        me.setBoardContainer = function (myContainer) {
            if (typeof myContainer === "string") {
                myContainer = document.getElementById(myContainer);
            }
            if (myContainer === elmContainer) {
                return;
            }
            elmContainer = myContainer;
            elmPlayingField = null;

            me.setupPlayingField();
        };
        /**
         * @method getBoardContainer
         * @return {DOM Element}
         */
        me.getBoardContainer = function () {
            return elmContainer;
        };
        /**
         * @method getBlockWidth
         * @return {Number}
         */
        me.getBlockWidth = function () {
            return blockWidth;
        };
        /**
         * @method getBlockHeight
         * @return {Number}
         */
        me.getBlockHeight = function () {
            return blockHeight;
        };
        /**
         * Sets up the playing field.
         * @method setupPlayingField
         */
        me.setupPlayingField = function () {

            if (!elmPlayingField) {
                createBoardElements();
            } // create playing field

            // calculate width of our game container
            var cWidth, cHeight;
            if (config.fullScreen === true) {
                cTop = 0;
                cLeft = 0;
                cWidth = UTILS.getClientWidth() - 5;
                cHeight = UTILS.getClientHeight() - 5;
                document.body.style.backgroundColor = "#FC5454";
            } else {
                cTop = config.top;
                cLeft = config.left;
                cWidth = config.width;
                cHeight = config.height;
            }

            // define the dimensions of the board and playing field
            var wEdgeSpace = me.getBlockWidth() * 2 + (cWidth % me.getBlockWidth());
            var fWidth = Math.min(maxBoardWidth() - wEdgeSpace, cWidth - wEdgeSpace);
            var hEdgeSpace = me.getBlockHeight() * 3 + (cHeight % me.getBlockHeight());
            var fHeight = Math.min(maxBoardHeight() - hEdgeSpace, cHeight - hEdgeSpace);

            elmContainer.style.left = cLeft + "px";
            elmContainer.style.top = cTop + "px";
            elmContainer.style.width = cWidth + "px";
            elmContainer.style.height = cHeight + "px";
            elmPlayingField.style.left = me.getBlockWidth() + "px";
            elmPlayingField.style.top = me.getBlockHeight() + "px";
            elmPlayingField.style.width = fWidth + "px";
            elmPlayingField.style.height = fHeight + "px";

            // the math for this will need to change depending on font size, padding, etc
            // assuming height of 14 (font size) + 8 (padding)
            var bottomPanelHeight = hEdgeSpace - me.getBlockHeight();
            var pLabelTop = me.getBlockHeight() + fHeight + Math.round((bottomPanelHeight - 30) / 2) + "px";

            elmAboutPanel.style.top = pLabelTop;
            elmAboutPanel.style.width = "450px";
            elmAboutPanel.style.left = Math.round(cWidth / 2) - Math.round(450 / 2) + "px";

            elmLengthPanel.style.top = pLabelTop;
            elmLengthPanel.style.left = cWidth - 120 + "px";

            // if width is too narrow, hide the about panel
            if (cWidth < 700) {
                elmAboutPanel.style.display = "none";
            } else {
                elmAboutPanel.style.display = "block";
            }

            me.grid = [];
            var numBoardCols = fWidth / me.getBlockWidth() + 2;
            var numBoardRows = fHeight / me.getBlockHeight() + 2;

            for (var row = 0; row < numBoardRows; row++) {
                me.grid[row] = [];
                for (var col = 0; col < numBoardCols; col++) {
                    if (col === 0 || row === 0 || col === (numBoardCols - 1) || row === (numBoardRows - 1)) {
                        me.grid[row][col] = 1; // an edge
                    } else {
                        me.grid[row][col] = 0; // empty space
                    }
                }
            }

            myFood.randomlyPlaceFood();

            function getHighScore() {
                document.getElementById('high-score').addEventListener('click', function () {
                    if (localStorage.jsSnakeHighScore == undefined) alert('You have not played this game yet!');
                    else
                        alert('Your current high score is ' + localStorage.jsSnakeHighScore + '.');
                });
            }
            getHighScore();

            // setup event listeners
            function getMode(mode) {
                if(typeof snakeSpeed == 'undefined') {
                    var comboBoxSpeed = document.getElementById("chosenSnakeSpeed");
                    var speed = comboBoxSpeed.options[comboBoxSpeed.selectedIndex].value;
                    snakeSpeed = speed;
                    setTryAgainMode(snakeSpeed);
                }
                document.getElementById(mode).addEventListener('click', function () {
                    var comboBoxSpeed = document.getElementById("chosenSnakeSpeed");
                    var speed = comboBoxSpeed.options[comboBoxSpeed.selectedIndex].value;
                    snakeSpeed = speed;
                    setTryAgainMode(snakeSpeed);
                });
            }

            getMode('chosenSnakeSpeed');

            myKeyListener = function (evt) {
                if (selectedSensor !== SENSORS.KEYBOARD)
                    return;

                if (!evt) var evt = window.event;
                var keyNum = (evt.which) ? evt.which : evt.keyCode;

                if (me.getBoardState() === BOARD_STATES.STARTING) {
                    if (!(keyNum >= 37 && keyNum <= 40) && !(keyNum === 87 || keyNum === 65 || keyNum === 83 || keyNum === 68)) {
                        return;
                    } // if not an arrow key, leave

                    // This removes the listener added at the #listenerX line
                    UTILS.removeEventListener(elmContainer, "keydown", myKeyListener, false);

                    myKeyListener = function (evt) {
                        if (!evt) var evt = window.event;
                        var keyNum = (evt.which) ? evt.which : evt.keyCode;

                        //32 = Enter
                        if (keyNum === 32 && me.getBoardState() !== BOARD_STATES.INITIAL) {
                            me.setPaused(!me.getPaused());
                        }

                        mySnake.handleArrowKeys(keyNum);

                        evt.cancelBubble = true;
                        if (evt.stopPropagation) {
                            evt.stopPropagation();
                        }
                        if (evt.preventDefault) {
                            evt.preventDefault();
                        }
                        return false;
                    };
                    UTILS.addEventListener(elmContainer, "keydown", myKeyListener, false);

                    mySnake.rebirth();
                    mySnake.handleArrowKeys(keyNum);
                    me.setBoardState(BOARD_STATES.STARTED); // start the game!
                    mySnake.go();
                }

                evt.cancelBubble = true;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                return false;
            };

            myDeviceOrientationListener = function(evt) {
                if (selectedSensor !== SENSORS.ACCELEROMETER)
                    return;

                if (me.getBoardState() === BOARD_STATES.STARTING) {
                    var orientationX = evt.accelerationIncludingGravity.x;
                    var orientationY = evt.accelerationIncludingGravity.y;
                    if (Math.abs(orientationX) > 3 || Math.abs(orientationY) > 3){
                        me.setBoardState(BOARD_STATES.STARTED); // start the game!
                        mySnake.go();
                        mySnake.handleDeviceOrientation(evt);
                    }

                }else if (me.getBoardState() === BOARD_STATES.STARTED){
                    mySnake.handleDeviceOrientation(evt);
                }

                evt.cancelBubble = true;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                return false;
            };

            myTouchListener = function(evt) {
                if (selectedSensor !== SENSORS.TOUCH_SCREEN)
                    return;

                if(evt.touches.length == 1){
                    if (me.getBoardState() === BOARD_STATES.STARTING) {
                        me.setBoardState(BOARD_STATES.STARTED); // start the game!
                        mySnake.go();
                        mySnake.handleDeviceTouch(evt);
                    }else if(me.getBoardState() === BOARD_STATES.STARTED) {
                        mySnake.handleDeviceTouch(evt);
                    }
                }

                return false;
            };

            UTILS.addEventListener(elmContainer, "keydown", myKeyListener, false);
            UTILS.addEventListener(window, "devicemotion", myDeviceOrientationListener, false);
            UTILS.addEventListener(elmContainer, "touchstart", myTouchListener, false)

        };


        /**
         * This method is called when the snake has eaten some food.
         * @method foodEaten
         */
        me.foodEaten = function () {
            elmLengthPanel.innerHTML = "Length: " + mySnake.snakeLength;
            myFood.randomlyPlaceFood();
        };

        /**
         * This method is called when the snake dies.
         * @method handleDeath
         */
        me.handleDeath = function () {
            var index = Math.max(getNextHighestZIndex(mySnake.snakeBody), getNextHighestZIndex({tmp: {elm: myFood.getFoodElement()}}));
            elmContainer.removeChild(elmTryAgain);
            elmContainer.appendChild(elmTryAgain);
            elmTryAgain.style.zIndex = index;
            elmTryAgain.style.display = "block";
            me.setBoardState(BOARD_STATES.INITIAL);
        };

        // ---------------------------------------------------------------------
        // Initialize
        // ---------------------------------------------------------------------

        config.fullScreen = (typeof config.fullScreen === "undefined") ? false : config.fullScreen;
        config.top = (typeof config.top === "undefined") ? 0 : config.top;
        config.left = (typeof config.left === "undefined") ? 0 : config.left;
        config.width = (typeof config.width === "undefined") ? 400 : config.width;
        config.height = (typeof config.height === "undefined") ? 400 : config.height;

        if (config.fullScreen) {
            UTILS.addEventListener(window, "resize", function () {
                me.setupPlayingField();
            }, false);
        }

        me.setBoardState(BOARD_STATES.INITIAL);

        if (config.boardContainer) {
            me.setBoardContainer(config.boardContainer);
        }

    }; // end return function
})();