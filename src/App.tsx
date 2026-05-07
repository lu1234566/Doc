/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Zap, Skull, Award, RefreshCcw, Smartphone, Terminal, Move } from 'lucide-react';
import { Weapon3D } from './Weapon3D';

// --- Types & Constants ---
type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'sniper';

interface Weapon {
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number; // ms
  reloadTime: number; // ms
  magSize: number;
  recoil: number;
  spread: number;
  range: number;
  isScoped: boolean;
  color: string;
}

const WEAPONS: Record<WeaponType, Weapon> = {
  pistol: { name: 'P-99', type: 'pistol', damage: 20, fireRate: 250, reloadTime: 1200, magSize: 12, recoil: 5, spread: 0.05, range: 600, isScoped: false, color: '#94a3b8' },
  rifle: { name: 'M4-A1', type: 'rifle', damage: 15, fireRate: 100, reloadTime: 2000, magSize: 30, recoil: 3, spread: 0.1, range: 800, isScoped: false, color: '#1e293b' },
  shotgun: { name: 'KRM-262', type: 'shotgun', damage: 60, fireRate: 800, reloadTime: 2500, magSize: 6, recoil: 20, spread: 0.5, range: 300, isScoped: false, color: '#334155' },
  sniper: { name: 'DL-Q33', type: 'sniper', damage: 100, fireRate: 1500, reloadTime: 3000, magSize: 5, recoil: 40, spread: 0.01, range: 1500, isScoped: true, color: '#0f172a' },
};

const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,1,0,2,0,0,2,0,1,0,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,2,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,2,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,0,3,3,0,0,1,1,1,0,1,1,1,0,1],
  [1,0,1,3,0,0,0,3,1,0,3,0,0,3,0,1,3,0,0,0,3,1,0,1],
  [1,0,1,3,0,0,0,3,1,0,3,0,0,3,0,1,3,0,0,0,3,1,0,1],
  [1,0,1,1,1,0,1,1,1,0,0,3,3,0,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,2,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,2,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,0,1,0,2,0,0,2,0,1,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const CELL_SIZE = 64;
const TICK_RATE = 1000 / 60;
const FOV = Math.PI / 3;
const RESOLUTION = 400; // Rays
const MAX_DEPTH = 1200;

// --- Helper Functions ---
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

class SoundEngine {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  playShot(weapon: WeaponType) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = weapon === 'sniper' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(weapon === 'sniper' ? 100 : 150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (weapon === 'sniper' ? 0.3 : 0.1));
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playReload() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

const sounds = new SoundEngine();

// --- Main Component ---
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'dead'>('start');
  const [mobileMode, setMobileMode] = useState(false);
  const [stats, setStats] = useState({ kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0 });
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [ammo, setAmmo] = useState({ mag: WEAPONS.rifle.magSize, reserve: 120 });
  const [hp, setHp] = useState(100);
  const [isReloading, setIsReloading] = useState(false);

  // Game Engine Refs
interface Player {
    x: number;
    y: number;
    angle: number;
    velX: number;
    velY: number;
    rotVel: number;
    pitch: number;
    radius: number;
    isAds: boolean;
    adsProgress: number; // 0 to 1
  }

  const player = useRef<Player>({
    x: 128, y: 128, angle: 0, 
    velX: 0, velY: 0, 
    rotVel: 0, pitch: 0,
    radius: 16,
    isAds: false,
    adsProgress: 0
  });

  const [killfeed, setKillfeed] = useState<{ id: number, text: string }[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<{ id: number, angle: number, opacity: number }[]>([]);
  const nextKillfeedId = useRef(0);
  const nextDamageId = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const enemies = useRef<any[]>([]);
  const particles = useRef<any[]>([]);
  const mapData = useRef([...MAP.map(row => [...row])]);
  const lastShotTime = useRef(0);
  const recoilOffset = useRef(0);

  // Mobile Control Refs
  const joystick = useRef({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
  const touchLook = useRef({ active: false, lastX: 0, lastY: 0 });

  const initGame = () => {
    setGameState('playing');
    setHp(100);
    setStats({ kills: 0, deaths: 0, shotsFired: 0, shotsHit: 0 });
    setAmmo({ mag: WEAPONS[currentWeapon].magSize, reserve: 120 });
    player.current = { x: 128, y: 128, angle: 0, velX: 0, velY: 0, rotVel: 0, pitch: 0, radius: 16, isAds: false, adsProgress: 0 };
    enemies.current = [];
    particles.current = [];
    spawnEnemies(5);
    sounds.init();
  };

  const tracers = useRef<{ id: number, x1: number, y1: number, x2: number, y2: number, alpha: number }[]>([]);
  const nextTracerId = useRef(0);

  const spawnEnemies = (count: number) => {
    const types: ('rusher' | 'rifleman' | 'sniper')[] = ['rusher', 'rifleman', 'sniper'];
    for (let i = 0; i < count; i++) {
        let rx, ry;
        do {
            rx = Math.floor(Math.random() * MAP[0].length) * CELL_SIZE + CELL_SIZE / 2;
            ry = Math.floor(Math.random() * MAP.length) * CELL_SIZE + CELL_SIZE / 2;
        } while (MAP[Math.floor(ry / CELL_SIZE)][Math.floor(rx / CELL_SIZE)] !== 0 || 
                 Math.hypot(rx - player.current.x, ry - player.current.y) < 300);
        
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.current.push({
            id: Math.random(),
            x: rx, y: ry,
            type,
            hp: type === 'rusher' ? 50 : 100,
            lastShot: Date.now() + Math.random() * 2000,
            speed: type === 'rusher' ? 3.5 : 2,
            color: type === 'rusher' ? '#ef4444' : type === 'rifleman' ? '#eab308' : '#3b82f6'
        });
    }
  };

  const graveyard = useRef<{ x: number, y: number, color: string, type: string }[]>([]);

  const handleShoot = () => {
    if (gameState !== 'playing' || isReloading) return;
    const now = Date.now();
    const weapon = WEAPONS[currentWeapon];
    if (now - lastShotTime.current < weapon.fireRate) return;
    if (ammo.mag <= 0) {
      if (!isReloading && ammo.reserve > 0) reload();
      return;
    }

    lastShotTime.current = now;
    setAmmo(prev => ({ ...prev, mag: prev.mag - 1 }));
    setStats(prev => ({ ...prev, shotsFired: prev.shotsFired + 1 }));
    sounds.playShot(currentWeapon);

    // Apply Recoil
    recoilOffset.current += weapon.recoil / 50;

    // Raycast for Hit Detection
    const spread = (Math.random() - 0.5) * weapon.spread;
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
    for (const enemy of enemies.current) {
        const dx = enemy.x - player.current.x;
        const dy = enemy.y - player.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > hitDist) continue;
        
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.atan2(Math.sin(angleToEnemy - shotAngle), Math.cos(angleToEnemy - shotAngle));
        
        if (Math.abs(angleDiff) < 0.1) {
            enemy.hp -= weapon.damage;
            hitSomething = true;
            sounds.playHit();
            spawnParticles(enemy.x, enemy.y, 'blood');
            if (enemy.hp <= 0) {
              enemy.dead = true;
              setStats(prev => ({ ...prev, kills: prev.kills + 1 }));
              setKillfeed(prev => [{ id: nextKillfeedId.current++, text: `ELIMINATED ${enemy.type.toUpperCase()}` }, ...prev].slice(0, 5));
              graveyard.current.push({ x: enemy.x, y: enemy.y, color: enemy.color, type: enemy.type });
              spawnParticles(enemy.x, enemy.y, 'explosion');
            }
        }
    }

    if (hitSomething) {
      setStats(prev => ({ ...prev, shotsHit: prev.shotsHit + 1 }));
    }

    // Spawn Shell Casing and Muzzle Flash
    spawnParticles(player.current.x, player.current.y, 'shell');
  };

  const reload = () => {
    if (isReloading || ammo.mag === WEAPONS[currentWeapon].magSize || ammo.reserve <= 0) return;
    setIsReloading(true);
    sounds.playReload();
    setTimeout(() => {
      const needed = WEAPONS[currentWeapon].magSize - ammo.mag;
      const taken = Math.min(needed, ammo.reserve);
      setAmmo(prev => ({
        mag: prev.mag + taken,
        reserve: prev.reserve - taken
      }));
      setIsReloading(false);
    }, WEAPONS[currentWeapon].reloadTime);
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
    if (gameState !== 'playing') return;

    // Player Movement
    let dx = 0; let dy = 0;
    const isW = keys.current['w'];
    const isS = keys.current['s'];
    const isA = keys.current['a'];
    const isD = keys.current['d'];
    const isShift = keys.current['shift'];

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
        sounds.playReload();
        return true;
      }
      return false;
    };

    if (tryMove(Math.floor(nx / CELL_SIZE), Math.floor(player.current.y / CELL_SIZE))) player.current.x = nx;
    if (tryMove(Math.floor(player.current.x / CELL_SIZE), Math.floor(ny / CELL_SIZE))) player.current.y = ny;

    // Apply Recoil Decay
    recoilOffset.current *= 0.9;
    player.current.pitch = clamp(player.current.pitch - recoilOffset.current * 5, -100, 100);

    // Enemy AI
    enemies.current = enemies.current.filter(e => !e.dead);
    enemies.current.forEach(e => {
      const pDx = player.current.x - e.x;
      const pDy = player.current.y - e.y;
      const dist = Math.sqrt(pDx * pDx + pDy * pDy);

      if (dist < 600) {
        e.angle = Math.atan2(pDy, pDx);
        
        let hasLineOfSight = true;
        const cos = Math.cos(e.angle);
        const sin = Math.sin(e.angle);
        for(let d = 0; d < dist; d += 16) {
             const tx = Math.floor((e.x + cos * d) / CELL_SIZE);
             const ty = Math.floor((e.y + sin * d) / CELL_SIZE);
             if (tx >= 0 && tx < MAP[0].length && ty >= 0 && ty < MAP.length) {
                 if (mapData.current[ty][tx] > 0 && mapData.current[ty][tx] !== 2) {
                     hasLineOfSight = false;
                     break;
                 }
             }
        }

        // Seek & Flank
        let nx = e.x;
        let ny = e.y;
        if (e.type === 'rusher') {
           nx += Math.cos(e.angle) * e.speed;
           ny += Math.sin(e.angle) * e.speed;
        } else if (dist > 200 || !hasLineOfSight) {
           nx += Math.cos(e.angle) * e.speed;
           ny += Math.sin(e.angle) * e.speed;
        }

        // Basic enemy collision
        const txX = Math.floor(nx / CELL_SIZE);
        const tyY = Math.floor(ny / CELL_SIZE);
        const curTx = Math.floor(e.x / CELL_SIZE);
        const curTy = Math.floor(e.y / CELL_SIZE);

        if (txX >= 0 && txX < MAP[0].length && curTy >= 0 && curTy < MAP.length && mapData.current[curTy][txX] === 0) e.x = nx;
        if (tyY >= 0 && tyY < MAP.length && curTx >= 0 && curTx < MAP[0].length && mapData.current[tyY][curTx] === 0) e.y = ny;

        // Shoot
        const now = Date.now();
        if (hasLineOfSight && dist < 450 && now - e.lastShot > (e.type === 'sniper' ? 2500 : 1000)) {
           e.lastShot = now;
           setHp(h => {
             const newH = h - (e.type === 'sniper' ? 40 : 12);
             if (newH <= 0 && gameState === 'playing') setGameState('dead');
             return newH;
           });
           
           // Tracer from enemy to player
           tracers.current.push({
             id: nextTracerId.current++,
             x1: e.x, y1: e.y,
             x2: player.current.x, y2: player.current.y,
             alpha: 1
           });

           // Add damage indicator
           const angleToEnemy = Math.atan2(pDy, pDx);
           const relativeAngle = angleToEnemy - player.current.angle;
           setDamageIndicators(prev => [
             ...prev, 
             { id: nextDamageId.current++, angle: relativeAngle, opacity: 1 }
           ].slice(-4));

           spawnParticles(player.current.x, player.current.y, 'blood');
           sounds.playShot(e.type === 'sniper' ? 'sniper' : 'pistol');
        }
      }
    });

    if (enemies.current.length < 4) spawnEnemies(2);

    // Update Tracers
    tracers.current.forEach(t => t.alpha -= 0.05);
    tracers.current = tracers.current.filter(t => t.alpha > 0);
    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
    });
    particles.current = particles.current.filter(p => p.life > 0);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zBuffer = new Array(RESOLUTION).fill(MAX_DEPTH);

    // Floor & Ceiling with Gradients/Ripples
    const floorGrad = ctx.createLinearGradient(0, canvas.height/2 + player.current.pitch, 0, canvas.height);
    floorGrad.addColorStop(0, '#1e293b');
    floorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, canvas.height/2 + player.current.pitch, canvas.width, canvas.height);

    // Ceiling
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, canvas.height/2 + player.current.pitch);
    ceilGrad.addColorStop(0, '#020617');
    ceilGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height/2 + player.current.pitch);

    // Water Puddles (Simulated)
    const time = Date.now();
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
        const px = (Math.sin(time / 1000 + i) + 0.5) * canvas.width;
        const py = (Math.cos(time / 1500 + i) + 0.5) * canvas.height / 4 + canvas.height * 0.6;
        const ripple = Math.sin(time / 200 + i) * 10;
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.ellipse(px, py + player.current.pitch, 50 + ripple, 20 + ripple/2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Raycasting Walls
    for (let i = 0; i < RESOLUTION; i++) {
        const rayAngle = (player.current.angle - FOV / 2) + (i / RESOLUTION) * FOV;
        const cos = Math.cos(rayAngle);
        const sin = Math.sin(rayAngle);

        let dist = 0;
        let hitWall = false;
        let wallType = 0;

        while (!hitWall && dist < MAX_DEPTH) {
            dist += 4;
            const testX = Math.floor((player.current.x + cos * dist) / CELL_SIZE);
            const testY = Math.floor((player.current.y + sin * dist) / CELL_SIZE);

            if (Number.isNaN(testX) || Number.isNaN(testY) || testX < 0 || testX >= MAP[0].length || testY < 0 || testY >= MAP.length) {
                hitWall = true;
                dist = MAX_DEPTH;
            } else {
                const cell = mapData.current[testY][testX];
                if (cell > 0) {
                    hitWall = true;
                    wallType = cell;
                }
            }
        }

        // Correct Fish-eye
        const correctedDist = dist * Math.cos(rayAngle - player.current.angle);
        zBuffer[i] = correctedDist;
        const wallHeight = (CELL_SIZE * canvas.height) / correctedDist;

        // Render strips
        const brightness = clamp(255 - (correctedDist / MAX_DEPTH) * 255, 0, 255);
        ctx.fillStyle = 
          wallType === 1 ? `rgb(${brightness},${brightness},${brightness})` : 
          wallType === 2 ? `rgb(${brightness*0.6},${brightness*0.4},${brightness*0.3})` : // Doors
          wallType === 3 ? `rgb(${brightness},${brightness*0.8},${0})` : // Barrels
          `rgb(${brightness * 0.4},${brightness * 0.4},${brightness * 0.4})`;
        
        ctx.fillRect(i * (canvas.width / RESOLUTION), (canvas.height / 2) - (wallHeight / 2) + player.current.pitch, (canvas.width / RESOLUTION) + 1, wallHeight);
    }

    // Draw Dead Bodies (Graveyard)
    const deadToDraw = graveyard.current
        .map(e => ({ ...e, dx: e.x - player.current.x, dy: e.y - player.current.y }))
        .map(e => ({ ...e, dist: Math.sqrt(e.dx*e.dx + e.dy*e.dy) }))
        .filter(e => e.dist > 10 && e.dist < MAX_DEPTH)
        .sort((a, b) => b.dist - a.dist);

    for (const e of deadToDraw) {
        let angleToEnemy = Math.atan2(e.dy, e.dx) - player.current.angle;
        while (angleToEnemy < -Math.PI) angleToEnemy += 2 * Math.PI;
        while (angleToEnemy > Math.PI) angleToEnemy -= 2 * Math.PI;

        if (Math.abs(angleToEnemy) > FOV) continue;

        const enemyDist = e.dist * Math.cos(angleToEnemy);
        const screenX = (0.5 * (angleToEnemy / (FOV / 2)) + 0.5) * canvas.width;
        
        const spriteHeight = (CELL_SIZE * canvas.height) / enemyDist;
        const spriteWidth = spriteHeight * 0.8;
        const screenY = (canvas.height / 2) + player.current.pitch + (CELL_SIZE * 0.4 * canvas.height) / enemyDist;

        const rayIdx = Math.floor((screenX / canvas.width) * RESOLUTION);
        if (rayIdx >= 0 && rayIdx < RESOLUTION && enemyDist < zBuffer[rayIdx]) {
            ctx.fillStyle = e.color + '88';
            ctx.fillRect(screenX - spriteWidth / 2, screenY, spriteWidth, 10);
        }
    }

    // Draw Enemies (Sprites)
    const enemiesToDraw = enemies.current
        .map(e => ({ ...e, dx: e.x - player.current.x, dy: e.y - player.current.y }))
        .map(e => ({ ...e, dist: Math.sqrt(e.dx*e.dx + e.dy*e.dy) }))
        .filter(e => e.dist > 10)
        .sort((a, b) => b.dist - a.dist);

    for (const e of enemiesToDraw) {
        let angleToEnemy = Math.atan2(e.dy, e.dx) - player.current.angle;
        while (angleToEnemy < -Math.PI) angleToEnemy += 2 * Math.PI;
        while (angleToEnemy > Math.PI) angleToEnemy -= 2 * Math.PI;

        if (Math.abs(angleToEnemy) > FOV) continue;

        const enemyDist = e.dist * Math.cos(angleToEnemy);
        const screenX = (0.5 * (angleToEnemy / (FOV / 2)) + 0.5) * canvas.width;
        
        const spriteHeight = (CELL_SIZE * canvas.height) / enemyDist;
        const spriteWidth = spriteHeight * 0.6;
        const screenY = (canvas.height / 2) - (spriteHeight / 2) + player.current.pitch + (CELL_SIZE * 0.2 * canvas.height) / enemyDist;

        const startX = Math.max(0, Math.floor(screenX - spriteWidth / 2));
        const endX = Math.min(canvas.width, Math.floor(screenX + spriteWidth / 2));

        for (let x = startX; x < endX; x += 4) { // Render in strips
            const rayIdx = Math.floor((x / canvas.width) * RESOLUTION);
            if (rayIdx >= 0 && rayIdx < RESOLUTION && enemyDist < zBuffer[rayIdx]) {
                ctx.fillStyle = e.type === 'rusher' ? '#ef4444' : e.type === 'sniper' ? '#eab308' : '#3b82f6';
                ctx.fillRect(x, screenY, 5, spriteHeight);
                
                // Simple eye visor
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, screenY + spriteHeight * 0.2, 5, spriteHeight * 0.1);
            }
        }
    }

    // Draw Particles
    const particlesToDraw = particles.current
        .map(p => ({ ...p, dx: p.x - player.current.x, dy: p.y - player.current.y }))
        .map(p => ({ ...p, dist: Math.sqrt(p.dx*p.dx + p.dy*p.dy) }))
        .filter(p => p.dist > 10)
        .sort((a, b) => b.dist - a.dist);

    for (const p of particlesToDraw) {
        let angleTo = Math.atan2(p.dy, p.dx) - player.current.angle;
        while (angleTo < -Math.PI) angleTo += 2 * Math.PI;
        while (angleTo > Math.PI) angleTo -= 2 * Math.PI;

        if (Math.abs(angleTo) > FOV) continue;

        const pDist = p.dist * Math.cos(angleTo);
        const screenX = (0.5 * (angleTo / (FOV / 2)) + 0.5) * canvas.width;
        
        const size = (p.size * canvas.height) / pDist;
        const screenY = (canvas.height / 2) + player.current.pitch + (CELL_SIZE * 0.2 * canvas.height) / pDist;

        const rayIdx = Math.floor((screenX / canvas.width) * RESOLUTION);
        if (rayIdx >= 0 && rayIdx < RESOLUTION && pDist < zBuffer[rayIdx]) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
            ctx.globalAlpha = 1;
        }
    }

    // Draw Tracers in 3D (Simulated lines)
    tracers.current.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      // We draw from player center to a point (very rough approximation for "flash")
      ctx.beginPath();
      ctx.moveTo(canvas.width/2, canvas.height/2 + player.current.pitch);
      ctx.lineTo(canvas.width/2 + (Math.random()-0.5)*100, canvas.height/2 + 200);
      ctx.stroke();
      ctx.restore();
    });

    // Holographic Mini-map
    const mmSize = 150;
    const mmPad = 30;
    ctx.save();
    ctx.translate(mmSize/2 + mmPad, mmSize/2 + mmPad);
    
    // Draw Border
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, mmSize/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rotate map for player orientation
    ctx.rotate(-player.current.angle - Math.PI / 2);
    
    // Clip map
    ctx.beginPath();
    ctx.arc(0, 0, mmSize/2, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fill();
    
    const scale = mmSize / (10 * CELL_SIZE);
    ctx.translate(-player.current.x * scale, -player.current.y * scale);
    
    // Walls in Map
    MAP.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell !== 0) {
                ctx.fillStyle = cell === 1 ? 'rgba(0, 255, 255, 0.4)' : cell === 2 ? 'orange' : 'red';
                ctx.fillRect(x * CELL_SIZE * scale, y * CELL_SIZE * scale, CELL_SIZE * scale - 1, CELL_SIZE * scale - 1);
            }
        });
    });
    
    // Enemies in Map
    enemies.current.forEach(e => {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(e.x * scale, e.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.restore();
    
    // Player on Map
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(mmSize/2 + mmPad, mmSize/2 + mmPad, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Weapon
    const weapon = WEAPONS[currentWeapon];
    const t = Date.now();
    const isMoving = Math.abs(player.current.velX) + Math.abs(player.current.velY) > 0;
    
    // Sway & Bob
    const bob = isMoving ? Math.sin(t / 150) * 5 : Math.sin(t / 500) * 2;
    const swayX = Math.cos(t / 500) * 8 * (isMoving ? 1.5 : 1);
    const swayY = Math.sin(t / 500) * 4 + bob;
    
    const ads = player.current.adsProgress;

    // Sniper Scope Overlay
    if (currentWeapon === 'sniper' && ads > 0.9) {
        ctx.save();
        ctx.fillStyle = '#000';
        // Black out sides
        const scopeRadius = canvas.height * 0.4;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + player.current.pitch;
        
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2, true);
        ctx.fill();
        
        // Lens effect
        const lensGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scopeRadius);
        lensGrad.addColorStop(0, 'transparent');
        lensGrad.addColorStop(0.9, 'rgba(0, 255, 255, 0.05)');
        lensGrad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - scopeRadius, centerY); ctx.lineTo(centerX + scopeRadius, centerY);
        ctx.moveTo(centerX, centerY - scopeRadius); ctx.lineTo(centerX, centerY + scopeRadius);
        ctx.stroke();
        
        ctx.restore();
    }

    // Crosshair
    if (!(currentWeapon === 'sniper' && ads > 0.9)) {
        ctx.strokeStyle = player.current.isAds ? 'rgba(34, 197, 94, 0.5)' : '#22c55e';
        ctx.lineWidth = 2;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + player.current.pitch;
        const size = player.current.isAds ? 5 : 10;
        ctx.beginPath();
        ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
        ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
        ctx.stroke();
    }

    // Weapon rendering has been moved to 3D Component

    // Damage Indicators
    damageIndicators.forEach(ind => {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(ind.angle);
      ctx.beginPath();
      ctx.moveTo(80, -20);
      ctx.lineTo(110, 0);
      ctx.lineTo(80, 20);
      ctx.strokeStyle = `rgba(239, 68, 68, ${ind.opacity})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    });

    // Score Feed (Kill Messages)
    ctx.font = 'bold 16px font-mono';
    ctx.textAlign = 'right';
    killfeed.forEach((msg, idx) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - idx * 0.2})`;
      ctx.fillText(msg.text, canvas.width - 20, 100 + idx * 30);
    });

    // Flash/Damage FX
    if (hp < 30) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const loop = setInterval(() => {
      update();
      draw();
    }, TICK_RATE);
    return () => clearInterval(loop);
  }, [gameState, currentWeapon, hp, ammo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === 'r') reload();
      if (['1','2','3','4'].includes(e.key)) {
        const weaponMap: Record<string, WeaponType> = { '1': 'pistol', '2': 'rifle', '3': 'shotgun', '4': 'sniper' };
        const next = weaponMap[e.key];
        setCurrentWeapon(next);
        setAmmo(prev => ({ ...prev, mag: WEAPONS[next].magSize }));
        setIsReloading(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) keys.current['m_right'] = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) keys.current['m_right'] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (gameState !== 'playing' || document.pointerLockElement !== canvasRef.current) return;
        const speed = player.current.isAds ? 0.001 : 0.003;
        player.current.angle += e.movementX * speed;
        player.current.pitch = clamp(player.current.pitch - e.movementY * 0.5, -200, 200);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
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
  }, [gameState, currentWeapon, isReloading]);

  const togglePointerLock = () => {
    if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.2),transparent)]" />
      </div>

      {/* Main Game Container */}
      <div className="relative group shadow-2xl shadow-blue-900/20 border-4 border-slate-800 rounded-xl overflow-hidden aspect-[4/3] max-w-[800px] w-full bg-black">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full cursor-crosshair"
          onClick={togglePointerLock}
          onMouseDown={(e) => { if (e.button === 0) handleShoot(); }}
        />

        {/* HUD Elements */}
        {gameState === 'playing' && (
          <>
            <Weapon3D 
              type={currentWeapon} 
              isReloading={isReloading} 
              isAds={player.current.isAds} 
              recoilOffset={recoilOffset.current} 
            />
            {/* Top Stats */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Target size={16} />
                  <span className="font-mono text-xl font-bold">{stats.kills}</span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex items-center gap-2 text-blue-400">
                  <Shield size={16} />
                  <span className="font-mono text-xl font-bold">{Math.round(hp)}%</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-mono flex items-center gap-2">
                    <Terminal size={14} className="text-green-500" />
                    SYSTEM_STABLE_V2.1 
                 </div>
              </div>
            </div>

            {/* Weapon & Ammo Card */}
            <div className="absolute bottom-6 right-6 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-xl border-l-4 border-yellow-500 p-4 rounded-xl flex items-center gap-6 shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Weapon System</span>
                  <span className="text-2xl font-black text-white italic tracking-tighter uppercase">{WEAPONS[currentWeapon].name}</span>
                </div>
                <div className="h-12 w-px bg-slate-700/50" />
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-mono font-bold ${ammo.mag < 5 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                    {isReloading ? '--' : ammo.mag}
                  </span>
                  <span className="text-xl font-mono text-slate-500 mb-1">/ {ammo.reserve}</span>
                </div>
              </div>
              {isReloading && (
                <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: WEAPONS[currentWeapon].reloadTime / 1000 }}
                    className="h-full bg-yellow-500" 
                  />
                </div>
              )}
            </div>

            {/* Health Bar Bottom */}
            <div className="absolute bottom-6 left-6 w-48">
               <div className="h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                  <motion.div 
                    animate={{ width: `${hp}%` }}
                    className={`h-full ${hp < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                  />
               </div>
               <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                  <span>Armor Integrity</span>
                  <span>{hp}%</span>
               </div>
            </div>
          </>
        )}

        {/* Start / Dead Overlays */}
        <AnimatePresence>
          {(gameState === 'start' || gameState === 'dead') && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center"
            >
              {gameState === 'start' ? (
                <>
                  <motion.div 
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  >
                    <Smartphone className="text-blue-500" size={40} />
                  </motion.div>
                  <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2 uppercase">Raycast Ops</h1>
                  <p className="text-slate-400 max-w-sm mb-12">Tactical 3D combat simulation with advanced AI, destructible environments, and mobile weapon progression.</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-12 w-full max-w-md text-sm">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-left">
                       <span className="block text-slate-500 uppercase text-[10px] font-bold mb-2">Controls</span>
                       <ul className="space-y-1 text-slate-300">
                          <li>WASD - Movement</li>
                          <li>MOUSE - Aim & Fire</li>
                          <li>1,2,3,4 - Change Weapon</li>
                          <li>R - Reload</li>
                       </ul>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-left">
                       <span className="block text-slate-500 uppercase text-[10px] font-bold mb-2">Features</span>
                       <ul className="space-y-1 text-slate-300">
                          <li>Advanced Enemy AI</li>
                          <li>4 Weapon Classes</li>
                          <li>Mobile Support</li>
                          <li>Dynamic FX</li>
                       </ul>
                    </div>
                  </div>

                  <button 
                    onClick={initGame}
                    className="px-12 py-4 bg-white text-slate-950 font-black uppercase text-xl rounded-full hover:bg-yellow-500 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                  >
                    Request Deployment
                  </button>
                </>
              ) : (
                <>
                  <Skull className="text-red-500 mb-6" size={64} />
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Mission Failed</h2>
                  <p className="text-slate-500 mb-8 uppercase tracking-widest text-xs">Operator Terminated In Sector 7</p>
                  
                  <div className="grid grid-cols-3 gap-6 mb-12 border-y border-slate-800 py-8 w-full max-w-md">
                    <div className="flex flex-col items-center">
                       <span className="text-slate-500 text-[10px] font-bold uppercase mb-1">Kills</span>
                       <span className="text-3xl font-black text-white">{stats.kills}</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-slate-500 text-[10px] font-bold uppercase mb-1">Accuracy</span>
                       <span className="text-3xl font-black text-yellow-500">
                         {stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0}%
                       </span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-slate-500 text-[10px] font-bold uppercase mb-1">Status</span>
                       <span className="text-3xl font-black text-red-500 italic uppercase">KIA</span>
                    </div>
                  </div>

                  <button 
                    onClick={initGame}
                    className="px-10 py-4 bg-red-500 text-white font-black uppercase text-xl rounded-full hover:bg-red-400 transition-colors shadow-2xl flex items-center gap-3"
                  >
                    <RefreshCcw size={24} />
                    Re-Deploy
                  </button>
                  <p className="mt-8 text-slate-600 font-mono text-[10px]">RECOVERY_TOKEN: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Responsive Info/Controls */}
      <div className="mt-8 flex gap-8 items-center text-slate-500 text-sm font-medium">
         <div className="flex items-center gap-2">
            <Move size={16} /> w/a/s/d to move
         </div>
         <div className="flex items-center gap-2">
            <Zap size={16} /> 1-4 switch weapon
         </div>
         <button 
            onClick={() => setMobileMode(!mobileMode)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${mobileMode ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-slate-800'}`}
         >
            <Smartphone size={16} /> Enable Touch UI
         </button>
      </div>

      {/* Mobile Virtual Controls Overlay */}
      {mobileMode && gameState === 'playing' && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Virtual Joystick Target Area - Left Half */}
          <div 
             className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-slate-900/20 border-2 border-slate-700/30 flex items-center justify-center pointer-events-auto"
             onPointerDown={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               joystick.current = { active: true, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY };
               e.currentTarget.setPointerCapture(e.pointerId);
             }}
             onPointerMove={(e) => {
               if (joystick.current.active) {
                 joystick.current.curX = e.clientX;
                 joystick.current.curY = e.clientY;
               }
             }}
             onPointerUp={() => joystick.current.active = false}
          >
             <div className="w-12 h-12 bg-white/10 rounded-full border border-white/20" />
          </div>

          {/* Action Buttons - Right Half */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end gap-6 pointer-events-auto">
             <button 
                onPointerDown={handleShoot}
                className="w-24 h-24 bg-red-600 rounded-full border-4 border-red-400 shadow-2xl flex items-center justify-center animate-pulse"
             >
                <Target size={40} className="text-white" />
             </button>
             <div className="flex gap-4">
                <button onClick={reload} className="w-16 h-16 bg-slate-800 rounded-full border-2 border-slate-600 flex items-center justify-center">
                  <RefreshCcw size={20} className="text-white" />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
