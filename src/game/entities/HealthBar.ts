import Phaser from 'phaser';

export class HealthBar {
    private scene: Phaser.Scene;
    private bar: Phaser.GameObjects.Graphics;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private value: number;
    private maxValue: number;
    private isHUD: boolean;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number = 50,
        height: number = 6,
        maxValue: number = 100,
        isHUD: boolean = false
    ) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxValue = maxValue;
        this.value = maxValue;
        this.isHUD = isHUD;

        this.bar = this.scene.add.graphics();
        if (this.isHUD) {
            this.bar.setScrollFactor(0);
            this.bar.setDepth(1000);
        }
        this.draw();
    }

    public setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.draw();
    }

    public setValue(newValue: number) {
        this.value = Phaser.Math.Clamp(newValue, 0, this.maxValue);
        this.draw();
    }

    public getValue(): number {
        return this.value;
    }

    private draw() {
        this.bar.clear();

        // Background / Border
        this.bar.fillStyle(0x000000, 0.6);
        this.bar.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        this.bar.fillStyle(0x333333, 1);
        this.bar.fillRect(this.x, this.y, this.width, this.height);

        // Health fill color
        const percentage = this.value / this.maxValue;
        let color = 0x4CAF50; // Green
        if (percentage < 0.3) color = 0xF44336; // Red
        else if (percentage < 0.6) color = 0xFFEB3B; // Yellow

        const fillWidth = Math.floor(this.width * percentage);
        if (fillWidth > 0) {
            this.bar.fillStyle(color, 1);
            this.bar.fillRect(this.x, this.y, fillWidth, this.height);
        }
    }

    public destroy() {
        this.bar.destroy();
    }
}
