/* Robert Mangrum
 * TCSS 491 Winter 20
 * Assignment 1 - Animation
 * 
 * Sprites sourced from https://www.spriters-resource.com/snes/gundamwing/sheet/13904/
 * and modified through piskel.
 * 
 * assetmanager and gameengine modified from Seth Ladd as covered in class
 */

var AM = new AssetManager();

function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

// Static background
function Background(game, spritesheet) {
    this.x = 0;
    this.y = 0;
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
};

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet,
                   this.x, this.y);
};

Background.prototype.update = function () {
};

// Animated foreground
function Foreground(game) {
    this.x = 0;
    this.y = 426.75;
    this.animation = new Animation(AM.getAsset("./img/Foreground.png"),
        0, 0, 512, 213.15, 0.5, 4, true, false);
    this.game = game;
    this.ctx = game.ctx;
};

Foreground.prototype.draw = function () {
    this.animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
};

Foreground.prototype.update = function () {
};

// Wing Gundam, animated to rotate through an idle animation, into a walking animation,
// and finishing with an attack animation before looping.
function WingGundam(game) {
    this.idleAnim = new Animation(AM.getAsset("./img/Wing_Idle.png"), 
        0, 0, 150, 150, 0.5, 2, true, false);
    this.walkAnim = new Animation(AM.getAsset("./img/Wing_Walking.png"),
        300, 0, 150, 150, 0.125, 6, true, false);
    this.attackAnim = new Animation(AM.getAsset("./img/Wing_Attack.png"),
        0, 0, 150, 150, 0.2, 8, true, false);
    this.x = -50;
    this.y = 400;
    this.speed = 130;
    this.game = game;
    this.ctx = game.ctx;

    this.counter = 60;

    this.state = 'idle';
}

// Draw function based on which state (idle, walk, attack) Wing Gundam is in
WingGundam.prototype.draw = function () {
    if (this.state === 'walk') {
        this.walkAnim.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 1.5);
    } else if (this.state === 'attack') {
        this.attackAnim.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 1.5);
    } else if (this.state === 'idle') {
        this.idleAnim.drawFrame(this.game.clockTick, this.ctx, this.x, this.y, 1.5);
    }
}

// Update function to swap states after a number a set time based on loops
// Wing Gundam moves from left to right during its walk animation, and resets to the left
// near the right edge of the screen.
WingGundam.prototype.update = function () {
    // Reset to left when close to the right edge
    if (this.x > 475 && this.state === 'walk') this.x = -50; 
    
    // Idle counter and transition to walking
    if (this.state === 'idle') {
        if (this.counter >= 0) {
            this.counter--;
        } else {
            this.state = 'walk';
            this.counter = 60;
        }
    }

    // Walking counter, transition to attack, and update x position while walking
    if (this.state === 'walk') {
        if (this.counter >= 0) {
            this.counter--;
            this.x += this.speed * this.game.clockTick;
        } else {
            this.state = 'attack';
            this.counter = 96;
        }
    } 
    
    // Attack counter and transition to idle
    if (this.state === 'attack') {
        if (this.counter >= 0) {
            this.counter--;
        } else {
            this.state = 'idle';
            this.counter = 60;
        }
    }
}

AM.queueDownload("./img/StageBackground.png");
AM.queueDownload("./img/Foreground.png");
AM.queueDownload("./img/Wing_Attack.png");
AM.queueDownload("./img/Wing_Idle.png");
AM.queueDownload("./img/Wing_Walking.png");

AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/StageBackground.png")));
    gameEngine.addEntity(new Foreground(gameEngine));
    gameEngine.addEntity(new WingGundam(gameEngine));

    console.log("All Done!");
});