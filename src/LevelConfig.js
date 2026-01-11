/**
 * Configuration des 10 niveaux de la campagne
 * Équilibrage : progression TRÈS lente, récompenses faibles
 */

export const LEVEL_CONFIGS = [
    // Niveau 1 - Tutoriel
    {
        id: 1,
        name: "Initiation",
        description: "Apprenez les bases du tir",
        type: "static",
        targetCount: 12,
        timeLimit: 30, // -10s
        targetHealth: 30,
        targetSpeed: 0,
        spawnInterval: 1800,
        maxTargetsAtOnce: 2,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 3,
            completion: 20,
            accuracyBonus: 10
        },
        hazards: { count: 0, speed: 0, damage: 0 }
    },
    // Niveau 2 - Endurance
    {
        id: 2,
        name: "Endurance",
        description: "Esquivez les missiles !",
        type: "static",
        targetCount: 20,
        timeLimit: 35, // -10s
        targetHealth: 40,
        targetSpeed: 0,
        spawnInterval: 1400,
        maxTargetsAtOnce: 3,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 3,
            completion: 25,
            accuracyBonus: 15
        },
        hazards: { count: 1, speed: 1.5, damage: 10 }
    },
    // Niveau 3 - Tailles variables
    {
        id: 3,
        name: "Perspectives",
        description: "Esquivez les projectiles !",
        type: "static",
        targetCount: 20,
        timeLimit: 45, // -10s
        targetHealth: 40,
        targetSpeed: 0,
        spawnInterval: 1300,
        maxTargetsAtOnce: 4,
        variableSize: true,
        minScale: 0.4,
        maxScale: 1.8,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 4,
            completion: 35,
            accuracyBonus: 18
        },
        hazards: { count: 2, speed: 2.0, damage: 15 }
    },
    // Niveau 4 - Mouvement lent
    {
        id: 4,
        name: "Traque",
        description: "Attention aux tirs ennemis !",
        type: "moving_slow",
        targetCount: 22,
        timeLimit: 45, // -10s
        targetHealth: 50,
        targetSpeed: 2,
        spawnInterval: 1200,
        maxTargetsAtOnce: 4,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 4,
            completion: 45,
            accuracyBonus: 20
        },
        hazards: { count: 3, speed: 2.2, damage: 15 }
    },
    // Niveau 5 - Éphémères + Bombes
    {
        id: 5,
        name: "Champ de Mines",
        description: "Bombes + Missiles !",
        type: "ephemeral",
        targetCount: 22,
        timeLimit: 45, // -15s
        targetHealth: 35,
        targetSpeed: 0,
        spawnInterval: 800,
        maxTargetsAtOnce: 5,
        ephemeralDuration: 1.8,
        hasBombs: true,
        hasObstacles: false,
        bombChance: 0.25,
        bombInstantLoss: true,
        reward: {
            perKill: 5,
            completion: 60,
            accuracyBonus: 30
        },
        hazards: { count: 4, speed: 2.5, damage: 20 }
    },
    // Niveau 6 - Vitesse
    {
        id: 6,
        name: "Poursuite",
        description: "Survivre aux vagues de missiles",
        type: "moving_fast",
        targetCount: 22,
        timeLimit: 45, // -10s
        targetHealth: 60,
        targetSpeed: 4.5,
        spawnInterval: 1300,
        maxTargetsAtOnce: 4,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 5,
            completion: 65,
            accuracyBonus: 35
        },
        hazards: { count: 5, speed: 3.0, damage: 20 }
    },
    // Niveau 7 - Tailles variables + mouvement
    {
        id: 7,
        name: "Aberrations",
        description: "Restez mobile pour survivre",
        type: "mixed",
        targetCount: 28,
        timeLimit: 50, // -15s
        targetHealth: 55,
        targetSpeed: 2.5,
        staticRatio: 0.3,
        spawnInterval: 1100,
        maxTargetsAtOnce: 5,
        variableSize: true,
        minScale: 0.3,
        maxScale: 2.2,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 6,
            completion: 80,
            accuracyBonus: 40
        },
        hazards: { count: 6, speed: 3.5, damage: 25 }
    },
    // Niveau 8 - Vitesse extrême
    {
        id: 8,
        name: "Fulgurance",
        description: "Pluie de projectiles !",
        type: "moving_fast",
        targetCount: 30,
        timeLimit: 50, // -15s
        targetHealth: 65,
        targetSpeed: 5,
        spawnInterval: 900,
        maxTargetsAtOnce: 6,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 6,
            completion: 90,
            accuracyBonus: 45
        },
        hazards: { count: 7, speed: 4.0, damage: 25 }
    },
    // Niveau 9 - Chaos
    {
        id: 9,
        name: "Pandémonium",
        description: "Esquivez tout, tirez sur tout",
        type: "chaos",
        targetCount: 35,
        timeLimit: 55, // -15s
        targetHealth: 55,
        targetSpeed: 3.5,
        speedVariation: 2,
        spawnInterval: 800,
        maxTargetsAtOnce: 7,
        ephemeralChance: 0.35,
        ephemeralDuration: 1.3,
        hasBombs: true,
        hasObstacles: false,
        bombChance: 0.2,
        bombInstantLoss: true,
        reward: {
            perKill: 8,
            completion: 100,
            accuracyBonus: 50
        },
        hazards: { count: 8, speed: 4.5, damage: 30 }
    },
    // Niveau 10 - Final
    {
        id: 10,
        name: "Jugement Dernier",
        description: "SURVIVEZ AUX MISSILES !",
        type: "chaos",
        targetCount: 45,
        timeLimit: 70, // -20s
        targetHealth: 80,
        targetSpeed: 4,
        speedVariation: 2.5,
        spawnInterval: 700,
        maxTargetsAtOnce: 8,
        ephemeralChance: 0.3,
        ephemeralDuration: 1.5,
        hasBombs: true,
        hasObstacles: false,
        bombChance: 0.25,
        bombInstantLoss: true,
        reward: {
            perKill: 10,
            completion: 150,
            accuracyBonus: 80
        },
        hazards: { count: 10, speed: 5.0, damage: 35 }
    }
];

/**
 * Configuration des upgrades du joueur
 * 8 paliers avec progression TRÈS lente - coûts élevés
 */
export const UPGRADE_CONFIGS = {
    damage: {
        name: "Dégâts",
        icon: "⚔️",
        baseValue: 20,
        maxLevel: 8,
        values: [20, 28, 36, 45, 55, 66, 80, 100],
        costs: [0, 150, 350, 600, 900, 1300, 1800, 2500]
    },
    fireRate: {
        name: "Cadence",
        icon: "🔥",
        baseValue: 350,
        maxLevel: 8,
        values: [350, 310, 270, 235, 200, 170, 140, 100], // ms entre tirs
        costs: [0, 180, 400, 700, 1050, 1500, 2000, 2700]
    },
    magSize: {
        name: "Chargeur",
        icon: "🔫",
        baseValue: 8,
        maxLevel: 8,
        values: [8, 10, 12, 15, 18, 22, 26, 32],
        costs: [0, 200, 450, 750, 1100, 1600, 2200, 3000]
    },
    reloadSpeed: {
        name: "Rechargement",
        icon: "⚡",
        baseValue: 2500,
        maxLevel: 8,
        values: [2500, 2200, 1900, 1600, 1350, 1100, 850, 500], // ms
        costs: [0, 160, 380, 650, 1000, 1450, 1950, 2600]
    },
    maxHealth: {
        name: "Santé Max",
        icon: "❤️",
        baseValue: 100,
        maxLevel: 8,
        values: [100, 125, 150, 180, 220, 270, 330, 400],
        costs: [0, 300, 600, 1000, 1500, 2200, 3000, 4000]
    }
};

/**
 * Obtenir la config d'un niveau par son ID
 */
export function getLevelConfig(levelId) {
    return LEVEL_CONFIGS.find(l => l.id === levelId) || null;
}

/**
 * Calculer le coût pour upgrader une stat au niveau suivant
 */
export function getUpgradeCost(statName, currentLevel) {
    const config = UPGRADE_CONFIGS[statName];
    if (!config || currentLevel >= config.maxLevel - 1) return null;
    return config.costs[currentLevel + 1];
}

/**
 * Obtenir la valeur d'une stat pour un niveau donné
 */
export function getStatValue(statName, level) {
    const config = UPGRADE_CONFIGS[statName];
    if (!config) return null;
    return config.values[Math.min(level, config.maxLevel - 1)];
}
