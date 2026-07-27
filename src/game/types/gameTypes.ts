export interface EntityState {
    id: string;
    x: number;
    y: number;
    rotation: number;
    hp: number;
    maxHp: number;
    isAttacking: boolean;
}

export interface DamagePayload {
    attackerId: string;
    targetId: string;
    damage: number;
}

export interface RockData {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
