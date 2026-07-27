import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    private maxDistance: number = 800; // Bullet travels up to 800px
    private startX: number = 0;
    private startY: number = 0;
    public damage: number = 35;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'bullet_texture');
    }

    public fire(x: number, y: number, angle: number) {
        this.setTexture('bullet_texture');
        this.enableBody(true, x, y, true, true);
        this.setPosition(x, y);
        this.startX = x;
        this.startY = y;

        const speed = 750;
        this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
        this.setRotation(angle);
    }

    public update() {
        if (!this.active) return;

        const dist = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
        if (dist >= this.maxDistance) {
            this.kill();
        }
    }

    public kill() {
        this.disableBody(true, true);
    }
}
