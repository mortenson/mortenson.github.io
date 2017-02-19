/**
 * tableswap.js * Samuel Mortenson * 2017
 *
 * This is a funny little chunk of code that takes two 2D arrays that contain
 * the same items in different order, and re-orders them visually, using
 * vanilla Javascript animations and an HTML table.
 */

"use strict";

/**
 * Constructs an Index object.
 *
 * @param {Number} row
 * @param {Number} col
 * @property {Number} row
 * @property {Number} col
 * @constructor
 */
function Index(row, col) {
  this.row = parseInt(row);
  this.col = parseInt(col);
}

/**
 * Tests the equality of two indices.
 *
 * @param {Index} index
 *   The index to compare equality with.
 * @returns {Boolean}
 *   Whether or not the given index is equal.
 */
Index.prototype.equals = function (index) {
  return parseInt(this.row) === parseInt(index.row) && parseInt(this.col) === parseInt(index.col);
};

/**
 * A class which visualizes a 2D array as an HTML table, and animated swapping
 * that array into target desired states.
 *
 * @param {Array} currentState
 *   A 2D array of characters.
 * @param {Array[]} desiredStates
 *   An array of 2D arrays, which currentState will be swapped into.
 * @param {Element} container
 *   A container element to append the table to.
 * @property {Array[]} currentState
 *   A 2D array of characters.
 * @property {Array[]} desiredStates
 *   An array of 2D arrays, which currentState will be swapped into.
 * @property {Index} lastMismatch
 *   The last index that was found to be out of order, and still needs
 *   to be moved more to reach its desired location.
 * @property {Index} lastDesired
 *   The last desired location, to reduce runtime.
 * @property {Index[]} lastSwapped
 *   The last two elements that were swapped. It's preferred, both
 *   visually and for performance reasons, that elements that were
 *   recently swapped are not swapped again.
 * @property {Boolean} lastDirection
 *   Again, for visual reasons we prefer to move in a different direction
 *   every swap, if that's possible. In some cases this can increase
 *   performance with a diagonal move pattern across the table.
 * @property {Element} table
 *   The HTML table that's used for visualization.
 * @property {Element} wrap
 *   The wrapping element for our table. Used to easily detect hover events.
 * @constructor
 */
function TableSwap (currentState, desiredStates, container) {
  this.currentState = currentState;
  this.desiredStates = desiredStates;
  this.lastMismatch = null;
  this.lastDesired = null;
  this.lastSwapped = null;
  this.lastDirection = false;
  this.table = document.createElement('table');
  this.wrap = document.createElement('div');
  this.wrap.classList = 'tableswap';
  this.wrap.appendChild(this.table);
  this.i = 0;
  this.timeout = null;
  container.appendChild(this.wrap);
}

/**
 * Finds the next mismatched index, based on a given desired state. Indices
 * that haven't been swapped recently are preferred, based on "this.lastSwapped".
 *
 * @param {Array[]} desiredState
 *   A 2D array of characters representing a desired state.
 * @returns Index
 */
TableSwap.prototype.findMismatchedIndex = function(desiredState) {
  if (this.lastMismatch) {
    return this.lastMismatch;
  }
  var temp;
  for (var row in this.currentState) {
    for (var col in this.currentState[row]) {
      if (this.currentState[row][col] !== desiredState[row][col]) {
        var index = new Index(row, col);
        if (this.lastSwapped && (index.equals(this.lastSwapped[0]) || index.equals(this.lastSwapped[1]))) {
          temp = index;
        }
        else {
          return index;
        }
      }
    }
  }
  return temp;
};

/**
 * Finds the desired index for a given letter.
 *
 * @param {String} letter
 *   The letter of a mismatched cell.
 * @param {Array} desiredState
 *   A 2D array of characters representing a desired state.
 * @returns Index
 */
TableSwap.prototype.findDesiredIndex = function (letter, desiredState) {
  if (this.lastDesired) {
    return this.lastDesired;
  }
  var temp;
  for (var row in desiredState) {
    for (var col in desiredState[row]) {
      if (desiredState[row][col] === letter && this.currentState[row][col] !== letter) {
        var index = new Index(row, col);
        if (this.lastSwapped && (index.equals(this.lastSwapped[0]) || index.equals(this.lastSwapped[1]))) {
          temp = index;
        }
        else {
          return index;
        }
      }
    }
  }
  return temp;
};

/**
 * Moves one index towards another by swapping array values in
 * currentState. After modifying the contents of currentState, this
 * function will also trigger an animation that visually swaps the HTML
 * table cells.
 *
 * @param {Index} pos1
 *   The mismatched position.
 * @param {Index} pos2
 *   The desired position.
 */
TableSwap.prototype.moveTowards = function (pos1, pos2) {
  var rowOffset = Math.sign(pos2.row - pos1.row);
  var colOffset = Math.sign(pos2.col - pos1.col);
  // Prefer to move in a new direction, if possible.
  if (rowOffset && colOffset) {
    if (this.lastDirection) {
      colOffset = 0;
    }
    else {
      rowOffset = 0;
    }
  }
  this.lastDirection = !rowOffset;
  var newPos = new Index(pos1.row + rowOffset, pos1.col + colOffset);
  var temp = this.currentState[pos1.row][pos1.col];
  this.currentState[pos1.row][pos1.col] = this.currentState[newPos.row][newPos.col];
  this.currentState[newPos.row][newPos.col] = temp;
  // If we haven't landed on our desired index yet, store already
  // present indices to make the next iteration faster.
  if (!newPos.equals(pos2)) {
    this.lastMismatch = newPos;
    this.lastDesired = pos2;
    this.lastSwapped = [pos1, newPos];
  }
  else {
    this.lastMismatch = null;
    this.lastDesired = null;
  }
  this.animate(pos1, newPos, rowOffset, colOffset);
};

/**
 *
 * @param {Index} pos1
 *   The index of the first cell.
 * @param {Index} pos2
 *   The index of the second cell.
 * @param {Number} rowOffset
 *   The row offset, or the direction pos1 should move on the y axis.
 * @param {Number} colOffset
 *   The column offset, or the direction pos1 should move on the x axis.
 */
TableSwap.prototype.animate = function (pos1, pos2, rowOffset, colOffset) {
  var animationSpeed = 5;
  // Poor man's bullet time effect for when a user hovers the table.
  if (this.wrap.querySelector(':hover') === this.table) {
    animationSpeed = 1;
  }
  rowOffset += rowOffset * animationSpeed;
  colOffset += colOffset * animationSpeed;
  var cell1 = this.table.rows[pos1.row].cells[pos1.col];
  var cell2 = this.table.rows[pos2.row].cells[pos2.col];
  var cell2Top = cell2.offsetTop;
  var cell2Left = cell2.offsetLeft;
  var cell1Top = cell1.offsetTop;
  var cell1Left = cell1.offsetLeft;
  // Animation callback used by requestAnimationFrame. We don't check
  // timestamps between "frames" here, but we could do that to keep
  // our speed consistent.
  var self = this;
  function animateSwap () {
    // Bounds checking.
    if (rowOffset > 0 && (cell1.offsetTop + rowOffset) < cell2Top || rowOffset < 0 && (cell1.offsetTop + rowOffset) > cell2Top || colOffset > 0 && (cell1.offsetLeft + colOffset) < cell2Left || colOffset < 0 && (cell1.offsetLeft + colOffset) > cell2Left) {
      // Move the cells towards eachother's original position.
      cell1.style.top = (parseInt(cell1.style.top) || 0) + rowOffset + 'px';
      cell1.style.left = (parseInt(cell1.style.left) || 0) + colOffset + 'px';
      cell2.style.top = (parseInt(cell2.style.top) || 0) + -1 * rowOffset + 'px';
      cell2.style.left = (parseInt(cell2.style.left) || 0) + -1 * colOffset + 'px';
      cell2.style.opacity = parseFloat(cell2.style.opacity) || 1;
      // To enhance the readability of the swap, fade one cell as it passes by
      // the other.
      var midpoint = [(cell1Left + cell2Left) / 2, (cell1Top + cell2Top) / 2];
      var distanceToMidpoint = Math.sqrt((cell2.offsetLeft - midpoint[0]) * (cell2.offsetLeft - midpoint[0]) + (cell2.offsetTop - midpoint[1]) * (cell2.offsetTop - midpoint[1]));
      var distance = Math.sqrt((cell1Left - cell2Left) * (cell1Left - cell2Left) + (cell1Top - cell2Top) * (cell1Top - cell2Top));
      cell2.style.opacity = (distanceToMidpoint * 2) / distance;
      requestAnimationFrame(animateSwap);
    }
    // We're out of bounds, which means the animation is near-complete.
    // Call our main function to re-render the table and start a swap.
    else {
      self.update();
    }
  }
  animateSwap();
};

/**
 * Renders the current state as an HTML table.
 */
TableSwap.prototype.render = function () {
  this.table.innerHTML = '';
  for (var row in this.currentState) {
    var rowElement = this.table.insertRow(row);
    for (var col in this.currentState[row]) {
      var colElement = rowElement.insertCell(col);
      colElement.innerHTML = this.currentState[row][col];
    }
  }
};

/**
 * Swaps cells in the current state to match each desired state.
 */
TableSwap.prototype.update = function () {
  var desiredState = this.desiredStates[this.i % this.desiredStates.length];
  if (JSON.stringify(this.currentState) !== JSON.stringify(desiredState)) {
    this.render();
    var currentPosition = this.findMismatchedIndex(desiredState);
    var desiredPosition = this.findDesiredIndex(this.currentState[currentPosition.row][currentPosition.col], desiredState);
    this.moveTowards(currentPosition, desiredPosition);
  }
  else {
    ++this.i;
    this.start();
  }
};

/**
 * Starts the update cycle.
 *
 * @param {Number} timeout
 *   The timeout before starting the animation cycle.
 */
TableSwap.prototype.start = function (timeout) {
  timeout = typeof(timeout) !== 'undefined' ? timeout : 5000;
  this.render();
  this.timeout = setTimeout(this.update.bind(this), timeout);
};

/**
 * Stops the update cycle.
 */
TableSwap.prototype.stop = function () {
  clearTimeout(this.timeout);
};

/**
 * Resizes a 2D array to a given width.
 *
 * @param {Array} array
 *   A 2D array.
 * @param {Number} desiredWidth
 *   The width of each row in the resized array.
 * @returns {Array}
 */
TableSwap.prototype.resizeArray = function (array, desiredWidth) {
  var newArray = [];
  var width = 0;
  for (var row in array) {
    for (var col in array[row]) {
      var i = Math.floor(width / desiredWidth);
      if (!newArray[i]) {
        newArray[i] = [];
      }
      newArray[i].push(array[row][col]);
      ++width;
    }
  }
  return newArray;
};

/**
 * Resizes the table swap display to a given width.
 *
 * @param {Number} desiredWidth
 *   The width of each row in the resized display.
 */
TableSwap.prototype.resize = function (desiredWidth) {
  this.stop();
  this.currentState = this.resizeArray(this.currentState, desiredWidth);
  for (var i in this.desiredStates) {
    this.desiredStates[i] = this.resizeArray(this.desiredStates[i], desiredWidth);
  }
  this.lastMismatch = null;
  this.lastDesired = null;
  this.lastSwapped = null;
  this.lastDirection = false;
  this.start(0);
};
