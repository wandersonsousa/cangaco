import Phaser from 'phaser';
import { HealthBar } from './HealthBar';
import { Bullet } from './Bullet';
import { MobileControls } from './MobileControls';

export type WeaponMode = 'peixeira' | 'carabina';

export class Player {
    public scene: Phaser.Scene;
    public sprite!: Phaser.Physics.Arcade.Sprite;
    public shadow!: Phaser.GameObjects.Ellipse;
    public weaponContainer!: Phaser.GameObjects.Container;
    public peixeiraGraphic!: Phaser.GameObjects.Graphics;
    public carabinaGraphic!: Phaser.GameObjects.Graphics;
    public healthBar!: HealthBar;
    public modeText!: Phaser.GameObjects.Text;
    public mobileControls!: MobileControls;

    public wasd!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    public keyQ!: Phaser.Input.Keyboard.Key;

    public currentWeapon: WeaponMode = 'peixeira';
    public isAttacking: boolean = false;
    public attackAngle: number = 0;
    public lastShotTime: number = 0;
    public hp: number = 100;
    public maxHp: number = 100;

    public bullets!: Phaser.Physics.Arcade.Group;

    public reloadBarGraphic!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;

        // Reload Indicator Bar
        this.reloadBarGraphic = this.scene.add.graphics();

        // Bullets Group
        this.bullets = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 20,
            runChildUpdate: true
        });

        // Shadow & Sprite
        this.shadow = this.scene.add.ellipse(x, y + 35, 40, 16, 0x000000, 0.35);
        this.sprite = this.scene.physics.add.sprite(x, y, 'cangaceiro_body');
        this.sprite.setOrigin(0.5, 0.85);
        this.sprite.setCollideWorldBounds(true);

        // Weapon Graphics
        this.peixeiraGraphic = this.scene.add.graphics();
        this.drawHugePeixeira(this.peixeiraGraphic);

        this.carabinaGraphic = this.scene.add.graphics();
        this.drawCarabina(this.carabinaGraphic);
        this.carabinaGraphic.setVisible(false);

        this.weaponContainer = this.scene.add.container(x, y - 30, [this.peixeiraGraphic, this.carabinaGraphic]);

        // HUD Health Bar & Weapon Mode Text
        this.healthBar = new HealthBar(this.scene, 20, 20, 200, 16, this.maxHp, true);
        this.modeText = this.scene.add.text(20, 45, 'WEAPON: PEIXEIRA (Press Q to switch)', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(1000);

        // Mobile Controls Initialization
        this.mobileControls = new MobileControls(
            this.scene,
            () => this.attack(() => {}),
            () => this.toggleWeaponMode()
        );

        // Controls
        if (this.scene.input.keyboard) {
            this.wasd = {
                W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            this.keyQ = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
            this.keyQ.on('down', () => this.toggleWeaponMode());
        }
    }

    private drawHugePeixeira(g: Phaser.GameObjects.Graphics) {
        g.clear();
        g.fillStyle(0x3E2723, 1);
        g.fillRect(-10, -6, 20, 12);
        g.fillStyle(0xB0BEC5, 1);
        g.fillRect(10, -12, 6, 24);

        g.fillStyle(0xCFD8DC, 1);
        g.beginPath();
        g.moveTo(16, -10);
        g.lineTo(135, -14);
        g.lineTo(145, 0);
        g.lineTo(16, 10);
        g.closePath();
        g.fill();

        g.lineStyle(3, 0xFFFFFF, 1);
        g.beginPath();
        g.moveTo(16, -10);
        g.lineTo(135, -14);
        g.lineTo(145, 0);
        g.strokePath();
    }

    private drawCarabina(g: Phaser.GameObjects.Graphics) {
        g.clear();
        // Wooden Stock & Barrel
        g.fillStyle(0x4E342E, 1);
        g.fillRect(-10, -5, 45, 10);
        g.fillStyle(0x263238, 1);
        g.fillRect(35, -3, 65, 6);
        g.fillStyle(0xFFD54F, 1); // Brass Ring
        g.fillRect(35, -4, 5, 8);
    }

    public toggleWeaponMode() {
        if (this.currentWeapon === 'peixeira') {
            this.currentWeapon = 'carabina';
            this.peixeiraGraphic.setVisible(false);
            this.carabinaGraphic.setVisible(true);
            this.modeText.setText('WEAPON: CARABINA (Press Q to switch)');
        } else {
            this.currentWeapon = 'peixeira';
            this.peixeiraGraphic.setVisible(true);
            this.carabinaGraphic.setVisible(false);
            this.modeText.setText('WEAPON: PEIXEIRA (Press Q to switch)');
        }
    }

    public update() {
        if (!this.sprite || !this.wasd) return;

        let moveX = 0;
        let moveY = 0;

        // WSAD + Left Virtual Joystick Movement
        if (this.wasd.A.isDown) moveX -= 1;
        if (this.wasd.D.isDown) moveX += 1;
        if (this.wasd.W.isDown) moveY -= 1;
        if (this.wasd.S.isDown) moveY += 1;

        if (this.mobileControls && this.mobileControls.isMoving) {
            moveX = this.mobileControls.moveVector.x;
            moveY = this.mobileControls.moveVector.y;
        }

        const speed = 220;
        const velocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
        this.sprite.setVelocity(velocity.x, velocity.y);

        this.weaponContainer.setPosition(this.sprite.x, this.sprite.y - 30);
        if (this.shadow) this.shadow.setPosition(this.sprite.x, this.sprite.y + 4);

        // Aiming Direction (Right Virtual Joystick or Mouse Pointer)
        if (this.mobileControls && this.mobileControls.isAiming) {
            this.attackAngle = this.mobileControls.aimAngle;
        } else {
            const pointer = this.scene.input.activePointer;
            const worldPointer = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.attackAngle = Phaser.Math.Angle.Between(
                this.weaponContainer.x,
                this.weaponContainer.y,
                worldPointer.x,
                worldPointer.y
            );
        }

        if (!this.isAttacking) {
            this.weaponContainer.rotation = this.attackAngle;
        }

        if (moveX < 0) this.sprite.setFlipX(true);
        else if (moveX > 0) this.sprite.setFlipX(false);

        // Draw Weapon Loading Progress Bar above character head
        this.reloadBarGraphic.clear();
        const now = this.scene.time.now;
        const cooldown = this.currentWeapon === 'carabina' ? 1000 : 400; // 1s for Carabina, 0.4s for Peixeira
        const elapsed = now - this.lastShotTime;

        if (elapsed < cooldown) {
            const progress = elapsed / cooldown;
            const barWidth = 44;
            const barHeight = 6;
            const bx = this.sprite.x - barWidth / 2;
            const by = this.sprite.y - 105; // Above head for high visibility

            // Dark Border & Background
            this.reloadBarGraphic.fillStyle(0x000000, 0.7);
            this.reloadBarGraphic.fillRect(bx - 2, by - 2, barWidth + 4, barHeight + 4);

            this.reloadBarGraphic.fillStyle(0x424242, 1);
            this.reloadBarGraphic.fillRect(bx, by, barWidth, barHeight);

            // Progress Fill Color (Golden for Carabina, Silver-White for Peixeira)
            const color = this.currentWeapon === 'carabina' ? 0xFFD54F : 0xE0E0E0;
            this.reloadBarGraphic.fillStyle(color, 1);
            this.reloadBarGraphic.fillRect(bx, by, Math.floor(barWidth * progress), barHeight);
        }
    }

    public takeDamage(amount: number) {
        this.hp = Math.max(0, this.hp - amount);
        this.healthBar.setValue(this.hp);

        this.sprite.setTint(0xFF5252);
        this.scene.time.delayedCall(150, () => {
            this.sprite.clearTint();
        });
    }

    public attack(onHitCheck: () => void) {
        if (this.currentWeapon === 'peixeira') {
            this.performPeixeiraSwipe(onHitCheck);
        } else {
            this.shootCarabina();
        }
    }

    private shootCarabina() {
        const now = this.scene.time.now;
        if (now < this.lastShotTime + 1000) return; // 1 second cooldown
        this.lastShotTime = now;

        const muzzleX = this.weaponContainer.x + Math.cos(this.attackAngle) * 90;
        const muzzleY = this.weaponContainer.y + Math.sin(this.attackAngle) * 90;

        const bullet = this.bullets.get() as Bullet;
        if (bullet) {
            bullet.fire(muzzleX, muzzleY, this.attackAngle);

            // Muzzle flash FX
            const flash = this.scene.add.circle(muzzleX, muzzleY, 12, 0xFFEB3B, 0.9);
            this.scene.time.delayedCall(50, () => flash.destroy());

            // Play Gunshot Sound Effect
            this.playGunshotSound();
        }
    }

    private playGunshotSound() {
        try {
            const ctx = (this.scene.sound as any).context as AudioContext;
            if (!ctx) return;

            const t = ctx.currentTime;

            // 1. Initial High-Frequency Gun Crack / Powder Blast
            const bufferSize = ctx.sampleRate * 0.2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(3000, t);
            noiseFilter.Q.setValueAtTime(1.5, t);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.7, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(t);

            // 2. Heavy Gun Barrel Low Thump (Pitch drop kick)
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.8, t);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(oscGain);
            oscGain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.2);
        } catch {
            // AudioContext fallback
        }
    }

    private playSlashSound() {
        try {
            const ctx = (this.scene.sound as any).context as AudioContext;
            if (!ctx) return;

            const t = ctx.currentTime;

            // White noise metallic blade whoosh
            const bufferSize = ctx.sampleRate * 0.12;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // Highpass filter for sharp steel blade cut sound
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(3500, t + 0.1);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start(t);
        } catch {
            // AudioContext fallback
        }
    }

    private performPeixeiraSwipe(onHitCheck: () => void) {
        const now = this.scene.time.now;
        if (this.isAttacking || now < this.lastShotTime + 400) return; // 0.4 second cooldown limit
        this.isAttacking = true;
        this.lastShotTime = now;

        const baseAngle = this.attackAngle;
        const halfArc = Phaser.Math.DegToRad(45);

        // Lock container orientation to pointer angle
        this.weaponContainer.rotation = baseAngle;

        // Play Peixeira Steel Slash Sound
        this.playSlashSound();

        const progressObj = { value: 0 };
        const slashGraphic = this.scene.add.graphics();
        this.weaponContainer.add(slashGraphic);
        slashGraphic.setPosition(0, 0);

        this.scene.tweens.add({
            targets: progressObj,
            value: 1,
            duration: 130,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                const currentRelAngle = -halfArc + (2 * halfArc * progressObj.value);
                this.peixeiraGraphic.rotation = currentRelAngle;

                slashGraphic.clear();
                slashGraphic.lineStyle(18, 0xE0E0E0, 0.4);
                slashGraphic.beginPath();
                slashGraphic.arc(0, 0, 145, -halfArc, currentRelAngle, false);
                slashGraphic.strokePath();

                slashGraphic.lineStyle(8, 0xFFFFFF, 0.9);
                slashGraphic.beginPath();
                slashGraphic.arc(0, 0, 140, -halfArc, currentRelAngle, false);
                slashGraphic.strokePath();

                if (progressObj.value > 0.4 && progressObj.value < 0.6) {
                    onHitCheck();
                }
            },
            onComplete: () => {
                slashGraphic.destroy();
                this.peixeiraGraphic.rotation = 0;
                this.isAttacking = false;
            }
        });
    }
}
