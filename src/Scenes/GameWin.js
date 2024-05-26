class WinScene extends Phaser.Scene {
    constructor() {
        super("winScene");
    }

    create() {

        this.rKey = this.input.keyboard.addKey('R');

        const score = this.registry.get('currentScore');
        const highScore = this.registry.get('highScore');

        // Add the Lose text
        this.add.bitmapText(350, 120, 'thickFont', 'YOU WIN!', 128);

        // Show Score and High Score
        this.add.bitmapText(300, 320, 'thickFont', 'Score: ' + score, 32);
        this.add.bitmapText(300, 420, 'thickFont', 'High Score: ' + highScore, 32);

        // Press R to restart
        this.add.bitmapText(350, 520, 'thickFont', 'Press R to restart', 64);
        
    }

    update() {
        // Check for R key press to restart the scene
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            if (bgm && bgm.isPlaying) {
                bgm.stop();
            }
            this.scene.start('platformerScene'); // Start the platformer scene
        }
    }
}