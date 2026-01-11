import { LEVEL_CONFIGS, UPGRADE_CONFIGS, getLevelConfig, getUpgradeCost, getStatValue } from './LevelConfig.js';

/**
 * Gestionnaire de la campagne
 * Gère la progression, l'argent, les stats et la sauvegarde
 */
export class CampaignManager {
    constructor() {
        this.STORAGE_KEY = 'aimthree_campaign';
        
        // État par défaut
        this.defaultState = {
            unlockedLevel: 1,
            money: 0,
            statLevels: {
                damage: 0,
                fireRate: 0,
                magSize: 0,
                reloadSpeed: 0
            },
            levelStats: {} // Stats par niveau (meilleur score, etc.)
        };
        
        // Charger la progression
        this.state = this.loadProgress();
        
        // État de la partie en cours
        this.currentLevel = null;
        this.currentConfig = null;
        this.killCount = 0;
        this.moneyEarned = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.startTime = 0;
        this.bossSpawned = false;
        this.bossKilled = false;
    }
    
    /**
     * Charger la progression depuis localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Fusionner avec les valeurs par défaut pour gérer les nouvelles propriétés
                return { ...this.defaultState, ...parsed };
            }
        } catch (e) {
            console.warn('Erreur chargement sauvegarde campagne:', e);
        }
        return { ...this.defaultState };
    }
    
    /**
     * Sauvegarder la progression
     */
    saveProgress() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('Erreur sauvegarde campagne:', e);
        }
    }
    
    /**
     * Réinitialiser la progression (nouvelle partie)
     */
    resetProgress() {
        this.state = { ...this.defaultState };
        this.saveProgress();
    }
    
    /**
     * Obtenir les stats actuelles du joueur
     */
    getPlayerStats() {
        return {
            damage: getStatValue('damage', this.state.statLevels.damage),
            fireRate: getStatValue('fireRate', this.state.statLevels.fireRate),
            magSize: getStatValue('magSize', this.state.statLevels.magSize),
            reloadSpeed: getStatValue('reloadSpeed', this.state.statLevels.reloadSpeed)
        };
    }
    
    /**
     * Obtenir l'argent actuel
     */
    getMoney() {
        return this.state.money;
    }
    
    /**
     * Ajouter de l'argent
     */
    addMoney(amount) {
        this.state.money += amount;
        this.saveProgress();
    }
    
    /**
     * Vérifier si on peut acheter un upgrade
     */
    canPurchaseUpgrade(statName) {
        const currentLevel = this.state.statLevels[statName];
        const cost = getUpgradeCost(statName, currentLevel);
        
        if (cost === null) return { can: false, reason: 'max' };
        if (this.state.money < cost) return { can: false, reason: 'money', cost };
        return { can: true, cost };
    }
    
    /**
     * Acheter un upgrade
     */
    purchaseUpgrade(statName) {
        const check = this.canPurchaseUpgrade(statName);
        if (!check.can) return false;
        
        this.state.money -= check.cost;
        this.state.statLevels[statName]++;
        this.saveProgress();
        return true;
    }
    
    /**
     * Obtenir le niveau d'une stat
     */
    getStatLevel(statName) {
        return this.state.statLevels[statName] || 0;
    }
    
    /**
     * Vérifier si un niveau est débloqué
     */
    isLevelUnlocked(levelId) {
        return levelId <= this.state.unlockedLevel;
    }
    
    /**
     * Débloquer le niveau suivant
     */
    unlockNextLevel() {
        if (this.state.unlockedLevel < LEVEL_CONFIGS.length) {
            this.state.unlockedLevel++;
            this.saveProgress();
        }
    }
    
    /**
     * Démarrer un niveau
     */
    startLevel(levelId) {
        if (!this.isLevelUnlocked(levelId)) return false;
        
        this.currentLevel = levelId;
        this.currentConfig = getLevelConfig(levelId);
        this.killCount = 0;
        this.moneyEarned = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.startTime = Date.now();
        this.bossSpawned = false;
        this.bossKilled = false;
        
        return this.currentConfig;
    }
    
    /**
     * Enregistrer un kill
     */
    registerKill(isBoss = false) {
        this.killCount++;
        
        const reward = this.currentConfig.reward;
        let moneyGained = reward.perKill * this.currentLevel;
        
        if (isBoss && reward.bossKill) {
            moneyGained += reward.bossKill;
            this.bossKilled = true;
        }
        
        this.moneyEarned += moneyGained;
        
        return {
            killCount: this.killCount,
            moneyGained,
            totalMoney: this.moneyEarned,
            shouldSpawnBoss: this.currentConfig.boss && 
                             this.killCount >= this.currentConfig.boss.spawnAfterKills &&
                             !this.bossSpawned
        };
    }
    
    /**
     * Enregistrer un tir
     */
    registerShot(hit) {
        this.shotsFired++;
        if (hit) this.shotsHit++;
    }
    
    /**
     * Enregistrer une pénalité (bombe touchée)
     */
    registerBombHit() {
        const penalty = this.currentConfig.bombPenalty || 50;
        this.moneyEarned = Math.max(0, this.moneyEarned - penalty);
        return penalty;
    }
    
    /**
     * Vérifier si le niveau est réussi
     */
    checkLevelComplete() {
        const targetMet = this.killCount >= this.currentConfig.targetCount;
        const bossReq = !this.currentConfig.boss || this.bossKilled;
        return targetMet && bossReq;
    }
    
    /**
     * Obtenir le temps écoulé
     */
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    /**
     * Obtenir le temps restant
     */
    getTimeRemaining() {
        const elapsed = this.getElapsedTime();
        return Math.max(0, this.currentConfig.timeLimit - elapsed);
    }
    
    /**
     * Terminer le niveau (victoire ou défaite)
     */
    endLevel(victory) {
        const accuracy = this.shotsFired > 0 
            ? (this.shotsHit / this.shotsFired * 100) 
            : 0;
        
        let totalReward = this.moneyEarned;
        
        if (victory) {
            // Bonus de complétion
            totalReward += this.currentConfig.reward.completion;
            
            // Bonus de précision (si > 80%)
            if (accuracy >= 80) {
                totalReward += this.currentConfig.reward.accuracyBonus;
            }
            
            // Débloquer le niveau suivant
            if (this.currentLevel === this.state.unlockedLevel) {
                this.unlockNextLevel();
            }
        }
        
        // Ajouter l'argent gagné
        this.addMoney(totalReward);
        
        // Sauvegarder les stats du niveau
        this.state.levelStats[this.currentLevel] = {
            completed: victory,
            bestKills: Math.max(
                this.killCount,
                this.state.levelStats[this.currentLevel]?.bestKills || 0
            ),
            bestAccuracy: Math.max(
                accuracy,
                this.state.levelStats[this.currentLevel]?.bestAccuracy || 0
            )
        };
        this.saveProgress();
        
        const result = {
            victory,
            level: this.currentLevel,
            levelName: this.currentConfig.name,
            kills: this.killCount,
            targetCount: this.currentConfig.targetCount,
            accuracy: accuracy.toFixed(1),
            moneyEarned: totalReward,
            totalMoney: this.state.money,
            nextLevelUnlocked: victory && this.currentLevel < LEVEL_CONFIGS.length
        };
        
        // Reset état courant
        this.currentLevel = null;
        this.currentConfig = null;
        
        return result;
    }
    
    /**
     * Obtenir les infos d'upgrade pour l'UI
     */
    getUpgradeInfo(statName) {
        const config = UPGRADE_CONFIGS[statName];
        const currentLevel = this.state.statLevels[statName];
        const currentValue = getStatValue(statName, currentLevel);
        const nextValue = currentLevel < config.maxLevel - 1 
            ? getStatValue(statName, currentLevel + 1) 
            : null;
        const cost = getUpgradeCost(statName, currentLevel);
        
        return {
            name: config.name,
            icon: config.icon,
            currentLevel: currentLevel + 1, // Affichage 1-indexed
            maxLevel: config.maxLevel,
            currentValue,
            nextValue,
            cost,
            isMaxed: currentLevel >= config.maxLevel - 1,
            canAfford: cost !== null && this.state.money >= cost
        };
    }
    
    /**
     * Obtenir toutes les infos de la boutique
     */
    getShopInfo() {
        return {
            money: this.state.money,
            upgrades: {
                damage: this.getUpgradeInfo('damage'),
                fireRate: this.getUpgradeInfo('fireRate'),
                magSize: this.getUpgradeInfo('magSize'),
                reloadSpeed: this.getUpgradeInfo('reloadSpeed')
            }
        };
    }
    
    /**
     * Obtenir les infos de tous les niveaux pour le menu
     */
    getLevelsInfo() {
        return LEVEL_CONFIGS.map(config => ({
            id: config.id,
            name: config.name,
            description: config.description,
            unlocked: this.isLevelUnlocked(config.id),
            completed: this.state.levelStats[config.id]?.completed || false,
            bestKills: this.state.levelStats[config.id]?.bestKills || 0,
            targetCount: config.targetCount
        }));
    }
}
