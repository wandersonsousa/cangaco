import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';

export class Game extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private rocksGroup!: Phaser.Physics.Arcade.StaticGroup;

    // Logical world coordinates for backend sync
    public playerWorldPos = { x: 1000, y: 1000 };

    constructor() {
        super('Game');
    }

    create() {
        const width = 2000;
        const height = 2000;

        // Dark void background outside map limits
        this.cameras.main.setBackgroundColor(0x1B120C);

        // 1. Sertão / Caatinga Arid Terrain Playable Area
        const graphics = this.add.graphics();

        // Main playable terrain background
        graphics.fillStyle(0xBF8B5E, 1);
        graphics.fillRect(0, 0, width, height);

        const rng = new Phaser.Math.RandomDataGenerator(['caatinga_seed']);

        // Earth cracks
        graphics.lineStyle(1, 0x8C5A32, 0.4);
        for (let i = 0; i < 300; i++) {
            const rx = rng.between(0, width);
            const ry = rng.between(0, height);
            graphics.lineBetween(rx, ry, rx + rng.between(-20, 20), ry + rng.between(-20, 20));
        }

        // Isometric grid overlay
        graphics.lineStyle(1, 0x9E6F45, 0.35);
        const tileSize = 64;
        for (let x = 0; x <= width; x += tileSize) {
            graphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y <= height; y += tileSize) {
            graphics.lineBetween(0, y, width, y);
        }

        // Caatinga Cacti (Mandacaru)
        for (let i = 0; i < 50; i++) {
            const cx = rng.between(100, width - 100);
            const cy = rng.between(100, height - 100);
            graphics.fillStyle(0x2E7D32, 1);
            graphics.fillRect(cx - 3, cy - 25, 6, 25);
            graphics.fillRect(cx - 10, cy - 18, 8, 4);
            graphics.fillRect(cx - 10, cy - 22, 4, 8);
            graphics.fillRect(cx + 2, cy - 14, 8, 4);
            graphics.fillRect(cx + 6, cy - 18, 4, 8);
        }

        // Clear Map Limit Boundaries (Dark Outer Border & Wooden Fence Line)
        // Outer dark shadow border
        graphics.lineStyle(16, 0x110B07, 0.9);
        graphics.strokeRect(0, 0, width, height);

        // Heavy Wooden Fence Posts & Rails around entire map perimeter
        graphics.lineStyle(6, 0x4E342E, 1);
        graphics.strokeRect(8, 8, width - 16, height - 16);
        graphics.strokeRect(16, 16, width - 32, height - 32);

        // Fence Corner Posts
        const postSize = 20;
        graphics.fillStyle(0x3E2723, 1);
        for (let x = 8; x <= width - 24; x += 100) {
            graphics.fillRect(x, 2, postSize, postSize);
            graphics.fillRect(x, height - 22, postSize, postSize);
        }
        for (let y = 8; y <= height - 24; y += 100) {
            graphics.fillRect(2, y, postSize, postSize);
            graphics.fillRect(width - 22, y, postSize, postSize);
        }

        // 2. Build Player, Enemy & Rock Textures
        this.generateTextures();

        // 3. Create Rock Obstacles Static Physics Group
        this.rocksGroup = this.physics.add.staticGroup();
        this.spawnRockObstacles();

        // 4. Initialize Player Entity & Collisions
        this.player = new Player(this, this.playerWorldPos.x, this.playerWorldPos.y);
        this.physics.add.collider(this.player.sprite, this.rocksGroup);

        // 5. Spawn AI Enemies & Collisions
        this.spawnEnemies(20);
        for (const enemy of this.enemies) {
            this.physics.add.collider(enemy.sprite, this.rocksGroup);
        }

        // Camera setup
        this.cameras.main.setBounds(0, 0, width, height);
        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

        // 6. Left Click Attack Handler
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.player.attack(() => {
                    CombatSystem.checkPlayerPeixeiraHit(this.player, this.enemies);
                });
            }
        });
    }

    private generateTextures() {
        // Rock Obstacle Texture (Fills 2x2 grid blocks - 128x128px)
        if (!this.textures.exists('rock_obstacle_texture')) {
            const canvas = this.textures.createCanvas('rock_obstacle_texture', 135, 135);
            if (canvas) {
                const ctx = canvas.context;
                // Ground Shadow underneath
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.ellipse(67, 115, 60, 16, 0, 0, Math.PI * 2);
                ctx.fill();

                // Main Massive Rock Body (Fills almost 128x128 block area)
                ctx.fillStyle = '#5D4037';
                ctx.beginPath();
                ctx.moveTo(12, 35);
                ctx.lineTo(67, 12);
                ctx.lineTo(124, 38);
                ctx.lineTo(126, 105);
                ctx.lineTo(67, 122);
                ctx.lineTo(8, 100);
                ctx.closePath();
                ctx.fill();

                // Top Face Shading
                ctx.fillStyle = '#795548';
                ctx.beginPath();
                ctx.moveTo(14, 37);
                ctx.lineTo(67, 14);
                ctx.lineTo(120, 40);
                ctx.lineTo(67, 70);
                ctx.closePath();
                ctx.fill();

                // Dark Outline & Cracks
                ctx.strokeStyle = '#3E2723';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(12, 35);
                ctx.lineTo(67, 12);
                ctx.lineTo(124, 38);
                ctx.lineTo(126, 105);
                ctx.lineTo(67, 122);
                ctx.lineTo(8, 100);
                ctx.closePath();
                ctx.stroke();

                // Inner rock cracks
                ctx.beginPath();
                ctx.moveTo(40, 45); ctx.lineTo(67, 85);
                ctx.moveTo(85, 38); ctx.lineTo(95, 80);
                ctx.stroke();

                canvas.refresh();
            }
        }
        // Bullet Texture
        if (!this.textures.exists('bullet_texture')) {
            const canvas = this.textures.createCanvas('bullet_texture', 12, 6);
            if (canvas) {
                const ctx = canvas.context;
                ctx.fillStyle = '#FFD54F'; // Golden bullet
                ctx.fillRect(0, 0, 12, 6);
                canvas.refresh();
            }
        }

        // Player Cangaceiro Texture
        if (!this.textures.exists('cangaceiro_body')) {
            const canvas = this.textures.createCanvas('cangaceiro_body', 100, 110);
            if (canvas) {
                const ctx = canvas.context;

                // Body Coat
                ctx.fillStyle = '#4A2E18';
                ctx.beginPath();
                ctx.roundRect(30, 42, 34, 42, [10, 10, 4, 4]);
                ctx.fill();

                // Silver Shoulders
                ctx.fillStyle = '#B0BEC5';
                ctx.fillRect(22, 42, 10, 14);
                ctx.fillRect(62, 42, 10, 14);

                // Bandoleiras
                ctx.strokeStyle = '#2D1B0E';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(30, 46); ctx.lineTo(64, 80);
                ctx.moveTo(64, 46); ctx.lineTo(30, 80);
                ctx.stroke();

                // Red Scarf
                ctx.fillStyle = '#D32F2F';
                ctx.beginPath();
                ctx.arc(46, 40, 12, 0, Math.PI);
                ctx.fill();

                // Head
                ctx.fillStyle = '#D7CCC8';
                ctx.beginPath();
                ctx.arc(46, 30, 12, 0, Math.PI * 2);
                ctx.fill();

                // Mustache & Eyes
                ctx.fillStyle = '#1A0D00';
                ctx.beginPath();
                ctx.arc(42, 32, 3, 0, Math.PI * 2);
                ctx.arc(50, 32, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(38, 36, 16, 4);

                // Hat
                ctx.fillStyle = '#6D4C41';
                ctx.beginPath();
                ctx.ellipse(46, 22, 26, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4E342E';
                ctx.beginPath();
                ctx.arc(46, 18, 14, Math.PI, 0);
                ctx.fill();

                // Star
                ctx.fillStyle = '#ECEFF1';
                ctx.beginPath();
                ctx.arc(46, 18, 4, 0, Math.PI * 2);
                ctx.fill();

                // Boots
                ctx.fillStyle = '#CFD8DC';
                ctx.fillRect(32, 84, 10, 16);
                ctx.fillRect(50, 84, 10, 16);

                canvas.refresh();
            }
        }

        // Enemy Volante Texture
        if (!this.textures.exists('enemy_volante')) {
            const canvas = this.textures.createCanvas('enemy_volante', 100, 110);
            if (canvas) {
                const ctx = canvas.context;
                ctx.fillStyle = '#37474F';
                ctx.beginPath();
                ctx.roundRect(30, 42, 34, 42, [10, 10, 4, 4]);
                ctx.fill();

                ctx.fillStyle = '#FBC02D';
                ctx.fillRect(44, 44, 6, 36);

                ctx.fillStyle = '#C62828';
                ctx.fillRect(22, 42, 10, 12);
                ctx.fillRect(62, 42, 10, 12);

                ctx.fillStyle = '#D7CCC8';
                ctx.beginPath();
                ctx.arc(46, 30, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(42, 32, 2.5, 0, Math.PI * 2);
                ctx.arc(50, 32, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#37474F';
                ctx.fillRect(36, 36, 20, 8);

                ctx.fillStyle = '#263238';
                ctx.beginPath();
                ctx.arc(46, 20, 16, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#111111';
                ctx.fillRect(32, 22, 28, 5);

                ctx.fillStyle = '#212121';
                ctx.fillRect(32, 84, 10, 16);
                ctx.fillRect(50, 84, 10, 16);

                canvas.refresh();
            }
        }
    }

    private spawnRockObstacles() {
        // Fixed map rock locations (Ready for backend sync)
        const fixedRockPositions = [
            { id: 'rock_1', x: 450, y: 450 },
            { id: 'rock_2', x: 1550, y: 450 },
            { id: 'rock_3', x: 500, y: 1500 },
            { id: 'rock_4', x: 1500, y: 1550 },
            { id: 'rock_5', x: 950, y: 400 },
            { id: 'rock_6', x: 400, y: 950 },
            { id: 'rock_7', x: 1600, y: 950 },
            { id: 'rock_8', x: 950, y: 1600 },
            { id: 'rock_9', x: 650, y: 700 },
            { id: 'rock_10', x: 1350, y: 1250 }
        ];

        for (const rData of fixedRockPositions) {
            const rock = this.rocksGroup.create(rData.x, rData.y, 'rock_obstacle_texture') as Phaser.Physics.Arcade.Sprite;
            // Physics bounding box matching 2x2 grid block size (128x128 footprint)
            rock.setSize(120, 110);
            rock.setOffset(8, 12);
            rock.setImmovable(true);
            rock.refreshBody();
        }
    }

    private spawnEnemies(count: number) {
        const spawnPoints = [
            { x: 700, y: 700 },
            { x: 1300, y: 700 },
            { x: 700, y: 1300 },
            { x: 1300, y: 1300 },
            { x: 1000, y: 500 }
        ];

        for (let i = 0; i < count; i++) {
            const pos = spawnPoints[i % spawnPoints.length];
            const enemy = new Enemy(this, `enemy_${i}`, pos.x, pos.y);
            this.enemies.push(enemy);
        }
    }

    update(time: number) {
        if (!this.player) return;

        // Delegate update to Player
        this.player.update();
        this.playerWorldPos.x = this.player.sprite.x;
        this.playerWorldPos.y = this.player.sprite.y;

        // Bullet-Enemy & Bullet-Rock collision check
        CombatSystem.checkBulletEnemyOverlap(this, this.player, this.enemies, this.rocksGroup);

        // Delegate update to Enemies & handle enemy hit on player
        for (const enemy of this.enemies) {
            enemy.update(time, this.player.sprite.x, this.player.sprite.y, () => {
                CombatSystem.checkEnemyAttackHit(this.player, enemy);
            });
        }
    }

    public setServerPosition(x: number, y: number) {
        this.playerWorldPos.x = x;
        this.playerWorldPos.y = y;
        if (this.player) {
            this.player.sprite.setPosition(x, y);
        }
    }
}