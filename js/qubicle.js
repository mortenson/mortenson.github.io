/**
 * qubicle.js * Samuel Mortenson * 2017
 *
 * This file defines objects that can help bootstrap web applications that
 * use Qubicle sprites, which is a thing I totally made up.
 *
 * Basically, Qubicle is a 3D editor which lets you make voxel models. Voxels
 * are kinda 3D pixels, so I figured that the most true to form way to animate
 * them would be to use frames, like you would in a 2D game.
 *
 * Anywho, enjoy the shallow abstraction that only exists for this one page.
 */

"use strict";

/**
 * This object represents a Qubicle sprite, which is an animated model which is
 * rendered via three.js and the QubicleEngine.
 *
 * @param {String[]} objectNames
 *   An array of object names, which represent file prefixes.
 *   ex: "my_model" would imply that assets/mymodel.obj and assets/mymodel.mtl
 *   exist.
 * @param {Integer[]} animation
 *   An array of indexes which represent an animation. Each index should
 *   correspond to a key in this.objects.
 *   ex: If objectNames was ["model1", "model2"], an animation might be [0,1]
 * @param {function} renderCallback
 *   A callback to handle any extra logic that a sprite may want to implement
 *   every animation frame. Animation happens before the callback.
 * @property {String[]} objectNames
 *   An array of object names, which represent file prefixes.
 *   ex: "my_model" would imply that assets/mymodel.obj and assets/mymodel.mtl
 *   exist.
 * @property {THREE.Object3D[]} objects
 *   The loaded objects.
 * @property {THREE.Object3D} currentObject
 *   The currently displayed object.
 * @property {Integer[]} animation
 *   An array of indexes which represent an animation. Each index should
 *   correspond to a key in this.objects.
 *   ex: If objectNames was ["model1", "model2"], an animation might be [0,1]
 * @property {Integer} frame
 *   A counter of how many frames been displayed.
 * @property {Integer} animationFrame
 *   The current animation frame (index).
 * @property {Integer} animationSpeed
 *   How many frames should elapse before a new animation frame.
 * @property {Boolean} loaded
 *   Whether or not all the objects for this sprite have been loaded.
 * @property {Function} renderCallback
 *   A callback for when the sprite has been rendered. Useful for animation.
 *
 * @constructor
 */
function QubicleSprite (objectNames, animation, renderCallback) {
  this.objectNames = objectNames;
  this.objects = [];
  this.currentObject = null;
  this.animation = animation;
  this.frame = 0;
  this.animationFrame = 0;
  this.animationSpeed = 10;
  this.loaded = false;
  this.renderCallback = renderCallback;
}

/**
 * Loads the objects required to render the QubicleSprite.
 *
 * @param {THREE.Scene} scene
 *   The three.js scene, so that objects can be added after they load.
 */
QubicleSprite.prototype.load = function (scene) {
  for (var i = 0; i < this.objectNames.length; ++i) {
    (function(i, sprite, scene) {
      var objectName = sprite.objectNames[i];
      var mtlLoader = new THREE.MTLLoader();
      mtlLoader.setPath('assets/');
      mtlLoader.load(objectName + '.mtl', function (materialCreator) {
        materialCreator.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setPath('assets/');
        objLoader.setMaterials(materialCreator);
        objLoader.load(objectName + '.obj', function (object) {
          object.position.y = -20;
          object.visible = false;
          scene.add(object);
          sprite.objects[i] = object;
          if (i + 1 === sprite.objectNames.length) {
            sprite.loaded = true;
          }
        });
      });
    })(i, this, scene);
  }
};

/**
 * Renders and animates the QubicleSprite.
 *
 * @param {Object} environment
 *   An object representing the current environment.
 * @param {Integer} environment.mouseX
 *   The mouse position on the X axis of the scene.
 * @param {Integer} environment.mouseY
 *   The mouse position on the Y axis of the scene.
 */
QubicleSprite.prototype.render = function (environment) {
  if (!this.loaded) {
    return;
  }
  if (!(this.frame % this.animationSpeed)) {
    if (this.animationFrame >= this.animation.length) {
      this.animationFrame = 0;
    }
    var object = this.objects[this.animation[this.animationFrame]];
    if (this.currentObject) {
      object.position.copy(this.currentObject.position);
      object.rotation.copy(this.currentObject.rotation);
      this.currentObject.visible = false;
    }
    this.currentObject = object;
    this.currentObject.visible = true;
    ++this.animationFrame;
  }
  if (this.renderCallback) {
    this.renderCallback(environment);
  }
  ++this.frame;
};

/**
 * This object represents an engine that can render a basic Three.js scene with
 * support for rendering QubicleSprites. Lots of things are hard-coded in the
 * constructor, but if this was a real library and not just my house keeping I
 * would split this into arguments or function prototypes.
 *
 * @param {QubicleSprite[]} sprites
 *   An array of sprites to render on screen.
 * @property {QubicleSprite[]} sprites
 *   An array of sprites to render on screen.
 * @property {THREE.Camera} camera
 *   The three.js camera.
 * @property {THREE.Scene} scene
 *   The three.js scene.
 * @property {THREE.WebGLRenderer} renderer
 *   The three.js renderer.
 * @constructor
 */
function QubicleEngine (sprites) {
  this.frame = 0;
  this.environment = {
    mouseX: 0,
    mouseY: 0
  };
  this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  this.camera.position.z = 100 + (50 * (400 / window.innerWidth));
  this.sprites = sprites;
  this.scene = new THREE.Scene();
  var ambient = new THREE.AmbientLight(0x404040);
  this.scene.add(ambient);
  var directionalLight = new THREE.DirectionalLight(0xffeedd, .7);
  directionalLight.position.set(.5, .5, 1).normalize();
  this.scene.add(directionalLight);

  var container = document.createElement('div');
  document.body.appendChild(container);

  this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  this.renderer.setPixelRatio(window.devicePixelRatio);
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(this.renderer.domElement);

  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', function () {
    this.environment.mouseX = (event.clientX - windowHalfX) / 2;
    this.environment.mouseY = (event.clientY - windowHalfY) / 2;
  }.bind(this), false);

  window.ontouchmove = function () {
    var touch = event.touches.item(0);
    this.environment.mouseX = (touch.clientX - windowHalfX) / 2;
    this.environment.mouseY = (touch.clientY - windowHalfY) / 2;
  }.bind(this);

  window.addEventListener('resize', function () {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.position.z = 100 + (50 * (400 / window.innerWidth));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }.bind(this), false);

  for (var i in sprites) {
    var sprite = sprites[i];
    if (!sprite.loaded) {
      sprite.load(this.scene);
    }
  }
}

/**
 * Renders each of the sprites and the scene.
 */
QubicleEngine.prototype.render = function () {
  for (var i in this.sprites) {
    var sprite = this.sprites[i];
    if (sprite.loaded) {
      sprite.render(this.environment);
    }
  }
  this.renderer.render(this.scene, this.camera);
};

/**
 * Starts the animation loop.
 */
QubicleEngine.prototype.start = function () {
  var self = this;
  function animate () {
    self.animationFrameRequestId = requestAnimationFrame(animate);
    self.render();
  }
  animate();
};

/**
 * Stops the animation loop. This works, but is unused.
 */
QubicleEngine.prototype.stop = function () {
  if (this.animationFrameRequestId) {
    cancelAnimationFrame(this.animationFrameRequestId);
  }
};
