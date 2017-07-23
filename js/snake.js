/**
 * This class manages the snake which will reside inside of a SNAKE.Board object.
 * @class Snake
 * @constructor
 * @namespace SNAKE
 * @param {Object} config The configuration object for the class. Contains playingBoard (the SNAKE.Board that this snake resides in), startRow and startCol.
 */
SNAKE.Snake = SNAKE.Snake || (function () {

    // -------------------------------------------------------------------------
    // Private static variables and methods
    // -------------------------------------------------------------------------

    var instanceNumber = 0;
    var blockPool = [];

    var SnakeBlock = function () {
        this.elm = null;
        this.elmStyle = null;
        this.row = -1;
        this.col = -1;
        this.xPos = -1000;
        this.yPos = -1000;
        this.next = null;
        this.prev = null;
    };

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

    /*
     config options:
     playingBoard - the SnakeBoard that this snake belongs too.
     startRow - The row the snake should start on.
     startCol - The column the snake should start on.
     */
    return function (config) {

        if (!config || !config.playingBoard) {
            return;
        }

        // ----- private variables -----

        var me = this,
            playingBoard = config.playingBoard,
            myId = instanceNumber++,
            growthIncr = 5,
            moveQueue = [], // a queue that holds the next moves of the snake
            currentDirection = SNAKE_DIRECTIONS.RIGHT,
            columnShift = [0, 1, 0, -1],
            rowShift = [-1, 0, 1, 0],
            xPosShift = [],
            yPosShift = [],
            isDead = false,
            isPaused = false;

        // ----- public variables -----
        me.snakeBody = {};
        me.snakeBody["b0"] = new SnakeBlock(); // create snake head
        me.snakeBody["b0"].row = config.startRow || 1;
        me.snakeBody["b0"].col = config.startCol || 1;
        me.snakeBody["b0"].xPos = me.snakeBody["b0"].row * playingBoard.getBlockWidth();
        me.snakeBody["b0"].yPos = me.snakeBody["b0"].col * playingBoard.getBlockHeight();
        me.snakeBody["b0"].elm = createSnakeElement();
        me.snakeBody["b0"].elmStyle = me.snakeBody["b0"].elm.style;
        playingBoard.getBoardContainer().appendChild(me.snakeBody["b0"].elm);
        me.snakeBody["b0"].elm.style.left = me.snakeBody["b0"].xPos + "px";
        me.snakeBody["b0"].elm.style.top = me.snakeBody["b0"].yPos + "px";
        me.snakeBody["b0"].next = me.snakeBody["b0"];
        me.snakeBody["b0"].prev = me.snakeBody["b0"];

        me.snakeLength = 1;
        me.snakeHead = me.snakeBody["b0"];
        me.snakeTail = me.snakeBody["b0"];
        me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/, '');
        me.snakeHead.elm.className += " snake-snakebody-alive";

        // ----- private methods -----

        function createSnakeElement() {
            var tempNode = document.createElement("div");
            tempNode.className = "snake-snakebody-block";
            tempNode.style.left = "-1000px";
            tempNode.style.top = "-1000px";
            tempNode.style.width = playingBoard.getBlockWidth() + "px";
            tempNode.style.height = playingBoard.getBlockHeight() + "px";
            return tempNode;
        }

        function createBlocks(num) {
            var tempBlock;
            var tempNode = createSnakeElement();

            for (var ii = 1; ii < num; ii++) {
                tempBlock = new SnakeBlock();
                tempBlock.elm = tempNode.cloneNode(true);
                tempBlock.elmStyle = tempBlock.elm.style;
                playingBoard.getBoardContainer().appendChild(tempBlock.elm);
                blockPool[blockPool.length] = tempBlock;
            }

            tempBlock = new SnakeBlock();
            tempBlock.elm = tempNode;
            playingBoard.getBoardContainer().appendChild(tempBlock.elm);
            blockPool[blockPool.length] = tempBlock;
        }

        // ----- public methods -----

        me.setPaused = function (val) {
            isPaused = val;
        };
        me.getPaused = function () {
            return isPaused;
        };

        /**
         * This method is called when a user presses a key. It logs arrow key presses in "moveQueue", which is used when the snake needs to make its next move.
         * @method handleArrowKeys
         * @param {Number} keyNum A number representing the key that was pressed.
         */
        /*
         Handles what happens when an arrow key is pressed.
         */
        me.handleArrowKeys = function (keyNum) {
            if (isDead || isPaused) {
                return;
            }

            var snakeLength = me.snakeLength;
            var lastMove = moveQueue[0] || currentDirection;

            switch (keyNum) {

                case 37:
                case 65:
                    if (lastMove !== SNAKE_DIRECTIONS.RIGHT || snakeLength === 1) {
                        moveQueue.unshift(SNAKE_DIRECTIONS.LEFT);
                    }
                    break;
                case 38:
                case 87:
                    if (lastMove !== SNAKE_DIRECTIONS.DOWN || snakeLength === 1) {
                        moveQueue.unshift(SNAKE_DIRECTIONS.UP);
                    }
                    break;
                case 39:
                case 68:
                    if (lastMove !== SNAKE_DIRECTIONS.LEFT || snakeLength === 1) {
                        moveQueue.unshift(SNAKE_DIRECTIONS.RIGHT);
                    }
                    break;
                case 40:
                case 83:
                    if (lastMove !== SNAKE_DIRECTIONS.UP || snakeLength === 1) {
                        moveQueue.unshift(SNAKE_DIRECTIONS.DOWN);
                    }
                    break;
            }
        };

        /**
         * Changes the direction of the snake depending on the direction of the device.
         * @param directionEvent
         */
        me.handleDeviceOrientation = function(directionEvent){
            if (isDead || isPaused) {
                return;
            }
            var snakeLength = me.snakeLength;

            var lastMove = moveQueue[0] || currentDirection;

            var orientationX = directionEvent.accelerationIncludingGravity.x;
            var orientationY = directionEvent.accelerationIncludingGravity.y;

            var absOrientationX = Math.abs(orientationX);
            var absOrientationY = Math.abs(orientationY);

            if (absOrientationX >= 2 || absOrientationY >= 2){
                if (absOrientationX > absOrientationY){
                    // Up/Down movement
                    if (lastMove === SNAKE_DIRECTIONS.UP || lastMove === SNAKE_DIRECTIONS.DOWN) {
                        if (orientationX > 0) {
                            moveQueue.unshift(SNAKE_DIRECTIONS.LEFT);
                        } else {
                            moveQueue.unshift(SNAKE_DIRECTIONS.RIGHT);
                        }
                    }
                }
                else {
                    // Left/Right movement
                    if (lastMove === SNAKE_DIRECTIONS.LEFT || lastMove === SNAKE_DIRECTIONS.RIGHT) {
                        if (orientationY > 0) {
                            moveQueue.unshift(SNAKE_DIRECTIONS.DOWN);
                        }
                        else{
                            moveQueue.unshift(SNAKE_DIRECTIONS.UP);
                        }
                    }
                }
            }
            directionEvent.preventDefault();
        };

        /**
         * This moves the snakes depending on which region separated by both diagonals of the rectangle (the screen) the touches is.
         * This is the logic behind the algorithm:
         * 1 - Checks in which quadrant of the screen the touches is located (Top-Left, Top-Right, Bottom-Left or Bottom-Right)
         * 2- Gets the Y' position on the diagonal using the formula a*x + b, where a is the slope, x is the x position of the touch,
         *     and B is the origin of the slope (either 0 or the height of the screen)
         *     Here are the diagonals possible:
         *   - If the quadrant is Top-Left, the diagonal goes from top-left to the center of the screen. The slope is positive and starts at 0.
         *   - If the quadrant is Top-Right, the diagonal goes from the center to the top-right of the screen. The slope is negative and starts at the height of the screen.
         *   - If the quadrant is Bottom-Left, the diagonal goes from the bottom-left of the screen to the center. The slope is negative and starts at the height of the screen.
         *   - If the quadrant is Bottom-Right, the diagonal goes from the center to the bottom-right of the screen. The slope is positive and starts at 0.
         * 3- Determines the direction of the snake depending if the y position of the touch is above or below Y' (Y' lies on the diagonal)
         * @param touchEvent
         */
        me.handleDeviceTouch = function(touchEvent) {

            if (isDead || isPaused) {
                return;
            }
            else if (touchEvent.touches.length !== 1) {
                return;
            }
            var snakeLength = me.snakeLength;

            var lastMove = moveQueue[0] || currentDirection;

            var touchPositionX = touchEvent.touches[0].clientX;
            var touchPositionY = touchEvent.touches[0].clientY;
            var screenWidth = UTILS.getClientWidth();
            var screenHeight = UTILS.getClientHeight();
            var slopeOfDiagonals = screenHeight/screenWidth;

            var lastMoveHorizontal = (lastMove === SNAKE_DIRECTIONS.LEFT || lastMove === SNAKE_DIRECTIONS.RIGHT || snakeLength === 1);
            var lastMoveVertical = (lastMove === SNAKE_DIRECTIONS.UP || lastMove === SNAKE_DIRECTIONS.DOWN || snakeLength === 1);

            if (touchPositionX < (screenWidth / 2) && touchPositionY < (screenHeight / 2)){
                //Top-Left corner
                //y = a*x + b
                var posOfDiagonal = slopeOfDiagonals * touchPositionX + 0;
                if (touchPositionY < posOfDiagonal && lastMoveHorizontal){
                    moveQueue.unshift(SNAKE_DIRECTIONS.UP);
                }else if (touchPositionY >= posOfDiagonal && lastMoveVertical){
                    moveQueue.unshift(SNAKE_DIRECTIONS.LEFT);
                }
            }
            else if (touchPositionX >= (screenWidth / 2) && touchPositionY < (screenHeight / 2)){
                //Top-Right corner
                //y = a*x + b
                var posOfDiagonal = -slopeOfDiagonals * touchPositionX + screenHeight;
                if(touchPositionY < posOfDiagonal && lastMoveHorizontal){
                    moveQueue.unshift(SNAKE_DIRECTIONS.UP);
                } else if (touchPositionY >= posOfDiagonal && lastMoveVertical){
                    moveQueue.unshift(SNAKE_DIRECTIONS.RIGHT);
                }
            }
            else if (touchPositionX < (screenWidth / 2) && touchPositionY >= (screenHeight / 2)){
                //Bottom-Left corner
                //y = a*x + b
                var posOfDiagonal = -slopeOfDiagonals * touchPositionX + screenHeight;
                if(touchPositionY < posOfDiagonal && lastMoveVertical){
                    moveQueue.unshift(SNAKE_DIRECTIONS.LEFT);
                } else if (touchPositionY >= posOfDiagonal && lastMoveHorizontal){
                    moveQueue.unshift(SNAKE_DIRECTIONS.DOWN);
                }
            }
            else if (touchPositionX >= (screenWidth / 2) && touchPositionY >= (screenHeight / 2)){
                //Bottom-Right corner
                //y = a*x + b
                var posOfDiagonal = slopeOfDiagonals * touchPositionX + 0;
                if (touchPositionY < posOfDiagonal && lastMoveVertical){
                    moveQueue.unshift(SNAKE_DIRECTIONS.RIGHT);
                } else if (touchPositionY >= posOfDiagonal && lastMoveHorizontal){
                    moveQueue.unshift(SNAKE_DIRECTIONS.DOWN);
                }
            }
        };


        /**
         * This method is executed for each move of the snake. It determines where the snake will go and what will happen to it. This method needs to run quickly.
         * @method go
         */
        me.go = function () {

            var oldHead = me.snakeHead,
                newHead = me.snakeTail,
                myDirection = currentDirection,
                grid = playingBoard.grid; // cache grid for quicker lookup

            if (isPaused === true) {
                setTimeout(function () {
                    me.go();
                }, snakeSpeed);
                return;
            }

            me.snakeTail = newHead.prev;
            me.snakeHead = newHead;

            // clear the old board position
            if (grid[newHead.row] && grid[newHead.row][newHead.col]) {
                grid[newHead.row][newHead.col] = 0;
            }

            if (moveQueue.length) {
                myDirection = currentDirection = moveQueue.pop();
            }

            newHead.col = oldHead.col + columnShift[myDirection];
            newHead.row = oldHead.row + rowShift[myDirection];
            newHead.xPos = oldHead.xPos + xPosShift[myDirection];
            newHead.yPos = oldHead.yPos + yPosShift[myDirection];

            if (!newHead.elmStyle) {
                newHead.elmStyle = newHead.elm.style;
            }

            newHead.elmStyle.left = newHead.xPos + "px";
            newHead.elmStyle.top = newHead.yPos + "px";

            // check the new spot the snake moved into

            if (grid[newHead.row][newHead.col] === 0) {
                grid[newHead.row][newHead.col] = 1;
                setTimeout(function () {
                    me.go();
                }, snakeSpeed);
            } else if (grid[newHead.row][newHead.col] > 0) {
                me.handleDeath();
            } else if (grid[newHead.row][newHead.col] === playingBoard.getGridFoodValue()) {
                grid[newHead.row][newHead.col] = 1;
                me.eatFood();
                setTimeout(function () {
                    me.go();
                }, snakeSpeed);
            }
        };

        /**
         * This method is called when it is determined that the snake has eaten some food.
         * @method eatFood
         */
        me.eatFood = function () {
            if (blockPool.length <= growthIncr) {
                createBlocks(growthIncr * 2);
            }
            var blocks = blockPool.splice(0, growthIncr);

            var ii = blocks.length,
                index,
                prevNode = me.snakeTail;
            while (ii--) {
                index = "b" + me.snakeLength++;
                me.snakeBody[index] = blocks[ii];
                me.snakeBody[index].prev = prevNode;
                me.snakeBody[index].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/, '')
                me.snakeBody[index].elm.className += " snake-snakebody-alive";
                prevNode.next = me.snakeBody[index];
                prevNode = me.snakeBody[index];
            }
            me.snakeTail = me.snakeBody[index];
            me.snakeTail.next = me.snakeHead;
            me.snakeHead.prev = me.snakeTail;

            playingBoard.foodEaten();
        };

        /**
         * This method handles what happens when the snake dies.
         * @method handleDeath
         */
        me.handleDeath = function () {
            function recordScore() {
                var highScore = localStorage.jsSnakeHighScore;
                if (highScore == undefined) localStorage.setItem('jsSnakeHighScore', me.snakeLength);
                if (me.snakeLength > highScore) {
                    alert('Congratulations! You have beaten your previous high score, which was ' + highScore + '.');
                    localStorage.setItem('jsSnakeHighScore', me.snakeLength);
                }
            }

            recordScore();
            me.snakeHead.elm.style.zIndex = getNextHighestZIndex(me.snakeBody);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-alive\b/, '')
            me.snakeHead.elm.className += " snake-snakebody-dead";

            isDead = true;
            playingBoard.handleDeath();
            moveQueue = [];
        };

        /**
         * This method sets a flag that lets the snake be alive again.
         * @method rebirth
         */
        me.rebirth = function () {
            isDead = false;
        };

        /**
         * This method reset the snake so it is ready for a new game.
         * @method reset
         */
        me.reset = function () {
            if (isDead === false) {
                return;
            }

            var blocks = [],
                curNode = me.snakeHead.next,
                nextNode;
            while (curNode !== me.snakeHead) {
                nextNode = curNode.next;
                curNode.prev = null;
                curNode.next = null;
                blocks.push(curNode);
                curNode = nextNode;
            }
            me.snakeHead.next = me.snakeHead;
            me.snakeHead.prev = me.snakeHead;
            me.snakeTail = me.snakeHead;
            me.snakeLength = 1;

            for (var ii = 0; ii < blocks.length; ii++) {
                blocks[ii].elm.style.left = "-1000px";
                blocks[ii].elm.style.top = "-1000px";
                blocks[ii].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/, '')
                blocks[ii].elm.className += " snake-snakebody-alive";
            }

            blockPool.concat(blocks);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/, '')
            me.snakeHead.elm.className += " snake-snakebody-alive";
            me.snakeHead.row = config.startRow || 1;
            me.snakeHead.col = config.startCol || 1;
            me.snakeHead.xPos = me.snakeHead.row * playingBoard.getBlockWidth();
            me.snakeHead.yPos = me.snakeHead.col * playingBoard.getBlockHeight();
            me.snakeHead.elm.style.left = me.snakeHead.xPos + "px";
            me.snakeHead.elm.style.top = me.snakeHead.yPos + "px";
        };

        // ---------------------------------------------------------------------
        // Initialize
        // ---------------------------------------------------------------------
        createBlocks(growthIncr * 2);
        xPosShift[0] = 0;
        xPosShift[1] = playingBoard.getBlockWidth();
        xPosShift[2] = 0;
        xPosShift[3] = -1 * playingBoard.getBlockWidth();

        yPosShift[0] = -1 * playingBoard.getBlockHeight();
        yPosShift[1] = 0;
        yPosShift[2] = playingBoard.getBlockHeight();
        yPosShift[3] = 0;
    };
})();
