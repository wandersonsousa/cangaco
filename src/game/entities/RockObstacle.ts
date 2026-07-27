import Phaser from 'phaser';

export class RockObstacle {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public radius: number;

    constructor(scene: Phaser.Scene, x: number, y: number, radius: number = 30) {
        this.radius = radius;
        this.sprite = scene.physics.add.sprite(x, y, 'rock_obstacle_texture');
        this.sprite.setCircle(radius, -radius + 40, -radius + 40);
        this.sprite.setImmovable(true);
    }
}
