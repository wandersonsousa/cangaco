import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';

export class CombatSystem {
    public static checkPlayerPeixeiraHit(player: Player, enemies: Enemy[]) {
        const attackReach = 150;
        const halfArc = Phaser.Math.DegToRad(55);

        const playerX = player.sprite.x;
        const playerY = player.sprite.y - 30;
        const attackAngle = player.attackAngle;

        for (const enemy of enemies) {
            if (enemy.isDead || !enemy.sprite.active) continue;

            const enemyX = enemy.sprite.x;
            const enemyY = enemy.sprite.y - 30;

            const dist = Phaser.Math.Distance.Between(playerX, playerY, enemyX, enemyY);
            if (dist <= attackReach) {
                const angleToEnemy = Phaser.Math.Angle.Between(playerX, playerY, enemyX, enemyY);
                const angleDiff = Math.abs(Phaser.Math.Angle.Normalize(angleToEnemy - attackAngle));

                if (angleDiff <= halfArc || angleDiff >= Math.PI * 2 - halfArc) {
                    enemy.takeDamage(25);
                }
            }
        }
    }

    public static checkBulletEnemyOverlap(scene: Phaser.Scene, player: Player, enemies: Enemy[], rocks: Phaser.Physics.Arcade.StaticGroup) {
        const activeBullets = player.bullets.getChildren().filter((b) => b.active) as Bullet[];

        for (const bullet of activeBullets) {
            // Bullet vs Rock Obstacles
            scene.physics.overlap(bullet, rocks, () => {
                // Bullet hit rock effect (sparks/dust)
                const spark = scene.add.circle(bullet.x, bullet.y, 6, 0xD7CCC8, 0.8);
                scene.time.delayedCall(60, () => spark.destroy());
                bullet.kill();
            });

            if (!bullet.active) continue;

            // Bullet vs Enemies
            for (const enemy of enemies) {
                if (enemy.isDead || !enemy.sprite.active) continue;

                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.sprite.x, enemy.sprite.y - 30);
                if (dist <= 35) { // Hitbox radius collision
                    enemy.takeDamage(bullet.damage);
                    bullet.kill();
                    break;
                }
            }
        }
    }

    public static checkEnemyAttackHit(player: Player, enemy: Enemy) {
        const attackReach = 85;
        const enemyX = enemy.sprite.x;
        const enemyY = enemy.sprite.y - 30;
        const playerX = player.sprite.x;
        const playerY = player.sprite.y - 30;

        const dist = Phaser.Math.Distance.Between(enemyX, enemyY, playerX, playerY);
        if (dist <= attackReach) {
            player.takeDamage(10);
        }
    }
}
