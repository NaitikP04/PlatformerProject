let invulnerabilityTime = 0;
let enemies;
let bgm;

class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 600;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    
    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-game", 18, 18, 120, 30);
        this.hasKey = false;
        
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");


        // Create a layer
        this.cloudLayer = this.map.createLayer("clouds", this.tileset, 0, 0);
        this.cloudLayer2 = this.map.createLayer("clouds2", this.tileset, 0, 0);
        this.treeLayer = this.map.createLayer("trees", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("ground-and-platforms", this.tileset, 0, 0);

        //checkpoint behavior
        this.checkpointLayer = this.map.createLayer("checkpoint-layer", this.tileset, 0, 0);
        // this.checkpointLayer.setCollisionByProperty({checkpoint: true}, false);
        this.lastCheckpoint = {};

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true,
            spike: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.key = this.map.createFromObjects("Objects", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });

        this.bouncepads = this.map.createFromObjects("Objects", {
            name: "bouncepad",
            key: "tilemap_sheet",
            frame: 108
        });

        this.coinboxes = this.map.createFromObjects("Objects", {
            name: "coinbox",
            key: "tilemap_sheet",
            frame: 10
        });
        

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        this.coins.forEach((coin) => {
            coin.anims.play('coin-spin');
        });

        // key
        this.physics.world.enable(this.key, Phaser.Physics.Arcade.STATIC_BODY);

        // bouncepads
        this.physics.world.enable(this.bouncepads, Phaser.Physics.Arcade.STATIC_BODY);
        this.bouncepadGroup = this.add.group(this.bouncepads);
        // give each bouncepad a pressed state property equal to false
        this.bouncepadGroup.children.iterate((bouncepad) => {
            bouncepad.pressed = false;
        });

        // coinboxes
        this.physics.world.enable(this.coinboxes, Phaser.Physics.Arcade.STATIC_BODY);
        this.coinboxGroup = this.add.group(this.coinboxes);
        // give each coinbox a has coin property equal to true
        this.coinboxGroup.children.iterate((coinbox) => {
            coinbox.hasCoin = true;
        });
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png"); //30 345 or 2100 78 (debugging)
        my.sprite.player.setCollideWorldBounds(true);
        this.playerHP = 10;

        // set up enemies
        enemies = this.physics.add.group();
        this.createEnemy(380, 348);
        this.createEnemy(780, 348);
        this.createEnemy(1480, 366);
        this.createEnemy(2058, 78);
        this.physics.add.collider(enemies, this.groundLayer);
        this.physics.add.collider(my.sprite.player, enemies, this.handleEnemyCollision, null, this);

        //HP display
        this.hearts = this.add.group();
        this.createHearts(this.playerHP);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer, this.handleSpikeCollision, null, this);
        this.physics.add.overlap(my.sprite.player, this.checkpointLayer, this.handleCheckpointCollision, null, this);
        this.physics.add.overlap(my.sprite.player, this.groundLayer, this.handleWaterCollision, null, this);
        this.physics.add.collider(my.sprite.player, this.coinboxes, this.handleCoinboxCollision, null, this);
        this.physics.add.overlap(my.sprite.player, this.groundLayer, this.handleEndCollision, null, this);


        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.score += 10;
            this.sound.play("coinCollect");
            obj2.destroy(); // remove coin on overlap
        });

        //Handle key collision detection
        this.physics.add.overlap(my.sprite.player, this.key, (obj1, obj2) => {
            this.hasKey = true;
            this.sound.play("keyCollect");
            obj2.destroy();
        });

        // Handle collision detection with bounce pads
        this.physics.add.overlap(my.sprite.player, this.bouncepadGroup, this.handleBouncePadCollision, null, this);
        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.pKey = this.input.keyboard.addKey('P');
        this.lKey = this.input.keyboard.addKey('L');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
    

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setFollowOffset(0, -50);
        // if (my.sprite.player.x > 1430) {s
        //     this.cameras.main.setFollowOffset(0, -200);
        // }
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        this.cameras.main.setBackgroundColor(0x87ceeb); // Set background color to blue


        // Score handling
        this.score = 0;
        this.highScore = localStorage.getItem("highScore") || 0;

        this.endMessage = this.add.bitmapText( 2115, 65, 'thickFont', "Uh Oh! You don't have the key! Press R to restart!",8);
        this.endMessage.setOrigin(0.5);
        this.endMessage.maxWidth = 100;
        this.endMessage.visible = false;

        this.animatedTiles.init(this.map);

        bgm = this.sound.add("bgm");
        bgm.play({
            loop: true,
            volume: 0.2 
        });

    }

    createEnemy(x, y) {
        // Create enemy sprite
        let enemy = this.physics.add.sprite(x, y, 'platformer_characters', 'tile_0015.png');
        enemy.setCollideWorldBounds(true);
        enemy.play('enemywalk');
        enemy.setBounce(0.2);
        enemy.direction = 1;
        enemy.flipX = true;
    
        // Add enemy to the group
        enemies.add(enemy);

        // Create a tween to move the enemy back and forth
        this.tweens.add({
            targets: enemy,
            x: enemy.x + 80,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            onYoyo: () => enemy.flipX = !enemy.flipX, // Flip the enemy when it reaches the end
            onRepeat: () => enemy.flipX = !enemy.flipX // Flip the enemy when it returns
        });
    }

    handleCoinboxCollision(player, coinbox) {
        // console.log("Collision detected"); // Check if this prints
    
        if (!my.sprite.player.body.blocked.down && coinbox.hasCoin) {
            // console.log("Coinbox hit from below"); // Check if this prints
            this.score += 10; 
            // Player hit the coinbox from below
            this.dispenseCoin(coinbox.x, coinbox.y - 50);
            coinbox.hasCoin = false; 
        }
    }
      
    
    dispenseCoin(x, y) {
        let coin = this.physics.add.sprite(x, y, 'tilemap_sheet', 151);
        coin.setVelocityY(-200); // Coin moves upwards
        this.sound.play("coinBox", {volume: 0.5});
    
        // Set a timer to remove the coin after 1 second
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                coin.destroy();
            }
        });
    }
    

    handleSpikeCollision(player, tile) {
        // Check if the tile collided with has the spike property
        if (tile.properties && tile.properties.spike) {
            console.log("Spike collision detected");
            // Check if the player is currently vulnerable
            if (invulnerabilityTime === 0) {
                // Apply damage logic here
                this.playerHP -= 2;
                this.score -= 5;
                this.sound.play("damageSound")
                // this.input.keyboard.enabled = false;    

                // Set invulnerability period (iframe)
                invulnerabilityTime = 3000; // 3000 milliseconds (3 seconds)
            }
            // Stop the player's movement
            my.sprite.player.setVelocity(0);
            // Bounce effect with opacity change using tween
            this.tweens.add({
                targets: my.sprite.player,
                y: '-=20', 
                alpha: 0.5, //
                duration: 200, 
                yoyo: false, // Play the tween in reverse
                repeat: 1, // Repeat once (total of two bounces)
                onComplete: () => {
                    // Respawn player at the last checkpoint position
                    if (this.lastCheckpoint && Object.keys(this.lastCheckpoint).length > 0) {
                        my.sprite.player.x = this.lastCheckpoint.x * 18;
                        my.sprite.player.y = this.lastCheckpoint.y * 18;                         
                        //reset player alpha
                        my.sprite.player.alpha = 1;
                        // this.input.keyboard.enabled = true;
                    } else {
                        console.warn("No checkpoint set.");
                    }
                }
            });
        }
    }
    
    handleWaterCollision(player, tile) {
        // Check if the tile collided with represents water
        if (tile.properties && tile.properties.water) {
            console.log("Water collision detected");
            // Check if the player is currently vulnerable
            if (invulnerabilityTime === 0) {
                // Apply damage logic here
                this.playerHP -= 2;
                this.score -= 5;
                this.sound.play("damageSound")
                // Set invulnerability period (iframe)
                invulnerabilityTime = 3000; // 3000 milliseconds (3 seconds)
            }
            // Stop the player's movement
            my.sprite.player.setVelocity(0);
            // this.input.keyboard.enabled = false;
    
            // Make the player sink into the water using a tween
            this.tweens.add({
                targets: my.sprite.player,
                y: '+=100', 
                alpha: 0.5, // Target opacity
                duration: 2000, // Duration of sinking in milliseconds
                onComplete: () => {
                    // Respawn player at the last checkpoint position
                    if (this.lastCheckpoint && Object.keys(this.lastCheckpoint).length > 0) {
                        my.sprite.player.setPosition(this.lastCheckpoint.x * 18, this.lastCheckpoint.y * 18);
                        // Reset player alpha
                        my.sprite.player.alpha = 1;
                        // this.input.keyboard.enabled = true;
                    } else {
                        console.warn("No checkpoint set.");
                    }
                }
            });
        }
    }    
    
    handleCheckpointCollision(player, checkpoint) {
        // console.log("Checkpoint collision detected");
        // console.log("Checkpoint properties:", checkpoint.properties);
        if (checkpoint.properties && checkpoint.properties.checkpoint) {
            // console.log("Updating last checkpoint");
            this.lastCheckpoint = {x: checkpoint.x, y: checkpoint.y};
            // console.log("New checkpoint:", this.lastCheckpoint);
        }
    }

    handleEndCollision(player, tile) {
        if (tile.properties && tile.properties.win) {
            console.log("Win collision detected");
            if (this.hasKey) {
                // If the player has the key, update high score and start win scene
                this.updateHighScore();
                this.sound.play("win");
                this.scene.start("winScene");
            } else {
                // If the player doesn't have the key, display a message
                this.endMessage.visible = true;
            }
        }
        else if (!tile.properties.win) {
            this.endMessage.visible = false;
        }
    }
    

    handleBouncePadCollision(player, bouncepad) {

        console.log("Bouncepad collision detected");

        if (bouncepad.pressed) {
            return;
        }
        else if (!bouncepad.pressed) {    
            bouncepad.pressed = true;
            this.sound.play("boing");
            bouncepad.setTexture("tilemap_sheet", 107); 

            // Calculate the direction of the player relative to the bounce pad
            const playerDirection = player.x > bouncepad.x ? -1 : 1;
        
            // Apply a high upward velocity to simulate a bounce
            player.setVelocityY(-700);
        
            // Adjust horizontal velocity based on the direction of the player
            player.setVelocityX(300 * playerDirection);

            this.time.delayedCall(5000, () => {
                // Reset the texture of the bounce pad to the normal state
                bouncepad.setTexture("tilemap_sheet", 108); 
                bouncepad.pressed = false;
            });
        }
    }

    handleEnemyCollision(player, enemy) {
        if (player.body.touching.down && enemy.body.touching.up) {
            this.score += 10;
            enemy.destroy();
            this.sound.play("stomp");
        } else {
            // Deal damage to player
            if (invulnerabilityTime === 0) {
                this.playerHP -= 2;
                this.score -= 5;
                this.sound.play("damageSound")
                invulnerabilityTime = 3000;
            }
        }
    }

    
    createHearts() {
        // Clear existing hearts    
        if (this.heart) {
            this.heart.destroy();
        }
        // Calculate the number of full hearts
        const fullHearts = Math.floor(this.playerHP / 2);
    
        // Calculate the number of half hearts
        const halfHearts = this.playerHP % 2;
    
        // Calculate the number of empty hearts
        const emptyHearts = Math.floor((10 - this.playerHP) / 2);
    
        // Calculate the starting X position to center the hearts horizontally
        const startX = (this.cameras.main.width - ((fullHearts + halfHearts + emptyHearts) * 160)) / 2;
    
        // Calculate the vertical position to place the hearts at the top of the screen
        const startY = 20;
    
        // Get the top-left corner position of the camera's viewport
        const cameraX = this.cameras.main.worldView.x;
        const cameraY = this.cameras.main.worldView.y;
    
        // Create a container for the hearts
        const heartsContainer = this.add.container(cameraX, cameraY);
    
        // Add full hearts to the container
        for (let i = 0; i < fullHearts; i++) {
            const heart = this.add.image(startX + i * 40, startY, 'hpFull');
            heart.setScale(2.5);
            heart.setAlpha(0.8);
            heartsContainer.add(heart);
        }
    
        // Add half hearts to the container
        for (let i = 0; i < halfHearts; i++) {
            const heart = this.add.image(startX + (fullHearts + i) * 40, startY, 'hpHalf');
            heart.setScale(2.5);
            heart.setAlpha(0.8);
            heartsContainer.add(heart);
        }
    
        // Add empty hearts to the container
        for (let i = 0; i < emptyHearts; i++) {
            const heart = this.add.image(startX + (fullHearts + halfHearts + i) * 40, startY, 'hpEmpty');
            heart.setScale(2.5);
            heart.setAlpha(0.8);
            heartsContainer.add(heart);
        }
    
        // Add the container to the scene
        this.add.existing(heartsContainer);
        this.heart = heartsContainer;
    }

    updateHighScore() {
        // Update high score if current score is higher
        if (this.score > this.highScore) {
            this.highScore = this.score;
            // Store new high score in local storage
            localStorage.setItem('highScore', this.highScore);
        }
        // Set current score and high score in game registry for access in game over scene
        this.registry.set('currentScore', this.score);
        this.registry.set('highScore', this.highScore);
    }
    
    update(time, delta) {  

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0   );
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();

        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jump");
        }

        if(Phaser.Input.Keyboard.JustDown(this.pKey)) {
            //print player position
            console.log(my.sprite.player.x, my.sprite.player.y);
            console.log('World Bounds:', this.physics.world.bounds);

        }

        if (Phaser.Input.Keyboard.JustDown(this.lKey)) {
            if (this.lastCheckpoint && Object.keys(this.lastCheckpoint).length > 0) {
                // console.log("Respawning at checkpoint:", this.lastCheckpoint);
                my.sprite.player.x = this.lastCheckpoint.x * 18;
                my.sprite.player.y = this.lastCheckpoint.y * 18; 
                this.playerHP -= 2;
                // console.log("Player position after respawn:", my.sprite.player.x, my.sprite.player.y);
            } else {
                console.warn("No checkpoint set.");
            }
        }    

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            if (bgm && bgm.isPlaying) {
                bgm.stop();
            }
            this.scene.restart();
        }
        
        // Decrease the invulnerability time if it's greater than 0
        if (invulnerabilityTime > 0) {
            invulnerabilityTime -= delta;
            // Ensure invulnerabilityTime doesn't go below 0
            if (invulnerabilityTime < 0) {
                invulnerabilityTime = 0;
            }
        }

        if (this.playerHP <= 0) {
            this.updateHighScore();
            this.scene.start("loseScene");
            if (bgm && bgm.isPlaying) {
                bgm.stop();
            }
        }

        // console.log(this.score);
        
        this.createHearts(this.playerHP);
    }
}