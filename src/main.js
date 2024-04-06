import * as Phaser from "./modules/phaser.mjs";
import * as planck from "./modules/planck.mjs";

let game;

window.onload = function () {
  let gameConfig = {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: "thegame",
      width: 600,
      height: 600,
    },
    scene: playGame,
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
};

class playGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
  }

  create() {
    // Box2D works with meters. We need to convert meters to pixels.
    // let's say 30 pixels = 1 meter.
    this.worldScale = 30;

    let gravity = planck.Vec2(0, 3);

    this.world = planck.World(gravity);

    this.createBox(
      game.config.width / 2,
      game.config.height - 20,
      game.config.width,
      40,
      false,
    );

    // The rest of the script just creates a random box each 500ms, then restarts after 100 iterations
    this.tick = 0;
    this.time.addEvent({
      delay: 500,
      callbackScope: this,
      callback: function () {
        this.createBox(
          Phaser.Math.Between(100, game.config.width - 100),
          -100,
          Phaser.Math.Between(20, 80),
          Phaser.Math.Between(20, 80),
          true,
        );
        this.tick++;
        if (this.tick == 100) {
          this.scene.start("PlayGame");
        }
      },
      loop: true,
    });
  }

  // here we go with some Box2D stuff
  // arguments: x, y coordinates of the center, with and height of the box, in pixels
  // we'll conver pixels to meters inside the method
  createBox(posX, posY, width, height, isDynamic) {
    // this is how we create a generic Box2D body
    let box = this.world.createBody();
    if (isDynamic) {
      // Box2D bodies born as static bodies, but we can make them dynamic
      box.setDynamic();
    }

    // a body can have one or more fixtures. This is how we create a box fixture inside a body
    box.createFixture(
      planck.Box(width / 2 / this.worldScale, height / 2 / this.worldScale),
    );

    // now we place the body in the world
    box.setPosition(
      planck.Vec2(posX / this.worldScale, posY / this.worldScale),
    );

    // time to set mass information
    box.setMassData({
      mass: 1,
      center: planck.Vec2(),

      // "I" represents the body's moment of inertia, which determines its
      // resistance to rotational acceleration. Setting it to zero prevents
      // rotation.
      I: 1,
    });

    // now we create a graphics object representing the body
    var color = new Phaser.Display.Color();
    color.random();
    color.brighten(50).saturate(100);
    let userData = this.add.graphics();
    userData.fillStyle(color.color, 1);
    userData.fillRect(-width / 2, -height / 2, width, height);

    // a body can have anything in its user data, normally it's used to store its sprite
    box.setUserData(userData);
  }

  update() {
    // advance the simulation by 1/20 seconds
    this.world.step(1 / 30);

    // crearForces  method should be added at the end on each step
    this.world.clearForces();

    // iterate through all bodies
    for (let b = this.world.getBodyList(); b; b = b.getNext()) {
      // get body position
      let bodyPosition = b.getPosition();

      // get body angle, in radians
      let bodyAngle = b.getAngle();

      // get body user data, the graphics object
      let userData = b.getUserData();

      // adjust graphic object position and rotation
      userData.x = bodyPosition.x * this.worldScale;
      userData.y = bodyPosition.y * this.worldScale;
      userData.rotation = bodyAngle;
    }
  }
}
