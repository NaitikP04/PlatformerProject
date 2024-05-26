class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");         // Packed tilemap
        this.load.tilemapTiledJSON("platformer-game", "tilemap.tmj");   // Tilemap in JSON

        this.load.image("hpEmpty", "heartEmpty.png");
        this.load.image("hpHalf", "heartHalf.png");
        this.load.image("hpFull", "heartFull.png");

        this.load.bitmapFont('thickFont', 'thick_8x8.png', 'thick_8x8.xml');

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // Load the audio assets
        this.load.setPath(" /assets/Audio/");
        this.load.audio("damageSound", "roblox-death-sound_1.mp3");
        this.load.audio("coinBox", "coinbox.mp3");
        this.load.audio("coinCollect", "coinpickup.mp3");
        this.load.audio("keyCollect", "keycollect.mp3");
        this.load.audio("boing", "boing.mp3");
        this.load.audio("jump", "jump.mp3");
        this.load.audio("stomp", "stomp.mp3");
        this.load.audio("bgm", "backgroundmusic.mp3");
        this.load.audio("win", "win.mp3");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });
        this.anims.create({
            key: 'enemywalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 15,
                end: 16,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'coin-spin',
            frames: this.anims.generateFrameNumbers('tilemap_sheet', { start: 151, end: 152 }),
            frameRate: 5,
            repeat: -1
        });
        
        // ...and pass to the next Scene
        this.scene.start("startScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}