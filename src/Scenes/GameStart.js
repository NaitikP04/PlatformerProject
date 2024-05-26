class StartScene extends Phaser.Scene {
    constructor() {
        super("startScene");
    }

    create() {
        // Title: Collect the coins!
        // Create start screen using the bitmap font 'thickFont'

        // Add the title text
        this.add.bitmapText(300, 120, 'thickFont', 'Collect the coins!', 64);

        // Add the instructions text
        this.add.bitmapText(300, 220, 'thickFont', 'Use the arrow keys to move and jump', 32);

        //press R to restart
        this.add.bitmapText(300, 320, 'thickFont', 'Press R to restart', 32);

        // Avoid the enemies and collect the coins and reach the end, press L to go to last checkpoint, but you lose hp in doing so
        this.add.bitmapText(300, 420, 'thickFont', 'Avoid the enemies and collect the coins', 32);
        
        // Add the start text
        this.add.bitmapText(300, 520, 'thickFont', 'Press SPACE to start', 32);
        
        // go to the next scene when the space key is pressed
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start("platformerScene");
        });
        
    }
}