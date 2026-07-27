import Phaser from 'phaser';
import { HealthBar } from './HealthBar';

export class Enemy {
    public id: string;
    public scene: Phaser.Scene;
    public sprite: Phaser.Physics.Arcade.Sprite;
    public shadow: Phaser.GameObjects.Ellipse;
    public weaponContainer: Phaser.GameObjects.Container;
    public weaponGraphic: Phaser.GameObjects.Graphics;
    public healthBar: HealthBar;

    public targetPos: Phaser.Math.Vector2;
    public nextDecisionTime: number = 0;
    public lastAttackTime: number = 0;
    public isAttacking: boolean = false;
    public isDead: boolean = false;

    public hp: number = 100;
    public maxHp: number = 100;

    constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
        this.scene = scene;
        this.id = id;

        this.shadow = this.scene.add.ellipse(x, y + 35, 40, 16, 0x000000, 0.35);
        this.sprite = this.scene.physics.add.sprite(x, y, 'enemy_volante');
        this.sprite.setOrigin(0.5, 0.85);
        this.sprite.setCollideWorldBounds(true);

        this.weaponGraphic = this.scene.add.graphics();
        this.drawEnemyDagger(this.weaponGraphic);
        this.weaponContainer = this.scene.add.container(x, y - 30, [this.weaponGraphic]);

        // Floating Health Bar above head
        this.healthBar = new HealthBar(this.scene, x - 25, y - 90, 50, 6, this.maxHp, false);

        this.targetPos = new Phaser.Math.Vector2(x, y);
    }

    private drawEnemyDagger(g: Phaser.GameObjects.Graphics) {
        g.clear();
        g.fillStyle(0x212121, 1);
        g.fillRect(-6, -4, 14, 8);

        g.fillStyle(0x78909C, 1);
        g.beginPath();
        g.moveTo(8, -6);
        g.lineTo(65, -8);
        g.lineTo(72, 0);
        g.lineTo(8, 6);
        g.closePath();
        g.fill();
    }

    public update(time: number, playerX: number, playerY: number, onAttackPlayer: () => void) {
        if (this.isDead || !this.sprite.active) return;

        this.weaponContainer.setPosition(this.sprite.x, this.sprite.y - 30);
        this.shadow.setPosition(this.sprite.x, this.sprite.y + 4);
        this.healthBar.setPosition(this.sprite.x - 25, this.sprite.y - 90);

        const distToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            playerX,
            playerY
        );

        if (distToPlayer < 280) {
            const angleToPlayer = Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                playerX,
                playerY
            );

            if (!this.isAttacking) {
                this.weaponContainer.rotation = angleToPlayer;
            }

            if (distToPlayer > 60) {
                const pursueVel = new Phaser.Math.Vector2(
                    Math.cos(angleToPlayer),
                    Math.sin(angleToPlayer)
                ).scale(140);
                this.sprite.setVelocity(pursueVel.x, pursueVel.y);
            } else {
                this.sprite.setVelocity(0, 0);
                if (time > this.lastAttackTime + 1400) {
                    this.lastAttackTime = time;
                    this.performAttack(angleToPlayer, onAttackPlayer);
                }
            }
        } else {
            // Wandering
            if (time > this.nextDecisionTime) {
                this.nextDecisionTime = time + Phaser.Math.Between(2000, 4500);
                this.targetPos.x = Phaser.Math.Clamp(
                    this.sprite.x + Phaser.Math.Between(-150, 150),
                    100,
                    1900
                );
                this.targetPos.y = Phaser.Math.Clamp(
                    this.sprite.y + Phaser.Math.Between(-150, 150),
                    100,
                    1900
                );
            }

            const distToTarget = Phaser.Math.Distance.Between(
                this.sprite.x,
                this.sprite.y,
                this.targetPos.x,
                this.targetPos.y
            );

            if (distToTarget > 15) {
                const wanderAngle = Phaser.Math.Angle.Between(
                    this.sprite.x,
                    this.sprite.y,
                    this.targetPos.x,
                    this.targetPos.y
                );
                const wanderVel = new Phaser.Math.Vector2(
                    Math.cos(wanderAngle),
                    Math.sin(wanderAngle)
                ).scale(80);
                this.sprite.setVelocity(wanderVel.x, wanderVel.y);

                if (!this.isAttacking) {
                    this.weaponContainer.rotation = wanderAngle;
                }
            } else {
                this.sprite.setVelocity(0, 0);
            }
        }

        if (this.sprite.body && this.sprite.body.velocity.x < 0) {
            this.sprite.setFlipX(true);
        } else if (this.sprite.body && this.sprite.body.velocity.x > 0) {
            this.sprite.setFlipX(false);
        }
    }

    public takeDamage(amount: number): boolean {
        this.hp = Math.max(0, this.hp - amount);
        this.healthBar.setValue(this.hp);

        // Flash Red
        this.sprite.setTint(0xFF1744);
        this.scene.time.delayedCall(150, () => {
            if (this.sprite.active) this.sprite.clearTint();
        });

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    private die() {
        this.isDead = true;
        this.healthBar.destroy();
        this.shadow.destroy();
        this.weaponContainer.destroy();

        // Death fade animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    private performAttack(angleToPlayer: number, onHit: () => void) {
        if (this.isAttacking) return;
        this.isAttacking = true;

        const halfArc = Phaser.Math.DegToRad(40);
        this.weaponContainer.rotation = angleToPlayer;

        const progressObj = { value: 0 };
        const slashGraphic = this.scene.add.graphics();
        this.weaponContainer.add(slashGraphic);

        this.scene.tweens.add({
            targets: progressObj,
            value: 1,
            duration: 160,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                const currentRelAngle = -halfArc + (2 * halfArc * progressObj.value);
                this.weaponGraphic.rotation = currentRelAngle;

                slashGraphic.clear();
                slashGraphic.lineStyle(10, 0xEF5350, 0.7);
                slashGraphic.beginPath();
                slashGraphic.arc(0, 0, 75, -halfArc, currentRelAngle, false);
                slashGraphic.strokePath();

                if (progressObj.value > 0.4 && progressObj.value < 0.6) {
                    onHit();
                }
            },
            onComplete: () => {
                slashGraphic.destroy();
                this.weaponGraphic.rotation = 0;
                this.isAttacking = false;
            }
        });
    }
}
