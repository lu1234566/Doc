/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Zap, Skull, RefreshCcw, Terminal, Move, Users, Coins, ChevronLeft } from 'lucide-react';
import { GameScene } from './components/game/GameScene';
import { MainMenu } from './components/menu/MainMenu';

import { 
  WeaponType, 
  DifficultyKey, 
  UPGRADES, 
  WEAPONS, 
  MAP, 
  CELL_SIZE, 
  TICK_RATE,
  WEAPON_UPGRADE_COSTS,
  MAX_WEAPON_LEVEL,
  DIFFICULTIES
} from './game/constants';
import { 
  Player, 
  Enemy, 
  Pickup, 
  Particle, 
  Tracer, 
  DamageIndicator, 
  KillfeedItem, 
  LifetimeStats, 
  RunStats,
  UpgradeLevels,
  WeaponUpgradeLevels
} from './game/types';
import { 
  loadCredits, 
  loadUpgrades, 
  loadWeaponUpgrades, 
  loadDifficulty, 
  loadLifetimeStats,
  saveCredits,
  saveUpgrades,
  saveWeaponUpgrades,
  saveLifetimeStats
} from './game/persistence';
import { clamp } from './game/helpers';
import { sounds } from './game/SoundEngine';


// --- Main Component ---
// @ts-ignore
const DEBUG_UI = import.meta.env?.DEV || false;

const getSafePlayerStart = () => {
    let px = 12 * CELL_SIZE + CELL_SIZE / 2;
    let py = 6 * CELL_SIZE + CELL_SIZE / 2;
    if (MAP[6]?.[12] === 0) return { x: px, y: py, angle: 0 };
    
    // Fallback
    for (let y = 1; y < MAP.length - 1; y++) {
        for (let x = 1; x < MAP[0].length - 1; x++) {
            if (MAP[y][x] === 0) {
                return { x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2, angle: 0 };
            }
        }
    }
    return { x: 128, y: 128, angle: 0 };
};

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'dead' | 'win' | 'upgrades'>('start');
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const [wave, setWave] = useState(1);
  const waveRef = useRef(1);
  const isWaveTransitionRef = useRef(false);
  const isSpawningRef = useRef(false);
  const spawnIntervalRef = useRef<number | null>(null);
  const reloadTimeoutRef = useRef<number | null>(null);
  const waveTransitionTimeoutRef = useRef<number | null>(null);
  const bossSpawnTimeoutRef = useRef<number | null>(null);
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [waveMessage, setWaveMessage] = useState('');
  const [mobileMode, setMobileMode] = useState(false);
  const [stats, setStats] = useState<RunStats>({ kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0 });
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>({
    totalKills: 0,
    totalDeaths: 0,
    totalCredits: 0,
    bestWave: 0,
    totalWins: 0,
    totalGames: 0
  });
  const isRunEndingRef = useRef(false);

  // --- Meta Progression State ---
  const [tacticalCredits, setTacticalCredits] = useState(0);
  const [upgradeLevels, setUpgradeLevels] = useState<Record<string, number>>({
    armorPlating: 0,
    ammoReserve: 0,
    quickReload: 0,
    scavenger: 0
  });
  const [weaponUpgradeLevels, setWeaponUpgradeLevels] = useState<Record<WeaponType, { damage: number, reload: number, stability: number }>>({
    pistol: { damage: 0, reload: 0, stability: 0 },
    rifle: { damage: 0, reload: 0, stability: 0 },
    shotgun: { damage: 0, reload: 0, stability: 0 },
    sniper: { damage: 0, reload: 0, stability: 0 }
  });
  const [weaponMags, setWeaponMags] = useState<Record<WeaponType, number>>({
    pistol: WEAPONS.pistol.magSize,
    rifle: WEAPONS.rifle.magSize,
    shotgun: WEAPONS.shotgun.magSize,
    sniper: WEAPONS.sniper.magSize
  });
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('normal');
  const [upgradeTab, setUpgradeTab] = useState<'biological' | 'weapon'>('biological');
  const [selectedLabWeapon, setSelectedLabWeapon] = useState<WeaponType>('pistol');
  const [menuView, setMenuView] = useState<'main' | 'armory' | 'difficulty' | 'profile'>('main');

  // Load Meta Data
  useEffect(() => {
    const credits = loadCredits();
    if (credits !== null) setTacticalCredits(credits);

    const upgrades = loadUpgrades();
    if (upgrades) setUpgradeLevels(prev => ({ ...prev, ...upgrades }));

    const weaponUpgrades = loadWeaponUpgrades();
    if (weaponUpgrades) setWeaponUpgradeLevels(prev => ({ ...prev, ...weaponUpgrades }));

    const diff = loadDifficulty();
    if (diff) setDifficulty(diff);

    const stats = loadLifetimeStats();
    if (stats) setLifetimeStats(prev => ({ ...prev, ...stats }));
  }, []);

  const saveMeta = (credits: number, upgrades: UpgradeLevels | Record<string, number>, weaponUpgrades?: WeaponUpgradeLevels, lStats?: LifetimeStats) => {
    saveCredits(credits);
    saveUpgrades(upgrades);
    if (weaponUpgrades) saveWeaponUpgrades(weaponUpgrades);
    if (lStats) saveLifetimeStats(lStats);
  };

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const isSmall = window.innerWidth < 1024;
      setMobileMode(isTouch || isSmall);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [ammo, setAmmo] = useState({ mag: WEAPONS.rifle.magSize, reserve: 120 });
  const ammoRef = useRef(ammo);
  const [hp, setHp] = useState(100);
  const [isReloading, setIsReloading] = useState(false);
  const isReloadingRef = useRef(false);
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());
  const [hitMarker, setHitMarker] = useState({ time: 0, killed: false });
  const [bossHp, setBossHp] = useState<{ current: number, max: number } | null>(null);
  const pickups = useRef<Pickup[]>([]);
  const lastDamageTaken = useRef(0);
  const gameStartTime = useRef(0);
  const screenShake = useRef(0);

  useEffect(() => { ammoRef.current = ammo; }, [ammo]);

  // Game Engine Refs
  const safeStart = getSafePlayerStart();
  const player = useRef<Player>({
    x: safeStart.x, y: safeStart.y, angle: safeStart.angle, 
    velX: 0, velY: 0, 
    rotVel: 0, pitch: 0,
    radius: 16,
    isAds: false,
    adsProgress: 0
  });

  const [killfeed, setKillfeed] = useState<KillfeedItem[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  const nextKillfeedId = useRef(0);
  const nextDamageId = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const enemies = useRef<Enemy[]>([]);
  const particles = useRef<Particle[]>([]);
  const navGridRef = useRef<number[][]>([]);
  const mapData = useRef([...MAP.map(row => [...row])]);
  const [mapDataState, setMapDataState] = useState([...MAP.map(row => [...row])]);
  const lastShotTime = useRef(0);
  const recoilOffset = useRef(0);

  // Mobile Control Refs
  const joystick = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
  const touchLook = useRef({ active: false, lastX: 0, lastY: 0 });

  const [enemiesState, setEnemiesState] = useState<Enemy[]>([]);
  const renderTick = useRef(0);

  const initGame = () => {
    gameStartTime.current = Date.now();
    isRunEndingRef.current = false;
    setGameState('playing');
    setCurrentWeapon('pistol');
    const maxHp = 100 + (upgradeLevels.armorPlating * 5);
    setHp(maxHp);
    setStats({ kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0 });
    
    const initialReserve = 120 + (upgradeLevels.ammoReserve * 20);
    const initialAmmo = { mag: WEAPONS.pistol.magSize, reserve: initialReserve };
    setAmmo(initialAmmo);
    ammoRef.current = initialAmmo;
    setScore(0);
    setWave(1);
    setEarnedCredits(0);
    waveRef.current = 1;
    isWaveTransitionRef.current = false;
    isSpawningRef.current = false;
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
    }
    if (waveTransitionTimeoutRef.current) {
      clearTimeout(waveTransitionTimeoutRef.current);
      waveTransitionTimeoutRef.current = null;
    }
    if (bossSpawnTimeoutRef.current) {
      clearTimeout(bossSpawnTimeoutRef.current);
      bossSpawnTimeoutRef.current = null;
    }
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
    }
    setIsReloading(false);
    isReloadingRef.current = false;
    setEnemiesRemaining(0);
    setBossHp(null);
    setWaveMessage('');
    setWeaponMags({
      pistol: WEAPONS.pistol.magSize,
      rifle: WEAPONS.rifle.magSize,
      shotgun: WEAPONS.shotgun.magSize,
      sniper: WEAPONS.sniper.magSize
    });
    pickups.current = [];
    const safeStartUpdate = getSafePlayerStart();
    player.current = { x: safeStartUpdate.x, y: safeStartUpdate.y, angle: safeStartUpdate.angle, velX: 0, velY: 0, rotVel: 0, pitch: 0, radius: 16, isAds: false, adsProgress: 0 };
    enemies.current = [];
    setEnemiesState([]);
    particles.current = [];
    navGridRef.current = MAP.map(row => row.map(() => 999));
    graveyard.current = [];
    killfeed.length = 0;
    setKillfeed([]);
    keys.current = {};
    joystick.current.active = false;
    touchLook.current.active = false;
    const newMap = [...MAP.map(row => [...row])];
    mapData.current = newMap;
    setMapDataState([...newMap]);
    spawnWave(1);
    sounds.init();
  };

  useEffect(() => {
    const updateNav = () => {
      if (gameStateRef.current !== 'playing') return;
      
      const rows = MAP.length;
      const cols = MAP[0].length;
      const distMap = MAP.map(row => row.map(() => 999));
      
      const px = Math.floor(player.current.x / CELL_SIZE);
      const py = Math.floor(player.current.y / CELL_SIZE);
      
      if (px < 0 || px >= cols || py < 0 || py >= rows) return;
      
      const queue: [number, number, number][] = [[px, py, 0]];
      distMap[py][px] = 0;
      
      let head = 0;
      while (head < queue.length) {
        const [x, y, d] = queue[head++];
        
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            // Treat doors (2) as walkable for pathfinding logic so enemies wait outside or approach
            if (MAP[ny][nx] === 0 || MAP[ny][nx] === 2) {
              if (distMap[ny][nx] > d + 1) {
                distMap[ny][nx] = d + 1;
                queue.push([nx, ny, d + 1]);
              }
            }
          }
        }
      }
      navGridRef.current = distMap;
    };

    const interval = setInterval(updateNav, 500);
    return () => clearInterval(interval);
  }, []);

  const tracers = useRef<Tracer[]>([]);
  const nextTracerId = useRef(0);

  const spawnWave = (waveNum: number) => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    if (waveTransitionTimeoutRef.current) {
      clearTimeout(waveTransitionTimeoutRef.current);
      waveTransitionTimeoutRef.current = null;
    }
    
    isWaveTransitionRef.current = true;
    setWaveMessage(`WAVE ${waveNum}`);
    
    waveTransitionTimeoutRef.current = setTimeout(() => {
      setWaveMessage('');
      isWaveTransitionRef.current = false;
      waveTransitionTimeoutRef.current = null;
    }, 3000) as unknown as number;
    
    waveRef.current = waveNum;
    isSpawningRef.current = true;
    
    // Gradual spawning
    const count = 3 + waveNum * 2;
    let spawnedCount = 0;
    spawnIntervalRef.current = setInterval(() => {
        if (gameStateRef.current !== 'playing') {
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            return;
        }

        if (spawnedCount >= count) {
            if (spawnIntervalRef.current) {
              clearInterval(spawnIntervalRef.current);
              spawnIntervalRef.current = null;
            }
            
            if (waveNum === 5) {
              isSpawningRef.current = true;
              if (bossSpawnTimeoutRef.current) clearTimeout(bossSpawnTimeoutRef.current);
              bossSpawnTimeoutRef.current = setTimeout(() => {
                if (gameStateRef.current === 'playing' && waveRef.current === 5) {
                  spawnEnemies(1, 5, true);
                  setEnemiesRemaining(prev => prev + 1);
                }
                isSpawningRef.current = false;
                bossSpawnTimeoutRef.current = null;
              }, 4000) as unknown as number;
            } else {
              isSpawningRef.current = false;
            }
            return;
        }
        spawnEnemies(1, waveNum);
        spawnedCount++;
    }, 800) as unknown as number;
  };

  const spawnEnemies = (count: number, currentWave: number = 1, isBoss: boolean = false) => {
    const types: ('rusher' | 'rifleman' | 'sniper')[] = ['rusher', 'rifleman', 'sniper'];
    let spawned = 0;
    let attempts = 0;
    
    // Fallback: collect all empty cells
    const emptyCells: {x: number, y: number}[] = [];
    for (let y = 0; y < MAP.length; y++) {
      for (let x = 0; x < MAP[0].length; x++) {
        if (MAP[y][x] === 0) {
          emptyCells.push({ x: x * CELL_SIZE + CELL_SIZE/2, y: y * CELL_SIZE + CELL_SIZE/2 });
        }
      }
    }
    
    while (spawned < count && attempts < 100) {
        attempts++;
        let rx = Math.random() * (MAP[0].length * CELL_SIZE);
        let ry = Math.random() * (MAP.length * CELL_SIZE);
        
        const distToPlayer = Math.hypot(rx - player.current.x, ry - player.current.y);
        const mapX = Math.floor(rx / CELL_SIZE);
        const mapY = Math.floor(ry / CELL_SIZE);
        
        let validSpawn = distToPlayer > 500 && MAP[mapY]?.[mapX] === 0;
        
        // Fallback after 50 attempts
        if (!validSpawn && attempts > 50 && emptyCells.length > 0) {
           const emptyCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
           rx = emptyCell.x;
           ry = emptyCell.y;
           validSpawn = true;
        }

        if (validSpawn) {
            const type = isBoss ? 'rifleman' : types[Math.floor(Math.random() * types.length)];
            const diffMult = DIFFICULTIES[difficulty].hpMult;
            const hpBuff = 1 + (currentWave - 1) * 0.15;
            const speedBuff = 1 + (currentWave - 1) * 0.04;
            const finalHp = (type === 'rusher' ? 60 : type === 'rifleman' ? 100 : 80) * hpBuff * (isBoss ? 20 : 1) * diffMult;

            const newEnemy = {
                id: Math.random(),
                x: rx, y: ry,
                type,
                isBoss,
                hp: finalHp,
                maxHp: finalHp,
                lastShot: Date.now() + Math.random() * 2000,
                speed: (type === 'rusher' ? 3.5 : type === 'rifleman' ? 2 : 1.5) * speedBuff * (isBoss ? 0.7 : 1),
                color: isBoss ? '#f43f5e' : (type === 'rusher' ? '#ef4444' : type === 'rifleman' ? '#eab308' : '#3b82f6'),
                stuckFrames: 0,
                lastX: rx,
                lastY: ry,
                targetAngle: 0,
                spawnTime: Date.now()
            };
            
            if (isBoss) {
              setBossHp({ current: finalHp, max: finalHp });
            }

            enemies.current.push(newEnemy);
            spawned++;
        }
    }
    setEnemiesState([...enemies.current]);
    setEnemiesRemaining(enemies.current.length);
  };

  const graveyard = useRef<{ x: number, y: number, color: string, type: string }[]>([]);

  const handleShoot = () => {
    if (gameStateRef.current !== 'playing' || isReloadingRef.current) return;
    const now = Date.now();
    const weapon = WEAPONS[currentWeapon];
    if (now - lastShotTime.current < weapon.fireRate) return;
    
    // Check ammo
    if (ammoRef.current.mag <= 0) {
      if (!isReloadingRef.current && ammoRef.current.reserve > 0) reload();
      return;
    }

    lastShotTime.current = now;
    setAmmo(prev => ({ ...prev, mag: Math.max(0, prev.mag - 1) }));
    setStats(prev => ({ ...prev, shotsFired: prev.shotsFired + 1 }));
    sounds.playShot(currentWeapon);

    // Apply Recoil & Shake
    const weaponLevels = weaponUpgradeLevels[currentWeapon];
    const stabilityMult = 1 - (weaponLevels.stability * 0.05);
    const recoilForce = weapon.recoil * (1 - player.current.adsProgress * 0.6) * stabilityMult;
    recoilOffset.current += recoilForce / 40;
    screenShake.current = Math.min(15, screenShake.current + recoilForce / 4);

    // Raycast for Hit Detection
    const spreadMult = 1 - (weaponLevels.stability * 0.05);
    const spread = (Math.random() - 0.5) * weapon.spread * (1 - player.current.adsProgress * 0.8) * spreadMult;
    const shotAngle = player.current.angle + spread;
    const cos = Math.cos(shotAngle);
    const sin = Math.sin(shotAngle);
    
    let hitDist = weapon.range;
    let hitSomething = false;
    
    // Raycast for barrels/walls
    for (let d = 0; d < weapon.range; d += 8) {
        const tx = Math.floor((player.current.x + cos * d) / CELL_SIZE);
        const ty = Math.floor((player.current.y + sin * d) / CELL_SIZE);
        if (tx >= 0 && tx < MAP[0].length && ty >= 0 && ty < MAP.length) {
            const cell = mapData.current[ty][tx];
            if (cell === 3) { // Barrel
                if (mapData.current[ty]) mapData.current[ty][tx] = 0; // Explode!
                setMapDataState([...mapData.current.map(row => [...row])]);
                spawnParticles(player.current.x + cos * d, player.current.y + sin * d, 'explosion');
                sounds.playShot('sniper'); // Loud explosion sound
                hitDist = d;
                hitSomething = true;
                break;
            } else if (cell === 1) {
                hitDist = d;
                break;
            }
        }
    }
    
    // Check enemies
    enemies.current.forEach(enemy => {
        if (enemy.dead) return;
        const dx = enemy.x - player.current.x;
        const dy = enemy.y - player.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > hitDist) return;
        
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.atan2(Math.sin(angleToEnemy - shotAngle), Math.cos(angleToEnemy - shotAngle));
        
        if (Math.abs(angleDiff) < 0.15 * (weapon.type === 'shotgun' ? 3 : 1)) {
            const damageMult = 1 + (weaponUpgradeLevels[currentWeapon].damage * 0.05);
            enemy.hp -= weapon.damage * damageMult;
            hitSomething = true;
            
            if (enemy.isBoss) {
              setBossHp({ current: Math.max(0, enemy.hp), max: enemy.maxHp });
            }

            sounds.playHit();
            spawnParticles(enemy.x, enemy.y, 'blood');
            if (enemy.hp <= 0) {
              enemy.dead = true;
              setHitMarker({ time: Date.now(), killed: true });
              sounds.playKill();
              setStats(prev => ({ ...prev, kills: prev.kills + 1 }));
              const killScore = enemy.isBoss ? 5000 : (enemy.type === 'sniper' ? 500 : enemy.type === 'rifleman' ? 200 : 100);
              setScore(prev => prev + killScore);
              setKillfeed(prev => [{ id: nextKillfeedId.current++, text: `${enemy.isBoss ? 'TITAN' : enemy.type.toUpperCase()} NEUTRALIZED (+${killScore})` }, ...prev].slice(0, 5));
              graveyard.current.push({ x: enemy.x, y: enemy.y, color: enemy.color, type: enemy.type });
              spawnParticles(enemy.x, enemy.y, 'explosion');

              // Chance for pickup
              const baseDropChance = 0.35;
              const dropChance = baseDropChance + (upgradeLevels.scavenger * 0.05);
              if (Math.random() < dropChance || enemy.isBoss) {
                 const type = Math.random() > 0.5 ? 'health' : 'ammo';
                 pickups.current.push({
                   id: Math.random(),
                   x: enemy.x,
                   y: enemy.y,
                   type,
                   rotation: 0
                 });
              }

              if (enemy.isBoss) setBossHp(null);
            } else {
              setHitMarker({ time: Date.now(), killed: false });
            }
        }
    });

    if (hitSomething) {
      setStats(prev => ({ ...prev, shotsHit: prev.shotsHit + 1 }));
    }

    // Spawn Shell Casing and Muzzle Flash
    spawnParticles(player.current.x, player.current.y, 'shell');

    // Player Shot Tracer
    tracers.current.push({
      id: nextTracerId.current++,
      x1: player.current.x,
      y1: player.current.y,
      x2: player.current.x + cos * hitDist,
      y2: player.current.y + sin * hitDist,
      alpha: 1
    });
  };

  const reload = () => {
    // Prevent double reload and check conditions
    if (isReloadingRef.current || ammoRef.current.mag >= WEAPONS[currentWeapon].magSize || ammoRef.current.reserve <= 0 || gameStateRef.current !== 'playing') return;

    setIsReloading(true);
    isReloadingRef.current = true;
    sounds.playReload();

    const reloadingWeapon = currentWeapon;
    if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    const reloadReduction = upgradeLevels.quickReload * 0.05;
    const weaponReloadReduction = weaponUpgradeLevels[currentWeapon].reload * 0.04;
    const finalReloadTime = WEAPONS[currentWeapon].reloadTime * (1 - reloadReduction) * (1 - weaponReloadReduction);
    
    reloadTimeoutRef.current = setTimeout(() => {
      setAmmo(prev => {
        const weaponStats = WEAPONS[reloadingWeapon];
        const needed = weaponStats.magSize - prev.mag;
        const taken = Math.min(needed, prev.reserve);
        const newMag = prev.mag + taken;
        // Also update the stored mag for this weapon
        setWeaponMags(mags => ({ ...mags, [reloadingWeapon]: newMag }));
        const newAmmo = {
          mag: newMag,
          reserve: prev.reserve - taken
        };
        ammoRef.current = newAmmo;
        return newAmmo;
      });
      setIsReloading(false);
      isReloadingRef.current = false;
      reloadTimeoutRef.current = null;
    }, finalReloadTime) as unknown as number;
  };

  const spawnParticles = (x: number, y: number, type: 'blood' | 'explosion' | 'shell') => {
    const count = type === 'explosion' ? 20 : 5;
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: type === 'blood' ? '#ef4444' : type === 'shell' ? '#eab308' : '#fb923c',
        size: Math.random() * 4 + 2
      });
    }
  };

  const update = () => {
    frameCount.current++;
    const nowTime = Date.now();
    if (nowTime - lastFpsTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsTime.current = nowTime;
    }

    if (gameStateRef.current !== 'playing') return;

    // Player Movement
    let dx = 0; let dy = 0;
    const isW = keys.current['w'];
    const isS = keys.current['s'];
    const isA = keys.current['a'];
    const isD = keys.current['d'];
    const isShift = keys.current['shift'];

    // joystick input
    if (joystick.current.active) {
      const jDx = joystick.current.curX - joystick.current.startX;
      const jDy = joystick.current.curY - joystick.current.startY;
      const jDist = Math.sqrt(jDx * jDx + jDy * jDy);
      const jAngle = Math.atan2(jDy, jDx);
      const limitedDist = Math.min(50, jDist);
      const intensity = limitedDist / 50;

      // Adjust relative to player angle
      const moveAngle = player.current.angle + jAngle + Math.PI / 2;
      dx = Math.cos(moveAngle) * intensity;
      dy = Math.sin(moveAngle) * intensity;
    }

    if (isW) { dx += Math.cos(player.current.angle); dy += Math.sin(player.current.angle); }
    if (isS) { dx -= Math.cos(player.current.angle); dy -= Math.sin(player.current.angle); }
    if (isA) { dx += Math.sin(player.current.angle); dy -= Math.cos(player.current.angle); }
    if (isD) { dx -= Math.sin(player.current.angle); dy += Math.cos(player.current.angle); }

    // ADS Toggle/Hold (Right click or C)
    player.current.isAds = keys.current['c'] || keys.current['m_right'];
    if (player.current.isAds) {
      player.current.adsProgress = Math.min(1, player.current.adsProgress + 0.1);
    } else {
      player.current.adsProgress = Math.max(0, player.current.adsProgress - 0.1);
    }

    const moveSpeed = (isShift ? 6 : 4) * (1 - player.current.adsProgress * 0.5);
    const nx = player.current.x + dx * moveSpeed;
    const ny = player.current.y + dy * moveSpeed;

    // Basic Collision & Interaction
    const tryMove = (tx: number, ty: number) => {
      if (Number.isNaN(tx) || Number.isNaN(ty) || tx < 0 || tx >= MAP[0].length || ty < 0 || ty >= MAP.length) return false;
      const cell = mapData.current[ty][tx];
      if (cell === 0) return true;
      if (cell === 2) { // Door
        if (mapData.current[ty]) mapData.current[ty][tx] = 0; // Open
        setMapDataState([...mapData.current.map(row => [...row])]);
        sounds.playReload();
        return true;
      }
      return false;
    };

    if (tryMove(Math.floor(nx / CELL_SIZE), Math.floor(player.current.y / CELL_SIZE))) player.current.x = nx;
    if (tryMove(Math.floor(player.current.x / CELL_SIZE), Math.floor(ny / CELL_SIZE))) player.current.y = ny;

    // Pickup Collection
    pickups.current = pickups.current.filter((p) => {
      const dist = Math.hypot(p.x - player.current.x, p.y - player.current.y);
      if (dist < 32) {
        if (p.type === 'health') {
           const maxHp = 100 + (upgradeLevels.armorPlating * 5);
           setHp(prev => Math.min(maxHp, prev + 25));
        } else {
           const maxReserve = 120 + (upgradeLevels.ammoReserve * 20);
           setAmmo(prev => ({ ...prev, reserve: Math.min(maxReserve, prev.reserve + 60) }));
        }
        sounds.playPickup(p.type);
        setKillfeed(prev => [{ id: nextKillfeedId.current++, text: `+ ${p.type.toUpperCase()} SECURED` }, ...prev].slice(0, 5));
        return false;
      }
      p.rotation += 0.05;
      return true;
    });

    // Apply Recoil Decay & Shake
    recoilOffset.current *= 0.85;
    screenShake.current *= 0.9;
    
    if (keys.current['m_left'] && WEAPONS[currentWeapon].isAuto) {
      handleShoot();
    }

    // Enemy AI
    const now = Date.now();
    enemies.current = enemies.current.filter(e => !e.dead);
    
    // Wave Management
    if (gameStateRef.current === 'playing' && enemies.current.length === 0 && !isSpawningRef.current && !isWaveTransitionRef.current) {
       if (waveRef.current >= 5) {
         if (!isRunEndingRef.current) {
           isRunEndingRef.current = true;
           const diffMult = DIFFICULTIES[difficulty].creditMult;
           const finalCredits = Math.floor((stats.kills * 15 + waveRef.current * 100 + score / 5 + 1500) * diffMult);
           setEarnedCredits(finalCredits);
           
           const nextLStats = {
             ...lifetimeStats,
             totalKills: lifetimeStats.totalKills + stats.kills,
             bestWave: Math.max(lifetimeStats.bestWave, waveRef.current),
             totalWins: lifetimeStats.totalWins + 1,
             totalGames: lifetimeStats.totalGames + 1,
             totalCredits: lifetimeStats.totalCredits + finalCredits
           };
           setLifetimeStats(nextLStats);
           setTacticalCredits(prev => {
             const total = prev + finalCredits;
             saveMeta(total, upgradeLevels, weaponUpgradeLevels, nextLStats);
             return total;
           });
           setGameState('win');
         }
         if (spawnIntervalRef.current) {
           clearInterval(spawnIntervalRef.current);
           spawnIntervalRef.current = null;
         }
         if (reloadTimeoutRef.current) {
           clearTimeout(reloadTimeoutRef.current);
           reloadTimeoutRef.current = null;
         }
         if (waveTransitionTimeoutRef.current) {
           clearTimeout(waveTransitionTimeoutRef.current);
           waveTransitionTimeoutRef.current = null;
         }
         if (bossSpawnTimeoutRef.current) {
           clearTimeout(bossSpawnTimeoutRef.current);
           bossSpawnTimeoutRef.current = null;
         }
         setIsReloading(false);
         setWaveMessage('');
         isWaveTransitionRef.current = false;
         keys.current = {};
         joystick.current.active = false;
         touchLook.current.active = false;
       } else {
         const nextWave = waveRef.current + 1;
         setWave(nextWave);
         spawnWave(nextWave);
       }
    }

    enemies.current.forEach(e => {
      const pDx = player.current.x - e.x;
      const pDy = player.current.y - e.y;
      const dist = Math.sqrt(pDx * pDx + pDy * pDy);

      // Line of Sight Check (Simplified Raycast)
      let hasLineOfSight = true;
      const angleToPlayer = Math.atan2(pDy, pDx);
      const cos = Math.cos(angleToPlayer);
      const sin = Math.sin(angleToPlayer);
      
      const checkSteps = Math.min(dist / 16, 40);
      for(let d = 1; d < checkSteps; d++) {
           const tx = Math.floor((e.x + cos * d * 16) / CELL_SIZE);
           const ty = Math.floor((e.y + sin * d * 16) / CELL_SIZE);
           if (tx >= 0 && tx < MAP[0].length && ty >= 0 && ty < MAP.length) {
               const cell = mapData.current[ty][tx];
               if (cell === 1 || cell === 3) { // Wall or Barrel blocks LOS
                   hasLineOfSight = false;
                   break;
               }
           }
      }

      // Behavioral logic
      let targetDist = 0;
      if (e.type === 'rusher') targetDist = 80;
      else if (e.type === 'rifleman') targetDist = 320;
      else if (e.type === 'sniper') targetDist = 600;

      let moveX = 0;
      let moveY = 0;

      if (hasLineOfSight) {
          if (dist > targetDist + 16) {
              moveX = cos * e.speed;
              moveY = sin * e.speed;
          } else if (dist < targetDist - 16) {
              moveX = -cos * e.speed;
              moveY = -sin * e.speed;
          }
          
          // Strafe if very close to player to avoid clipping
          if (dist < 100) {
            moveX += -sin * e.speed * 0.5;
            moveY += cos * e.speed * 0.5;
          }
          
          // Anti-Stuck: if trying to move but distance doesn't change
          const dMoved = Math.hypot(e.x - e.lastX, e.y - e.lastY);
          if ((moveX !== 0 || moveY !== 0) && dMoved < 0.1) {
            e.stuckFrames++;
          } else {
            e.stuckFrames = Math.max(0, e.stuckFrames - 2);
          }

          if (e.stuckFrames > 60) {
            // Strafe to break block
            moveX = -sin * e.speed;
            moveY = cos * e.speed;
            if (e.stuckFrames > 120) e.stuckFrames = 0; 
          }

          // Shoot Logic
          const fireRate = e.isBoss ? 600 : (e.type === 'sniper' ? 3000 : e.type === 'rifleman' ? 800 : 1500);
          const canShoot = now - gameStartTime.current > 3000 && now - e.spawnTime > 1000;
          if (canShoot && now - e.lastShot > fireRate && dist < 1200) {
              e.lastShot = now;
              
              if (now - lastDamageTaken.current > 250) {
                  const baseDamage = e.type === 'sniper' ? 35 : e.type === 'rifleman' ? 12 : 8;
                  const damage = (e.isBoss ? baseDamage * 2.5 : baseDamage) * DIFFICULTIES[difficulty].dmgMult;
                  setHp(prev => {
                      const newHp = Math.max(0, prev - damage);
                      if (newHp === 0 && gameStateRef.current === 'playing' && !isRunEndingRef.current) {
                        isRunEndingRef.current = true;
                        const diffMult = DIFFICULTIES[difficulty].creditMult;
                        const runCredits = Math.floor((stats.kills * 10 + waveRef.current * 50 + score / 10) * diffMult);
                        setEarnedCredits(runCredits);
                        
                        const nextLStats = {
                          ...lifetimeStats,
                          totalKills: lifetimeStats.totalKills + stats.kills,
                          bestWave: Math.max(lifetimeStats.bestWave, waveRef.current),
                          totalDeaths: lifetimeStats.totalDeaths + 1,
                          totalGames: lifetimeStats.totalGames + 1,
                          totalCredits: lifetimeStats.totalCredits + runCredits
                        };
                        setLifetimeStats(nextLStats);
                        setTacticalCredits(prevCred => {
                          const total = prevCred + runCredits;
                          saveMeta(total, upgradeLevels, weaponUpgradeLevels, nextLStats);
                          return total;
                        });
                        setGameState('dead');
                        if (spawnIntervalRef.current) {
                          clearInterval(spawnIntervalRef.current);
                          spawnIntervalRef.current = null;
                        }
                        if (reloadTimeoutRef.current) {
                          clearTimeout(reloadTimeoutRef.current);
                          reloadTimeoutRef.current = null;
                        }
                        if (waveTransitionTimeoutRef.current) {
                          clearTimeout(waveTransitionTimeoutRef.current);
                          waveTransitionTimeoutRef.current = null;
                        }
                        if (bossSpawnTimeoutRef.current) {
                          clearTimeout(bossSpawnTimeoutRef.current);
                          bossSpawnTimeoutRef.current = null;
                        }
                        setIsReloading(false);
                        setWaveMessage('');
                        isWaveTransitionRef.current = false;
                        keys.current = {};
                        joystick.current.active = false;
                        touchLook.current.active = false;
                      }
                      return newHp;
                  });
                  lastDamageTaken.current = now;
                  screenShake.current = Math.min(20, screenShake.current + damage / 2);
                  setDamageIndicators(prev => [...prev, { id: nextDamageId.current++, angle: angleToPlayer - player.current.angle + Math.PI, opacity: 1.2 }].slice(-5));
                  spawnParticles(player.current.x, player.current.y, 'blood');
                  sounds.playShot(e.type === 'sniper' ? 'sniper' : 'pistol');
              }
              tracers.current.push({ id: nextTracerId.current++, x1: e.x, y1: e.y, x2: player.current.x, y2: player.current.y, alpha: 1 });
          }
      } else {
          // Pathfinding: No LOS
          const curGridX = Math.floor(e.x / CELL_SIZE);
          const curGridY = Math.floor(e.y / CELL_SIZE);
          
          if (navGridRef.current[curGridY]) {
            let bestD = navGridRef.current[curGridY][curGridX] || 999;
            let bestDir = { dx: 0, dy: 0 };
            
            const neighbors = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1], [1,-1], [-1,1]];
            for (const [dx, dy] of neighbors) {
              const nx = curGridX + dx;
              const ny = curGridY + dy;
              if (navGridRef.current[ny] && navGridRef.current[ny][nx] !== undefined) {
                const d = navGridRef.current[ny][nx];
                if (d < bestD) {
                  bestD = d;
                  bestDir = { dx, dy };
                }
              }
            }
            
            if (bestDir.dx !== 0 || bestDir.dy !== 0) {
               // Smooth movement towards the target cell
               const targetX = (curGridX + bestDir.dx) * CELL_SIZE + CELL_SIZE/2;
               const targetY = (curGridY + bestDir.dy) * CELL_SIZE + CELL_SIZE/2;
               const angleToGrid = Math.atan2(targetY - e.y, targetX - e.x);
               moveX = Math.cos(angleToGrid) * e.speed;
               moveY = Math.sin(angleToGrid) * e.speed;
            } else {
               // Fallback: move toward player
               moveX = cos * e.speed;
               moveY = sin * e.speed;
            }
          }
      }

      e.lastX = e.x;
      e.lastY = e.y;

      const nx = e.x + moveX;
      const ny = e.y + moveY;
      const txX = Math.floor(nx / CELL_SIZE);
      const tyY = Math.floor(ny / CELL_SIZE);
      const curTx = Math.floor(e.x / CELL_SIZE);
      const curTy = Math.floor(e.y / CELL_SIZE);

      const tryEnemyMove = (tx: number, ty: number) => {
        if (tx < 0 || tx >= MAP[0].length || ty < 0 || ty >= MAP.length) return false;
        const cell = mapData.current[ty][tx];
        if (cell === 0) return true;
        if (cell === 2) {
          if (mapData.current[ty]) mapData.current[ty][tx] = 0;
          setMapDataState([...mapData.current.map(row => [...row])]);
          return true;
        }
        return false;
      };

      if (tryEnemyMove(txX, curTy)) e.x = nx;
      else if (txX !== curTx) e.stuckFrames++;

      if (tryEnemyMove(curTx, tyY)) e.y = ny;
      else if (tyY !== curTy) e.stuckFrames++;
    });

    // Sync internal state for 3D rendering (Throttle to ~30fps for UI/Render sync)
    renderTick.current++;
    if (renderTick.current % 2 === 0) {
      setEnemiesState([...enemies.current]);
      setEnemiesRemaining(Math.max(0, enemies.current.length));
      setDamageIndicators(prev => prev.map(ind => ({ ...ind, opacity: ind.opacity - 0.02 })).filter(ind => ind.opacity > 0));
    }

    // Update Tracers
    tracers.current.forEach(t => t.alpha -= 0.05);
    tracers.current = tracers.current.filter(t => t.alpha > 0);
    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
    });
    particles.current = particles.current.filter(p => p.life > 0);
  };

  const buyUpgrade = (key: string) => {
    const upgrade = UPGRADES[key];
    const currentLevel = upgradeLevels[key];
    if (currentLevel >= upgrade.maxLevel) return;
    
    const cost = upgrade.costs[currentLevel];
    if (tacticalCredits >= cost) {
      const nextCredits = tacticalCredits - cost;
      const nextUpgrades = { ...upgradeLevels, [key]: currentLevel + 1 };
      setTacticalCredits(nextCredits);
      setUpgradeLevels(nextUpgrades);
      saveMeta(nextCredits, nextUpgrades, weaponUpgradeLevels);
      sounds.playPickup('health'); // Generic positive sound
    } else {
      sounds.playError();
    }
  };

  const buyWeaponUpgrade = (weapon: WeaponType, attribute: 'damage' | 'reload' | 'stability') => {
    const currentLevels = weaponUpgradeLevels[weapon];
    const currentLevel = currentLevels[attribute];
    if (currentLevel >= MAX_WEAPON_LEVEL) return;

    const cost = WEAPON_UPGRADE_COSTS[currentLevel];
    if (tacticalCredits >= cost) {
      const nextCredits = tacticalCredits - cost;
      const nextWeaponUpgrades = {
        ...weaponUpgradeLevels,
        [weapon]: { ...currentLevels, [attribute]: currentLevel + 1 }
      };
      setTacticalCredits(nextCredits);
      setWeaponUpgradeLevels(nextWeaponUpgrades);
      saveMeta(nextCredits, upgradeLevels, nextWeaponUpgrades);
      sounds.playPickup('ammo'); // Generic positive sound
    } else {
      sounds.playError();
    }
  };

  useEffect(() => {
    const loop = setInterval(() => {
      update();
    }, TICK_RATE);
    return () => {
      clearInterval(loop);
    };
  }, [gameState, currentWeapon, hp, ammo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === 'r') reload();
      if (['1','2','3','4'].includes(e.key)) {
        const weaponMap: Record<string, WeaponType> = { '1': 'pistol', '2': 'rifle', '3': 'shotgun', '4': 'sniper' };
        const next = weaponMap[e.key];
        if (next === currentWeapon) return;
        
        // Sync current mag before swap
        const currentMag = ammoRef.current.mag;
        setWeaponMags(prev => ({ ...prev, [currentWeapon]: currentMag }));
        
        setCurrentWeapon(next);
        setAmmo(prev => ({ ...prev, mag: weaponMags[next] }));
        
        setIsReloading(false);
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
          reloadTimeoutRef.current = null;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      if (document.pointerLockElement !== gameContainerRef.current) {
        togglePointerLock();
        return;
      }
      if (e.button === 2) keys.current['m_right'] = true;
      if (e.button === 0) {
        keys.current['m_left'] = true;
        handleShoot(); // Initial shot for semi and auto
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) keys.current['m_right'] = false;
      if (e.button === 0) keys.current['m_left'] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (gameState !== 'playing' || document.pointerLockElement !== gameContainerRef.current) return;
        const speed = player.current.isAds ? 0.001 : 0.002;
        player.current.angle += e.movementX * speed;
        player.current.pitch = clamp(player.current.pitch - e.movementY * 0.1, -25, 25);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Bind mouse events to window to capture even if out of container during drag/lock
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, currentWeapon]);

  const togglePointerLock = () => {
    if (mobileMode) return;
    if (gameContainerRef.current) {
        gameContainerRef.current.requestPointerLock();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.2),transparent)]" />
      </div>

      {DEBUG_UI && (
        <div className="absolute top-2 left-2 z-[999] pointer-events-none bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded whitespace-pre border border-green-500/30">
          <div>FPS: {fps} | Mobile: {String(mobileMode)}</div>
          <div>State: {gameState} ({gameStateRef.current})</div>
          <div>W: {currentWeapon} | Ammo: {ammo.mag}/{ammo.reserve} ({ammoRef.current.mag}/{ammoRef.current.reserve}) | Rel: {String(isReloadingRef.current)}</div>
          <div>Wave: {wave} ({waveRef.current}) | Msg: {waveMessage} | wTr: {String(isWaveTransitionRef.current)}</div>
          <div>Spawn: actv:{String(isSpawningRef.current)} itv:{String(!!spawnIntervalRef.current)} boss:{String(!!bossSpawnTimeoutRef.current)}</div>
          <div>Enemies: ref:{enemies.current.length} st:{enemiesState.length} rm:{enemiesRemaining}</div>
          <div>P: {player.current.x.toFixed(0)},{player.current.y.toFixed(0)} ang:{player.current.angle.toFixed(2)} pt:{player.current.pitch.toFixed(1)}</div>
        </div>
      )}

      {/* Main Game Container */}
      <div 
        ref={gameContainerRef}
        className={`relative group bg-black cursor-crosshair touch-none overflow-hidden ${mobileMode ? 'w-full h-full' : 'shadow-2xl shadow-blue-900/20 border-4 border-slate-800 rounded-xl aspect-[4/3] max-w-[1000px] w-full'}`}
        onClick={togglePointerLock}
      >
        {gameState === 'playing' ? (
          <>
            <GameScene 
              player={player} 
              enemies={enemiesState}
              particles={particles.current}
              tracers={tracers.current}
              mapData={mapDataState}
              cellSize={CELL_SIZE}
              currentWeapon={currentWeapon}
              isReloading={isReloading}
              recoilOffset={recoilOffset.current}
              screenShake={screenShake.current}
              lastShotTime={lastShotTime.current}
              pickups={pickups.current}
            />

            {/* Boss Health Bar */}
            {bossHp && (
              <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 w-[70vw] md:w-80 z-50 pointer-events-none">
                 <div className="flex justify-between items-end mb-1">
                    <span className="text-red-500 font-black text-[10px] md:text-xs uppercase tracking-widest italic">Sector Guardian: TITAN</span>
                    <span className="text-white font-mono text-[9px]">{Math.ceil(bossHp.current)} / {bossHp.max}</span>
                 </div>
                 <div className="h-1.5 md:h-2 bg-slate-900/80 rounded-full border border-red-500/30 overflow-hidden backdrop-blur-md">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(bossHp.current / bossHp.max) * 100}%` }}
                      className="h-full bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    />
                 </div>
              </div>
            )}
          </>
        ) : (
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="w-full h-full cursor-crosshair"
            onClick={togglePointerLock}
          />
        )}

        {/* Mobile Controls Overlay */}
        {mobileMode && gameState === 'playing' && (
          <div className="absolute inset-0 z-50 pointer-events-none select-none">
            {/* Joystick Area */}
            <div 
              className="absolute bottom-6 left-4 md:bottom-10 md:left-10 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center pointer-events-auto rounded-full bg-white/5 border border-white/10"
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                joystick.current = { 
                  active: true, 
                  startX: touch.clientX, 
                  startY: touch.clientY,
                  curX: touch.clientX, 
                  curY: touch.clientY 
                };
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                joystick.current.curX = touch.clientX;
                joystick.current.curY = touch.clientY;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                joystick.current.active = false;
                joystick.current.curX = joystick.current.startX;
                joystick.current.curY = joystick.current.startY;
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                joystick.current.active = false;
              }}
            >
              {joystick.current.active && (
                <div 
                  className="absolute w-12 h-12 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm shadow-lg pointer-events-none"
                  style={{
                    transform: `translate(${clamp(joystick.current.curX - joystick.current.startX, -50, 50)}px, ${clamp(joystick.current.curY - joystick.current.startY, -50, 50)}px)`
                  }}
                />
              )}
              {!joystick.current.active && <div className="w-12 h-12 bg-white/10 rounded-full border border-white/5" />}
              <Move className="absolute text-white/10 pointer-events-none" size={40} />
            </div>

            {/* Look Area */}
            <div 
              className="absolute inset-y-0 right-0 w-3/5 pointer-events-auto"
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                touchLook.current = { active: true, lastX: touch.clientX, lastY: touch.clientY };
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (!touchLook.current.active) return;
                const touch = e.touches[0];
                const dx = touch.clientX - touchLook.current.lastX;
                const dy = touch.clientY - touchLook.current.lastY;
                
                const sensitivity = player.current.isAds ? 0.001 : 0.003;
                player.current.angle += dx * sensitivity;
                player.current.pitch = clamp(player.current.pitch - dy * 0.2, -25, 25);
                
                touchLook.current.lastX = touch.clientX;
                touchLook.current.lastY = touch.clientY;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                touchLook.current.active = false;
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                touchLook.current.active = false;
              }}
            />

            {/* Action Buttons */}
            <div className="absolute right-4 md:right-10 bottom-24 md:bottom-32 flex flex-col items-end gap-3 md:gap-6 pointer-events-none z-[60]">
              
              <div className="flex gap-2 md:gap-4">
                 {/* ADS Button */}
                 <button 
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-md pointer-events-auto transition-transform active:scale-95 ${player.current.isAds ? 'bg-yellow-500/40 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    keys.current['c'] = !keys.current['c'];
                  }}
                >
                  <Target size={28} />
                </button>

                {/* Reload Button */}
                <button 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/60 border-2 border-slate-700 text-white flex items-center justify-center backdrop-blur-md pointer-events-auto active:scale-95 transition-transform"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    reload();
                  }}
                >
                  <RefreshCcw size={28} className={isReloading ? 'animate-spin text-yellow-500' : ''} />
                </button>
              </div>

              {/* Fire Button */}
              <button 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-600/30 border-4 border-red-500/50 text-red-500 flex items-center justify-center backdrop-blur-xl pointer-events-auto active:scale-90 transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)] active:border-red-500 active:bg-red-500/50"
                onTouchStart={(e) => {
                  e.preventDefault();
                  keys.current['m_left'] = true;
                  handleShoot();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keys.current['m_left'] = false;
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  keys.current['m_left'] = false;
                }}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-red-400/30 flex items-center justify-center">
                   <Target size={28} className="md:w-8 md:h-8" />
                </div>
              </button>
            </div>
            
            {/* Weapon Selector (Mobile) */}
            <div className="absolute top-16 left-4 md:left-10 flex flex-col gap-1 md:gap-2 pointer-events-auto z-[60]">
              {(['pistol', 'rifle', 'shotgun', 'sniper'] as WeaponType[]).map(weapon => (
                <button
                  key={weapon}
                  onClick={() => {
                    // Sync mag before swap
                    const currentMag = ammoRef.current.mag;
                    setWeaponMags(prev => ({ ...prev, [currentWeapon]: currentMag }));
                    setCurrentWeapon(weapon);
                    setAmmo(prev => ({ ...prev, mag: weaponMags[weapon] }));
                    setIsReloading(false);
                    if (reloadTimeoutRef.current) {
                      clearTimeout(reloadTimeoutRef.current);
                      reloadTimeoutRef.current = null;
                    }
                  }}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg border backdrop-blur-md text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${currentWeapon === weapon ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-lg' : 'bg-slate-900/60 border-slate-700 text-slate-400'}`}
                >
                  {WEAPONS[weapon].name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global Damage Indicators Overlays */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
           {damageIndicators.map(ind => (
             <div 
              key={ind.id}
              className="absolute top-1/2 left-1/2 w-32 h-1 bg-red-600/50 blur-sm rounded-full origin-left"
              style={{ 
                transform: `translate(-50%, -50%) rotate(${ind.angle}rad) translate(100px, 0)`,
                opacity: ind.opacity 
              }}
             />
           ))}

           {hp < 30 && (
             <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none z-[45]" />
           )}

           {/* Damage Flash */}
           {Date.now() - lastDamageTaken.current < 100 && (
             <div 
              className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-100" 
              style={{ background: `radial-gradient(circle, transparent 40%, rgba(220, 38, 38, ${0.1 * (1 - (Date.now() - lastDamageTaken.current) / 100)}) 100%)` }}
             />
           )}

           {/* Hit Marker */}
           {Date.now() - hitMarker.time < 120 && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                <div className="relative w-8 h-8">
                   <div className={`absolute top-0 left-0 w-3 h-[2px] ${hitMarker.killed ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white'} rotate-45 origin-left`} />
                   <div className={`absolute top-0 right-0 w-3 h-[2px] ${hitMarker.killed ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white'} -rotate-45 origin-right`} />
                   <div className={`absolute bottom-0 left-0 w-3 h-[2px] ${hitMarker.killed ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white'} -rotate-45 origin-left`} />
                   <div className={`absolute bottom-0 right-0 w-3 h-[2px] ${hitMarker.killed ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white'} rotate-45 origin-right`} />
                </div>
             </div>
           )}

           {/* Crosshair Overlay */}
           {gameState === 'playing' && !(currentWeapon === 'sniper' && player.current.isAds) && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <div className={`w-8 h-[2px] bg-green-500 ${player.current.isAds ? 'opacity-50' : 'opacity-100'}`} />
                <div className={`h-8 w-[2px] bg-green-500 absolute ${player.current.isAds ? 'opacity-50' : 'opacity-100'}`} />
             </div>
           )}

           {/* Killfeed Overlay */}
           <div className="absolute top-20 md:top-24 right-4 md:right-6 flex flex-col items-end gap-1 md:gap-2 text-white font-mono font-bold text-xs md:text-sm pointer-events-none z-40">
              <AnimatePresence>
                {killfeed.map((kill, i) => (
                  <motion.div 
                    key={kill.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 - i * 0.2 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900/60 px-3 py-1 rounded-md border-r-2 border-red-500"
                  >
                    {kill.text}
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* HUD Elements */}
        {gameState === 'playing' && (
          <>
            {/* Top Stats */}
            <div className={`absolute left-0 right-0 flex justify-between items-start pointer-events-none z-40 px-4 transition-all duration-300 ${mobileMode ? 'top-16 md:top-4 scale-75 origin-top' : 'top-4'}`}>
              <div className="bg-slate-900/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-700 flex items-center gap-2 md:gap-4 shadow-xl">
                <div className="flex items-center gap-2 md:gap-3 pr-1 md:pr-2">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <Zap className="text-slate-950 w-5 h-5 md:w-6 md:h-6" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter italic leading-none">Nano Banana</span>
                      <span className="text-[8px] md:text-[9px] font-mono text-yellow-500/80 uppercase tracking-widest leading-none mt-1 font-bold">Protocol Active</span>
                   </div>
                </div>
                <div className="h-6 md:h-8 w-px bg-slate-700/50" />
                <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                   <div className="flex items-center gap-1 md:gap-2">
                      <Skull size={14} className="text-slate-400 md:w-[18px] md:h-[18px]" />
                      <span className="font-mono text-lg md:text-xl font-black text-white leading-none">{stats.kills}</span>
                   </div>
                   <div className="flex items-center gap-1 md:gap-2">
                      <Shield size={14} className={`md:w-[18px] md:h-[18px] ${hp < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                      <span className={`font-mono text-lg md:text-xl font-black leading-none ${hp < 30 ? 'text-red-500' : 'text-white'}`}>{Math.round(hp)}%</span>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 <div className="bg-slate-900/80 backdrop-blur-md px-2 md:px-4 py-1 md:py-2 rounded-lg border border-slate-700 text-slate-300 text-xs md:text-sm font-mono flex items-center gap-1 md:gap-2 shadow-xl">
                    <Terminal size={12} className="text-green-500 animate-pulse md:w-[14px] md:h-[14px]" />
                    <span className="text-[8px] md:text-[10px] tracking-wider uppercase font-bold text-slate-400">System <span className="hidden sm:inline">Integrity:</span> </span>
                    <span className="text-green-500 font-bold tracking-tighter">OPTIMAL</span>
                 </div>
              </div>
            </div>

            {/* Weapon & Ammo Card */}
            <div className={`absolute pointer-events-none z-40 flex items-center gap-2 md:gap-4 transition-all duration-300 ${mobileMode ? 'top-4 right-4 scale-75 origin-top-right' : 'bottom-6 right-6'}`}>
              <button 
                onClick={reload}
                className="w-10 h-10 md:w-14 md:h-14 bg-slate-900/90 backdrop-blur-xl border border-slate-700 hover:border-yellow-500 rounded-xl flex items-center justify-center shadow-2xl transition-colors pointer-events-auto group hidden md:flex"
              >
                <RefreshCcw size={20} className={`text-slate-400 group-hover:text-yellow-500 ${isReloading ? 'animate-spin text-yellow-500' : ''}`} />
              </button>
              <div className="bg-slate-900/90 backdrop-blur-xl border-l-4 border-yellow-500 p-2 md:p-4 rounded-xl flex flex-col gap-1 md:gap-2 shadow-2xl pointer-events-none">
                <div className="flex items-center gap-2 md:gap-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Weapon System</span>
                    <span className="text-lg md:text-2xl font-black text-white italic tracking-tighter uppercase leading-none mt-1">{WEAPONS[currentWeapon].name}</span>
                  </div>
                  <div className="h-8 md:h-12 w-px bg-slate-700/50" />
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl md:text-5xl font-mono font-bold leading-none ${ammo.mag < 5 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                      {isReloading ? '--' : ammo.mag}
                    </span>
                    <span className="text-sm md:text-xl font-mono text-slate-500 mb-0.5 md:mb-1">/ {ammo.reserve}</span>
                  </div>
                </div>
                {isReloading && (
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                    <motion.div 
                      key={lastShotTime.current} // To restart animation if interrupted, actually key mostly doesn't matter here
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: WEAPONS[currentWeapon].reloadTime / 1000 }}
                      className="h-full bg-yellow-500" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Health Bar Bottom */}
            <div className={`absolute flex flex-col pointer-events-none z-40 transition-all ${mobileMode ? 'bottom-6 left-1/2 -translate-x-1/2 w-48 scale-90' : 'bottom-6 left-6 w-48'}`}>
               <div className="flex items-center gap-2 mb-1 md:mb-2 bg-slate-950/50 px-2 py-1 rounded w-fit self-center md:self-start">
                 <Users size={12} className="text-blue-400" />
                 <span className="text-white font-black text-[10px] md:text-xs uppercase tracking-tighter">Units Detected: {enemiesRemaining}</span>
               </div>
               <div className="h-3 md:h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                  <motion.div 
                    animate={{ width: `${hp}%` }}
                    className={`h-full ${hp < 30 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                  />
               </div>
               <div className="mt-1 md:mt-2 flex justify-between text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                  <span>Armor Integrity</span>
                  <span>{hp}%</span>
               </div>
            </div>

            {/* Top Stats HUD */}
            <div className={`absolute pointer-events-none z-50 flex gap-2 transition-all ${mobileMode ? 'top-4 left-4 scale-75 origin-top-left' : 'top-6 left-6 items-start'}`}>
               <div className="flex items-center gap-2 md:gap-3 bg-slate-900/80 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-l-4 border-blue-500 backdrop-blur-md">
                 <div className="flex flex-col">
                   <span className="text-blue-400 font-black text-[8px] md:text-[9px] uppercase tracking-widest leading-none">Sector Wave</span>
                   <span className="text-white font-black text-lg md:text-2xl tracking-tighter leading-none mt-1">{wave}<span className="text-slate-600 text-xs md:text-sm ml-1">/ 5</span></span>
                 </div>
               </div>
               <div className="flex items-center gap-2 md:gap-3 bg-slate-900/80 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-l-4 backdrop-blur-md hidden md:flex" style={{ borderColor: DIFFICULTIES[difficulty].color }}>
                 <div className="flex flex-col">
                   <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest leading-none opacity-60" style={{ color: DIFFICULTIES[difficulty].color }}>Protocol</span>
                   <span className="text-white font-black text-[10px] md:text-xs italic tracking-tighter leading-none mt-1 uppercase">{difficulty}</span>
                 </div>
               </div>
            </div>

            <div className={`absolute pointer-events-none z-50 flex flex-col items-end gap-1 md:gap-2 transition-all ${mobileMode ? 'bottom-20 right-4 scale-75 origin-bottom-right' : 'top-6 right-6'}`}>
               <div className="bg-slate-900/80 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border-r-4 border-yellow-500 backdrop-blur-md flex flex-col items-end">
                  <span className="text-yellow-400 font-black text-[8px] md:text-[9px] uppercase tracking-widest leading-none">Score</span>
                  <span className="text-white font-black text-lg md:text-2xl tracking-tighter mt-1 leading-none">{score.toLocaleString()}</span>
               </div>
               <div className="bg-slate-900/60 px-2 md:px-3 py-1 rounded-lg backdrop-blur-sm text-[8px] md:text-[9px] font-black text-slate-400 flex gap-2 md:gap-4 uppercase tracking-tighter">
                 <span>Acc: {stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0}%</span>
                 <span className="text-slate-600">|</span>
                 <span>Kills: {stats.kills}</span>
               </div>
            </div>

            {/* Wave Announcement */}
            {waveMessage && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center animate-in zoom-in slide-in-from-top-12 duration-700 w-full px-4">
                 <motion.h2 
                  initial={{ scale: 0.5, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-[clamp(2.5rem,8vw,6rem)] font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-none"
                 >
                   {waveMessage}
                 </motion.h2>
                 <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-yellow-500 font-black tracking-[0.2em] md:tracking-[0.5em] uppercase mt-2 drop-shadow-md text-[10px] md:text-sm"
                 >
                   Neutralize All Hostiles
                 </motion.p>
               </div>
            )}
          </>
        )}

        {/* Start / Dead / Win / Upgrades Overlays */}
        <AnimatePresence>
          {(gameState === 'start' || gameState === 'dead' || gameState === 'win' || gameState === 'upgrades') && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center z-[100]"
            >
              {gameState === 'upgrades' ? (
                <div className="w-full max-w-2xl bg-zinc-900/90 rounded-3xl border border-white/10 p-6 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 text-left">
                     <div>
                       <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">Command Center</h2>
                       <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Upgrade biological and tactical equipment</p>
                     </div>
                     <div className="w-full sm:w-auto bg-yellow-500/20 px-5 py-3 rounded-2xl border border-yellow-500/30 flex items-center justify-center gap-3">
                       <Coins size={20} className="text-yellow-500" />
                       <span className="text-yellow-500 font-black text-lg">{tacticalCredits.toLocaleString()}</span>
                     </div>
                   </div>

                   {/* Tabs */}
                   <div className="flex gap-2 mb-8 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
                     <button 
                       onClick={() => {
                         sounds.playUiClick();
                         setUpgradeTab('biological');
                       }}
                       className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${upgradeTab === 'biological' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >
                       Biological
                     </button>
                     <button 
                       onClick={() => {
                         sounds.playUiClick();
                         setUpgradeTab('weapon');
                       }}
                       className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${upgradeTab === 'weapon' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >
                       Weapon Lab
                     </button>
                   </div>

                   {upgradeTab === 'biological' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                       {Object.entries(UPGRADES).map(([key, upgrade]) => {
                         const level = upgradeLevels[key];
                         const isMax = level >= upgrade.maxLevel;
                         const cost = isMax ? 0 : upgrade.costs[level];
                         const canAfford = tacticalCredits >= cost;

                         return (
                           <div key={key} className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 text-left flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-white font-black uppercase text-sm">{upgrade.name}</span>
                                <div className="flex gap-1">
                                  {[...Array(upgrade.maxLevel)].map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-slate-800'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-4">{upgrade.description}</p>
                              
                              <button 
                                disabled={isMax || !canAfford}
                                onClick={() => buyUpgrade(key)}
                                className={`mt-auto py-2 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs transition-all ${
                                  isMax ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                                  canAfford ? 'bg-white text-slate-950 hover:scale-105 active:scale-95' :
                                  'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}
                              >
                                {isMax ? 'MAXED' : !canAfford ? 'CREDITS NEEDED' : (
                                  <>
                                    <Coins size={12} />
                                    <span>{cost.toLocaleString()}</span>
                                  </>
                                )}
                              </button>
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <div className="space-y-6 mb-8">
                        {/* Weapon Selector */}
                        <div className="flex flex-wrap gap-2">
                           {Object.keys(WEAPONS).map((wKey) => {
                             const weapon = WEAPONS[wKey as WeaponType];
                             const isSelected = selectedLabWeapon === wKey;
                             return (
                               <button
                                 key={wKey}
                                 onClick={() => {
                                   sounds.playUiClick();
                                   setSelectedLabWeapon(wKey as WeaponType);
                                 }}
                                 className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${isSelected ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/20'}`}
                               >
                                 {weapon.name}
                               </button>
                             );
                           })}
                        </div>

                        {/* Attribute Upgrades */}
                        <div className="grid grid-cols-1 gap-3">
                           {(['damage', 'reload', 'stability'] as const).map((attr) => {
                             const level = weaponUpgradeLevels[selectedLabWeapon][attr];
                             const isMax = level >= MAX_WEAPON_LEVEL;
                             const cost = isMax ? 0 : WEAPON_UPGRADE_COSTS[level];
                             const canAfford = tacticalCredits >= cost;
                             
                             const descriptions = {
                               damage: '+5% Firepower per level',
                               reload: '-4% Reload time per level',
                               stability: '-5% Recoil/Spread per level'
                             };

                             return (
                               <div key={attr} className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 text-left flex items-center justify-between">
                                  <div>
                                    <span className="text-white font-black uppercase text-sm block mb-1">{attr}</span>
                                    <p className="text-slate-500 text-[9px] uppercase font-bold mb-3">{descriptions[attr]}</p>
                                    <div className="flex gap-1">
                                      {[...Array(MAX_WEAPON_LEVEL)].map((_, i) => (
                                        <div key={i} className={`w-3 h-1 rounded-full ${i < level ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-slate-800'}`} />
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    disabled={isMax || !canAfford}
                                    onClick={() => buyWeaponUpgrade(selectedLabWeapon, attr)}
                                    className={`py-2 px-6 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs transition-all ${
                                      isMax ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                                      canAfford ? 'bg-white text-slate-950 hover:scale-105 active:scale-95' :
                                      'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}
                                  >
                                    {isMax ? 'MAX' : !canAfford ? 'CREDITS NEEDED' : (
                                      <>
                                        <Coins size={12} />
                                        <span>{cost.toLocaleString()}</span>
                                      </>
                                    )}
                                  </button>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                   )}

                    <button 
                     onClick={() => {
                       sounds.playUiClick();
                       setMenuView('main');
                       setGameState('start');
                     }}
                     className="flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest w-full py-4 border-t border-white/5 mt-4"
                    >
                     <ChevronLeft size={16} /> Return to Operations
                    </button>
                </div>
              ) : gameState === 'start' ? (
                <MainMenu 
                  initGame={initGame}
                  setGameState={setGameState}
                  menuView={menuView}
                  setMenuView={setMenuView}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  tacticalCredits={tacticalCredits}
                  lifetimeStats={lifetimeStats}
                  weaponUpgradeLevels={weaponUpgradeLevels}
                  setUpgradeTab={setUpgradeTab}
                  setSelectedLabWeapon={setSelectedLabWeapon}
                />
              ) : (
                <div className={`p-12 rounded-3xl border-4 ${gameState === 'win' ? 'border-yellow-500 bg-yellow-500/10' : 'border-red-500 bg-red-500/10'} shadow-2xl w-full max-w-xl`}>
                    <h2 className={`text-8xl font-black italic tracking-tighter mb-2 ${gameState === 'win' ? 'text-yellow-500' : 'text-red-500'}`}>
                       {gameState === 'win' ? 'SUCCESS' : 'FAILED'}
                    </h2>
                    <div className="mb-4 inline-block px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: DIFFICULTIES[difficulty].color }}>
                      {DIFFICULTIES[difficulty].name} PROTOCOL
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] mb-10 text-xs">{gameState === 'win' ? 'Sector Secured. All hostiles neutralized.' : 'Mission Aborted. Biological signature lost.'}</p>
                    
                    <div className="bg-slate-900/80 px-6 py-5 rounded-2xl border-2 border-yellow-500/30 mb-8 text-left flex justify-between items-center">
                        <div>
                          <span className="block text-yellow-500 text-[10px] uppercase font-black mb-1 tracking-widest">Tactical Credits Earned</span>
                          <span className="text-4xl font-black text-white">+{earnedCredits.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-500 text-[10px] uppercase font-black mb-1">Total Balance</span>
                          <span className="text-xl font-black text-slate-400">{tacticalCredits.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left mb-10">
                       <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="block text-slate-500 text-[10px] uppercase font-black mb-1">Final Score</span>
                          <span className="text-2xl font-black text-white">{score.toLocaleString()}</span>
                       </div>
                       <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="block text-slate-500 text-[10px] uppercase font-black mb-1">Combat Wave</span>
                          <span className="text-2xl font-black text-white">{wave}</span>
                       </div>
                       <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="block text-slate-500 text-[10px] uppercase font-black mb-1">Accuracy</span>
                          <span className="text-2xl font-black text-white">{stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0}%</span>
                       </div>
                       <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <span className="block text-slate-500 text-[10px] uppercase font-black mb-1">Total Kills</span>
                          <span className="text-2xl font-black text-white">{stats.kills}</span>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={initGame}
                        className={`flex-1 py-5 rounded-2xl text-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${gameState === 'win' ? 'bg-yellow-500 text-slate-950' : 'bg-red-600 text-white'}`}
                      >
                        Re-Deploy Target
                      </button>
                      <button 
                        onClick={() => {
                          setMenuView('main');
                          setGameState('start');
                        }}
                        className="px-6 py-5 bg-slate-900 text-white rounded-2xl border border-white/10 hover:bg-slate-800 transition-all font-black uppercase text-xs"
                      >
                        Menu
                      </button>
                    </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Responsive Info/Controls */}
      {gameState === 'start' && !mobileMode && (
        <div className="mt-8 flex gap-8 items-center text-slate-500 text-sm font-medium">
           <div className="flex items-center gap-2">
              <Move size={16} /> w/a/s/d to move
           </div>
           <div className="flex items-center gap-2">
              <Zap size={16} /> 1-4 switch weapon
           </div>
        </div>
      )}
    </div>
  );
}
