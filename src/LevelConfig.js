/**
 * Configuration des 10 niveaux de la campagne
 */

export const LEVEL_CONFIGS = [
    // Niveau 1 - Tutoriel statique
    {
        id: 1,
        name: "Échauffement",
        description: "Cibles statiques - Apprenez les bases",
        type: "static",
        targetCount: 15,
        timeLimit: 45,
        targetHealth: 25,
        targetSpeed: 0,
        spawnInterval: 1500,
        maxTargetsAtOnce: 3,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 10,
            completion: 100,
            accuracyBonus: 50
        }
    },
    // Niveau 2 - Plus de cibles statiques
    {
        id: 2,
        name: "Concentration",
        description: "Plus de cibles, même temps",
        type: "static",
        targetCount: 25,
        timeLimit: 45,
        targetHealth: 35,
        targetSpeed: 0,
        spawnInterval: 1200,
        maxTargetsAtOnce: 4,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 20,
            completion: 200,
            accuracyBonus: 100
        }
    },
    // Niveau 3 - Mouvement lent
    {
        id: 3,
        name: "Premiers Pas",
        description: "Les cibles commencent à bouger",
        type: "moving_slow",
        targetCount: 20,
        timeLimit: 50,
        targetHealth: 40,
        targetSpeed: 1.5,
        spawnInterval: 1300,
        maxTargetsAtOnce: 4,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 30,
            completion: 300,
            accuracyBonus: 150
        }
    },
    // Niveau 4 - Introduction des bombes
    {
        id: 4,
        name: "Attention Danger",
        description: "Ne tirez pas sur les bombes !",
        type: "static",
        targetCount: 25,
        timeLimit: 50,
        targetHealth: 40,
        targetSpeed: 0,
        spawnInterval: 1200,
        maxTargetsAtOnce: 5,
        hasBombs: true,
        hasObstacles: false,
        bombChance: 0.2,
        bombPenalty: 50,
        reward: {
            perKill: 30,
            completion: 350,
            accuracyBonus: 175
        }
    },
    // Niveau 5 - Obstacles
    {
        id: 5,
        name: "Labyrinthe",
        description: "Des obstacles bloquent vos tirs",
        type: "static",
        targetCount: 30,
        timeLimit: 55,
        targetHealth: 50,
        targetSpeed: 0,
        spawnInterval: 1100,
        maxTargetsAtOnce: 5,
        hasBombs: false,
        hasObstacles: true,
        obstacleCount: 5,
        bombChance: 0,
        reward: {
            perKill: 40,
            completion: 400,
            accuracyBonus: 200
        }
    },
    // Niveau 6 - Mouvement rapide
    {
        id: 6,
        name: "Réflexes",
        description: "Cibles rapides - Restez concentré",
        type: "moving_fast",
        targetCount: 25,
        timeLimit: 50,
        targetHealth: 55,
        targetSpeed: 4,
        spawnInterval: 1200,
        maxTargetsAtOnce: 4,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 50,
            completion: 500,
            accuracyBonus: 250
        }
    },
    // Niveau 7 - Mix statique et mobile
    {
        id: 7,
        name: "Adaptation",
        description: "Mélange de cibles fixes et mobiles",
        type: "mixed",
        targetCount: 35,
        timeLimit: 60,
        targetHealth: 60,
        targetSpeed: 2.5,
        staticRatio: 0.5,
        spawnInterval: 1000,
        maxTargetsAtOnce: 6,
        hasBombs: false,
        hasObstacles: false,
        bombChance: 0,
        reward: {
            perKill: 50,
            completion: 550,
            accuracyBonus: 275
        }
    },
    // Niveau 8 - Bombes + Obstacles
    {
        id: 8,
        name: "Expert",
        description: "Bombes et obstacles combinés",
        type: "moving_slow",
        targetCount: 30,
        timeLimit: 55,
        targetHealth: 70,
        targetSpeed: 2,
        spawnInterval: 1100,
        maxTargetsAtOnce: 5,
        hasBombs: true,
        hasObstacles: true,
        obstacleCount: 4,
        bombChance: 0.25,
        bombPenalty: 75,
        reward: {
            perKill: 60,
            completion: 600,
            accuracyBonus: 300
        }
    },
    // Niveau 9 - Chaos
    {
        id: 9,
        name: "Chaos",
        description: "Tout combiné - Survivez !",
        type: "chaos",
        targetCount: 40,
        timeLimit: 65,
        targetHealth: 80,
        targetSpeed: 3.5,
        speedVariation: 2,
        spawnInterval: 900,
        maxTargetsAtOnce: 7,
        hasBombs: true,
        hasObstacles: true,
        obstacleCount: 6,
        bombChance: 0.2,
        bombPenalty: 100,
        reward: {
            perKill: 70,
            completion: 700,
            accuracyBonus: 350
        }
    },
    // Niveau 10 - Boss Final
    {
        id: 10,
        name: "Confrontation Finale",
        description: "Éliminez le Boss pour terminer",
        type: "boss",
        targetCount: 50,
        timeLimit: 90,
        targetHealth: 100,
        targetSpeed: 3,
        spawnInterval: 1000,
        maxTargetsAtOnce: 6,
        hasBombs: true,
        hasObstacles: true,
        obstacleCount: 4,
        bombChance: 0.15,
        bombPenalty: 100,
        boss: {
            health: 500,
            size: 2.5,
            speed: 1.5,
            spawnAfterKills: 40
        },
        reward: {
            perKill: 80,
            completion: 1500,
            accuracyBonus: 500,
            bossKill: 1000
        }
    }
];

/**
 * Configuration des upgrades du joueur
 */
export const UPGRADE_CONFIGS = {
    damage: {
        name: "Dégâts",
        icon: "⚔️",
        baseValue: 25,
        maxLevel: 5,
        values: [25, 40, 55, 75, 100],
        costs: [0, 100, 200, 350, 500]
    },
    fireRate: {
        name: "Cadence",
        icon: "🔥",
        baseValue: 300,
        maxLevel: 5,
        values: [300, 250, 200, 150, 100], // ms entre tirs (plus bas = mieux)
        costs: [0, 150, 300, 450, 600]
    },
    magSize: {
        name: "Chargeur",
        icon: "🔫",
        baseValue: 10,
        maxLevel: 5,
        values: [10, 15, 20, 25, 30],
        costs: [0, 200, 350, 550, 800]
    },
    reloadSpeed: {
        name: "Rechargement",
        icon: "⚡",
        baseValue: 2000,
        maxLevel: 5,
        values: [2000, 1600, 1200, 800, 500], // ms (plus bas = mieux)
        costs: [0, 150, 300, 450, 600]
    }
};

/**
 * Obtenir la config d'un niveau par son ID
 */
export function getLevelConfig(levelId) {
    return LEVEL_CONFIGS.find(l => l.id === levelId) || null;
}

/**
 * Calculer le coût total pour upgrader une stat au niveau suivant
 */
export function getUpgradeCost(statName, currentLevel) {
    const config = UPGRADE_CONFIGS[statName];
    if (!config || currentLevel >= config.maxLevel) return null;
    return config.costs[currentLevel];
}

/**
 * Obtenir la valeur d'une stat pour un niveau donné
 */
export function getStatValue(statName, level) {
    const config = UPGRADE_CONFIGS[statName];
    if (!config) return null;
    return config.values[Math.min(level, config.maxLevel - 1)];
}
