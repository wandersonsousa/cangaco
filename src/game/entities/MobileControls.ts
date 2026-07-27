import Phaser from 'phaser';

export class MobileControls {
    private scene: Phaser.Scene;

    // Movement Joystick (Left)
    private moveBase!: Phaser.GameObjects.Arc;
    private moveThumb!: Phaser.GameObjects.Arc;
    public moveVector = new Phaser.Math.Vector2(0, 0);
    public isMoving: boolean = false;
    private movePointer: Phaser.Input.Pointer | null = null;

    // Aiming Joystick (Right)
    private aimBase!: Phaser.GameObjects.Arc;
    private aimThumb!: Phaser.GameObjects.Arc;
    public aimAngle: number = 0;
    public isAiming: boolean = false;
    private aimPointer: Phaser.Input.Pointer | null = null;

    // Switch Weapon Button
    private switchButton!: Phaser.GameObjects.Arc;
    private switchIcon!: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, onAttack: () => void, onSwitchWeapon: () => void) {
        this.scene = scene;

        const isMobile = this.scene.sys.game.device.input.touch || window.innerWidth < 800;
        if (!isMobile) return;

        const baseRadius = 55;
        const thumbRadius = 24;

        // 1. Movement Joystick (Bottom Left)
        const moveBaseX = 100;
        const moveBaseY = this.scene.scale.height - 100;

        this.moveBase = this.scene.add.circle(moveBaseX, moveBaseY, baseRadius, 0xFFFFFF, 0.2)
            .setScrollFactor(0).setDepth(2000);
        this.moveThumb = this.scene.add.circle(moveBaseX, moveBaseY, thumbRadius, 0xFFD54F, 0.6)
            .setScrollFactor(0).setDepth(2001);

        // 2. Aiming Joystick (Bottom Right)
        const aimBaseX = this.scene.scale.width - 100;
        const aimBaseY = this.scene.scale.height - 100;

        this.aimBase = this.scene.add.circle(aimBaseX, aimBaseY, baseRadius, 0xFFFFFF, 0.2)
            .setScrollFactor(0).setDepth(2000);
        this.aimThumb = this.scene.add.circle(aimBaseX, aimBaseY, thumbRadius, 0xE0E0E0, 0.6)
            .setScrollFactor(0).setDepth(2001);

        // Touch Listeners
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x < this.scene.scale.width / 2 && !this.movePointer) {
                this.movePointer = pointer;
                this.isMoving = true;
                this.updateJoystick(pointer, moveBaseX, moveBaseY, baseRadius, this.moveThumb, this.moveVector);
            } else if (pointer.x >= this.scene.scale.width / 2 && pointer.x < this.scene.scale.width - 180 && !this.aimPointer) {
                this.aimPointer = pointer;
                this.isAiming = true;
                this.aimAngle = Phaser.Math.Angle.Between(aimBaseX, aimBaseY, pointer.x, pointer.y);
                this.updateJoystick(pointer, aimBaseX, aimBaseY, baseRadius, this.aimThumb, new Phaser.Math.Vector2());
                onAttack(); // Trigger attack when engaging aim stick
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.movePointer && pointer.id === this.movePointer.id) {
                this.updateJoystick(pointer, moveBaseX, moveBaseY, baseRadius, this.moveThumb, this.moveVector);
            }
            if (this.aimPointer && pointer.id === this.aimPointer.id) {
                this.aimAngle = Phaser.Math.Angle.Between(aimBaseX, aimBaseY, pointer.x, pointer.y);
                this.updateJoystick(pointer, aimBaseX, aimBaseY, baseRadius, this.aimThumb, new Phaser.Math.Vector2());
            }
        });

        const resetPointers = (pointer: Phaser.Input.Pointer) => {
            if (this.movePointer && pointer.id === this.movePointer.id) {
                this.movePointer = null;
                this.isMoving = false;
                this.moveVector.set(0, 0);
                this.moveThumb.setPosition(moveBaseX, moveBaseY);
            }
            if (this.aimPointer && pointer.id === this.aimPointer.id) {
                this.aimPointer = null;
                this.isAiming = false;
                this.aimThumb.setPosition(aimBaseX, aimBaseY);
            }
        };

        this.scene.input.on('pointerup', resetPointers);
        this.scene.input.on('pointerupoutside', resetPointers);

        // 3. Switch Weapon Button (Top Right)
        const switchX = this.scene.scale.width - 50;
        const switchY = 50;
        this.switchButton = this.scene.add.circle(switchX, switchY, 26, 0x1976D2, 0.75)
            .setScrollFactor(0).setDepth(2000).setInteractive();
        this.switchIcon = this.scene.add.text(switchX, switchY, '🔄', { fontSize: '20px' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.switchButton.on('pointerdown', () => {
            this.scene.tweens.add({ targets: [this.switchButton, this.switchIcon], scale: 0.85, duration: 60, yoyo: true });
            onSwitchWeapon();
        });
    }

    private updateJoystick(
        pointer: Phaser.Input.Pointer,
        baseX: number,
        baseY: number,
        maxDist: number,
        thumb: Phaser.GameObjects.Arc,
        outVector: Phaser.Math.Vector2
    ) {
        const dist = Phaser.Math.Distance.Between(baseX, baseY, pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(baseX, baseY, pointer.x, pointer.y);

        const clampedDist = Math.min(dist, maxDist);
        const thumbX = baseX + Math.cos(angle) * clampedDist;
        const thumbY = baseY + Math.sin(angle) * clampedDist;

        thumb.setPosition(thumbX, thumbY);
        outVector.set(Math.cos(angle) * (clampedDist / maxDist), Math.sin(angle) * (clampedDist / maxDist));
    }
}
