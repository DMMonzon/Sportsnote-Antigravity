
import React, { useState, useRef, useEffect } from 'react';
import { Possession, Team } from '../types';

interface PitchMapProps {
    possession: Possession;
    isRunning: boolean;
    isLandscape: boolean;
    isFlipped: boolean;
    teamHome?: Team;
    teamAway?: Team;
    onAction: (type: string, nextPoss: Possession, x: number, y: number, details?: string) => void;
    onManualMenu: (x: number, y: number) => void;
}

interface Glow {
    id: number;
    x: number;
    y: number;
    color: string;
    isArrow?: boolean;
    angle?: number;
}

export const PitchMap: React.FC<PitchMapProps> = ({
    possession,
    isRunning,
    isLandscape,
    isFlipped,
    teamHome,
    teamAway,
    onAction,
    onManualMenu,
}) => {
    const [glows, setGlows] = useState<Glow[]>([]);
    const tapCount = useRef(0);
    const tapTimer = useRef<number | null>(null);
    const pointerStart = useRef<{ x: number, y: number, t: number } | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const isGestureActive = useRef(false);
    const [foulPulse, setFoulPulse] = React.useState(false);
    const [overrideAngle, setOverrideAngle] = React.useState<number | null>(null);

    const prevPossession = useRef<Possession>(possession);

    const triggerFoulAnimation = (angle?: number) => {
        if (angle !== undefined) setOverrideAngle(angle);
        setFoulPulse(true);
        setTimeout(() => {
            setFoulPulse(false);
            setOverrideAngle(null);
        }, 800);
    };

    const currentAttackAngle = React.useMemo(() => {
        if (possession === Possession.NONE) return null;
        let dy_pitch = possession === Possession.HOME ? -1 : 1;
        
        const getScreenCoords = (px: number, py: number) => {
            let x = px;
            let y = py;
            if (isFlipped) {
                x = 100 - x;
                y = 100 - y;
            }
            if (isLandscape) {
                return { vx: y, vy: 100 - x };
            }
            return { vx: x, vy: y };
        };
        
        const startS = getScreenCoords(50, 50);
        const endS = getScreenCoords(50, 50 + dy_pitch * 10);
        const dx = endS.vx - startS.vx;
        const dy = endS.vy - startS.vy;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }, [possession, isLandscape, isFlipped]);

    const addGlow = (vx: number, vy: number, color: string, isArrow = false, angle = 0) => {
        const id = Date.now() + Math.random();
        setGlows(prev => [...prev, { id, x: vx, y: vy, color, isArrow, angle }]);
        setTimeout(() => setGlows(prev => prev.filter(g => g.id !== id)), 1000);
    };

    const getSector = (x: number, y: number): string => {
        const isTop = y < 50;
        const sideSuffix = isTop ? 'Rival' : 'Propia';
        const lane = x < 33.3 ? 'Izquierda' : x < 66.6 ? 'Centro' : 'Derecha';
        const centerY = isTop ? 0 : 100;

        // Hockey Area (D-zone) is a semi-circle of 14.63m radius (16 yards).
        // Standard Field: 91.4m Long (Y-axis) x 55m Wide (X-axis).
        // Scaling to 0-100 units:
        const radiusY = (14.63 / 91.4) * 100; // ~16.0 units
        const radiusX = (14.63 / 55) * 100;    // ~26.6 units
        
        // Hitbox Tolerance: Add a buffer (approx 8px on standard screens) to "attract" edge taps
        const bufferX = 2.0; 
        const bufferY = 1.2;

        // Euclidean distance check with aspect correction and INCLUSIVE logic (<=)
        const dx = x - 50;
        const dy = y - centerY;
        const isArea = Math.pow(dx / (radiusX + bufferX), 2) + Math.pow(dy / (radiusY + bufferY), 2) <= 1;

        if (isArea) {
            const dy_abs = isTop ? y : 100 - y;
            const dx_abs = x - 50;
            const angle = (Math.atan2(dy_abs, dx_abs) * 180) / Math.PI; // 0 to 180

            let fanSector = '';
            if (angle < 36) fanSector = 'Extremo Derecho';
            else if (angle >= 36 && angle < 72) fanSector = 'Centro Derecha';
            else if (angle >= 72 && angle < 108) fanSector = 'Centro';
            else if (angle >= 108 && angle < 144) fanSector = 'Centro Izquierda';
            else fanSector = 'Extremo Izquierdo';

            return `Área ${isTop ? 'Rival' : 'Propia'} ${fanSector}`;
        }

        // 23m line (25 yard line) is at 22.9m / 91.4m = 25% height
        // Refined boundaries: Inclusive (<= 25 or >= 75) for 23y zones, Exclusive (> 25 and < 75) for transition.
        if (y <= 25 || y >= 75) {
            return `23 yardas ${sideSuffix} ${lane}`;
        }

        return `Transición ${sideSuffix} ${lane}`;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isRunning) return;
        isGestureActive.current = false;
        const rect = e.currentTarget.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * 100;
        const vy = ((e.clientY - rect.top) / rect.height) * 100;
        pointerStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };

        longPressTimer.current = window.setTimeout(() => {
            isGestureActive.current = true;
            if (navigator.vibrate) navigator.vibrate(100);
            addGlow(vx, vy, 'green');
            const coords = getMappedCoords(vx, vy);
            onManualMenu(coords.x, coords.y);
        }, 600);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isRunning || !pointerStart.current) return;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        if (isGestureActive.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * 100;
        const vy = ((e.clientY - rect.top) / rect.height) * 100;
        const duration = Date.now() - pointerStart.current.t;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;

        // Swipe Vector Logic
        if (Math.sqrt(dx * dx + dy * dy) > 40 && duration < 500) {
            e.preventDefault();
            e.stopPropagation();
            isGestureActive.current = true;
            tapCount.current = 0;
            if (tapTimer.current) {
                clearTimeout(tapTimer.current);
                tapTimer.current = null;
            }
            
            const startVx = ((pointerStart.current.x - rect.left) / rect.width) * 100;
            const startVy = ((pointerStart.current.y - rect.top) / rect.height) * 100;
            const startC = getMappedCoords(startVx, startVy);
            const endC = getMappedCoords(vx, vy);
            const dy_pitch = endC.y - startC.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Check if start position is in Area or 23y using the same logic as getSector
            const startSector = getSector(startC.x, startC.y);
            const inAreaStart = startSector.includes('Área');
            const in23Start = startSector.includes('23 yardas');
            const inTargetZone = inAreaStart || in23Start;

            // If swipe STARTED inside 23 yards/Area AND is towards a goal (significant dy_pitch)
            if (inTargetZone && Math.abs(dy_pitch) > 1) {
                // Determine which team is attacking the goal the swipe points to
                const attackingTeam = dy_pitch < 0 ? Possession.HOME : Possession.AWAY;
                const ownColor = attackingTeam === Possession.HOME ? (teamHome?.primaryColor || '#6d5dfc') : (teamAway?.primaryColor || '#ef4444');
                addGlow(startVx, startVy, ownColor, false);
                triggerFoulAnimation(angle);
                onAction('FALTA A FAVOR EN 23', attackingTeam, startC.x, startC.y, 'Falta en zona de peligro');
                return;
            }

            const isTowardsOwn = possession === Possession.HOME ? dy_pitch > 0 : dy_pitch < 0;
            const isTowardsRival = possession === Possession.HOME ? dy_pitch < 0 : dy_pitch > 0;
            
            if (isTowardsOwn) {
                const oppColor = possession === Possession.HOME ? (teamAway?.primaryColor || '#ef4444') : (teamHome?.primaryColor || '#6d5dfc');
                addGlow(startVx, startVy, oppColor, false);
                triggerFoulAnimation(angle);
                const oppPoss = possession === Possession.HOME ? Possession.AWAY : Possession.HOME;
                // If focus is on cards for outside fouls, we send "Falta Cometida" to trigger the card modal
                onAction('Falta Cometida', oppPoss, startC.x, startC.y, 'Deslizar hacia arco propio (Falta cometida)');
            } else if (isTowardsRival) {
                const ownColor = possession === Possession.HOME ? (teamHome?.primaryColor || '#6d5dfc') : (teamAway?.primaryColor || '#ef4444');
                addGlow(startVx, startVy, ownColor, false);
                triggerFoulAnimation(angle);
                // Also trigger card modal for rival foul if outside 23
                onAction('Falta Cometida', possession, startC.x, startC.y, 'Deslizar hacia arco rival (Falta a favor)');
            }
            return;
        }

        // Tap
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            handleTap(vx, vy);
        }
    };

    const getMappedCoords = (vx: number, vy: number) => {
        let x = vx;
        let y = vy;

        if (isLandscape) {
            x = 100 - vy;
            y = vx;
        }

        if (isFlipped) {
            x = 100 - x;
            y = 100 - y;
        }

        return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
    };

    const handleTap = (vx: number, vy: number) => {
        const coords = getMappedCoords(vx, vy);
        const { x, y } = coords;
        const sector = getSector(x, y);

        // Detect tap specifically on the GOAL (Arco) for Shots
        // Goal Width is 20% (40 to 60), Height is 5% visual, ~8% hit-box for comfort
        // Restriction: Only clickable if the team with possession is attacking that goal.
        const isTopGoal = y <= 8 && x >= 40 && x <= 60;
        const isBottomGoal = y >= 92 && x >= 40 && x <= 60;

        let isGoalTap = false;
        if (possession === Possession.HOME && isTopGoal) isGoalTap = true;
        if (possession === Possession.AWAY && isBottomGoal) isGoalTap = true;

        if (isGoalTap) {
            addGlow(vx, vy, 'green');
            onAction('DISPARO', possession, x, y, `Disparo al arco: ${y < 50 ? 'Rival' : 'Propio'}`);
            return;
        }

        tapCount.current += 1;
        if (tapTimer.current) clearTimeout(tapTimer.current);

        if (tapCount.current === 2) {
            tapCount.current = 0;
            // Double Tap
            if (possession === Possession.HOME) {
                // LOSS
                addGlow(vx, vy, 'red');
                onAction('PÉRDIDA', Possession.AWAY, x, y, `Sector: ${sector}`);
                return;
            } else if (possession === Possession.AWAY) {
                // RIVAL ENTRY
                if (sector.includes('Área')) {
                    addGlow(vx, vy, 'red');
                    onAction('Ingreso Rival en área', Possession.AWAY, x, y, `Sector: ${sector}`);
                    return;
                } else if (sector.includes('23 yardas') && (y >= 75)) {
                    addGlow(vx, vy, 'red');
                    onAction('Ingreso rival en 23', Possession.AWAY, x, y, `Sector: ${sector}`);
                    return;
                }
            }
        } else {
            tapTimer.current = window.setTimeout(() => {
                tapCount.current = 0;
                // Single Tap
                if (possession === Possession.HOME) {
                    // ENTRY - Prioridad Área > 23 Yardas
                    if (sector.includes('Área')) {
                        addGlow(vx, vy, 'green');
                        onAction('Ingreso en área', Possession.HOME, x, y, `Sector: ${sector}`);
                        return;
                    } else if (sector.includes('23 yardas') && (y <= 25)) {
                        addGlow(vx, vy, 'green');
                        onAction('Ingreso en 23', Possession.HOME, x, y, `Sector: ${sector}`);
                        return;
                    }
                } else if (possession === Possession.AWAY) {
                    // RECOVER
                    addGlow(vx, vy, 'green');
                    onAction('Recupero', Possession.HOME, x, y, `Sector: ${sector}`);
                    return;
                }
            }, 300);
        }
    };

    const homeColor = teamHome?.primaryColor || '#6d5dfc';
    const awayColor = teamAway?.primaryColor || '#ef4444';

    useEffect(() => {
        if (possession !== Possession.NONE && possession !== prevPossession.current && isRunning) {
            let dy_pitch = possession === Possession.HOME ? -1 : 1;
            const getScreenCoords = (px: number, py: number) => {
                let x = px;
                let y = py;
                if (isFlipped) {
                    x = 100 - x;
                    y = 100 - y;
                }
                if (isLandscape) {
                    return { vx: y, vy: 100 - x };
                }
                return { vx: x, vy: y };
            };
            
            const startS = getScreenCoords(50, 50);
            const endS = getScreenCoords(50, 50 + dy_pitch * 10);
            const dx = endS.vx - startS.vx;
            const dy = endS.vy - startS.vy;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            const teamColor = possession === Possession.HOME ? homeColor : awayColor;
            addGlow(50, 50, teamColor, false); // Removed small arrow from center, only glow
        }
        prevPossession.current = possession;
    }, [possession, isRunning, isLandscape, isFlipped, homeColor, awayColor]);

    const radialLines = React.useMemo(() => {
        const rx = (14.63 / 55) * 100 + 2.0; // radiusX + bufferX
        const ry = (14.63 / 91.4) * 100 + 1.2; // radiusY + bufferY
        return [36, 72, 108, 144].map(angleDeg => {
            const rad = angleDeg * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const r = 1 / Math.sqrt(Math.pow(cos / rx, 2) + Math.pow(sin / ry, 2));
            return { dx: r * cos, dy: r * sin };
        });
    }, []);

    const toScreen = React.useCallback((logicX: number, logicY: number) => {
        if (isLandscape) {
            return { x: logicY, y: 100 - logicX };
        }
        return { x: logicX, y: logicY };
    }, [isLandscape]);

    return (
        <div
            className="w-full h-full bg-[#3d63b8] relative cursor-crosshair overflow-hidden touch-none select-none transition-all duration-700"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                tapCount.current = 0;
            }}
        >
            {/* Attack Direction Arrow (Big background arrow) */}
            <div 
                className={`absolute top-1/2 left-1/2 pointer-events-none transition-all duration-1000 ease-in-out ${foulPulse ? 'animate-foul-pulse z-[110]' : 'opacity-20 z-10'}`}
                style={{ 
                    transform: `translate(-50%, -50%) rotate(${(isRunning && possession !== Possession.NONE) ? (overrideAngle ?? currentAttackAngle) : 0}deg)`,
                    width: 'clamp(200px, 60vw, 400px)',
                    height: 'clamp(200px, 60vw, 400px)',
                }}
            >
                {isRunning && possession !== Possession.NONE && currentAttackAngle !== null ? (
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" stroke={possession === Possession.HOME ? (teamHome?.primaryColor || '#6d5dfc') : (teamAway?.primaryColor || '#ef4444')} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-2xl">
                        <line x1="2" y1="12" x2="22" y2="12" strokeWidth="4"></line>
                        <polyline points="12 2 22 12 12 22" strokeWidth="4"></polyline>
                    </svg>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <svg width="40%" height="40%" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-xl">
                            <rect x="6" y="4" width="5" height="16" rx="1" />
                            <rect x="13" y="4" width="5" height="16" rx="1" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Field Markings */}
            <div className={`absolute inset-0 pointer-events-none transition-transform duration-700`}>
                {/* Tactical Reference Lines (Mathematical Exact Logic) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <g stroke="#000000" strokeWidth="0.5" vectorEffect="non-scaling-stroke">
                        {/* Lanes */}
                        <line x1={toScreen(33.3, 0).x} y1={toScreen(33.3, 0).y} x2={toScreen(33.3, 100).x} y2={toScreen(33.3, 100).y} strokeDasharray="4,4" />
                        <line x1={toScreen(66.6, 0).x} y1={toScreen(66.6, 0).y} x2={toScreen(66.6, 100).x} y2={toScreen(66.6, 100).y} strokeDasharray="4,4" />

                        {/* Radial Areas */}
                        {radialLines.map((pt, i) => {
                            const topStart = toScreen(50, 0);
                            const topEnd = toScreen(50 + pt.dx, pt.dy);
                            const botStart = toScreen(50, 100);
                            const botEnd = toScreen(50 + pt.dx, 100 - pt.dy);
                            return (
                                <React.Fragment key={i}>
                                    <line x1={topStart.x} y1={topStart.y} x2={topEnd.x} y2={topEnd.y} strokeDasharray="2,2" />
                                    <line x1={botStart.x} y1={botStart.y} x2={botEnd.x} y2={botEnd.y} strokeDasharray="2,2" />
                                </React.Fragment>
                            );
                        })}
                    </g>
                </svg>

                <div className="absolute inset-[2%] border-2 border-white/60 overflow-hidden z-10">
                    {/* Goals (Rectángulos planos sobre línea de fondo) */}
                    {isLandscape ? (
                        <>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] opacity-60 rounded-sm" style={{ backgroundColor: awayColor }} />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] opacity-60 rounded-sm" style={{ backgroundColor: homeColor }} />
                        </>
                    ) : (
                        <>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[5%] w-[20%] opacity-60 rounded-sm" style={{ backgroundColor: awayColor }} />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[5%] w-[20%] opacity-60 rounded-sm" style={{ backgroundColor: homeColor }} />
                        </>
                    )}

                    {/* Middle Line & 23m */}
                    {isLandscape ? (
                        <>
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60" />
                            <div className="absolute left-[25%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/40" />
                            <div className="absolute right-[25%] top-0 bottom-0 w-px border-r-2 border-dashed border-white/40" />

                            {/* D-Areas Hockey Style - Width based on RadiusX (~26.6 * 2), Height on RadiusY (~16 * 2) */}
                            {/* Top/Away Circle */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[53.2%] h-[60%] border-2 border-white/60 rounded-full -translate-x-1/2" />

                            {/* Bottom/Home Circle */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[53.2%] h-[60%] border-2 border-white/60 rounded-full translate-x-1/2" />
                        </>
                    ) : (
                        <>
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60" />
                            <div className="absolute top-[25%] left-0 right-0 h-px border-t-2 border-dashed border-white/40" />
                            <div className="absolute bottom-[25%] left-0 right-0 h-px border-b-2 border-dashed border-white/40" />

                            {/* D-Areas Hockey Style - Width based on RadiusX (~26.6 * 2), Height on RadiusY (~16 * 2) */}
                            {/* Top/Away Circle */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[53.2%] h-[32%] border-2 border-white/60 rounded-full -translate-y-1/2" />

                            {/* Bottom/Home Circle */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[53.2%] h-[32%] border-2 border-white/60 rounded-full translate-y-1/2" />
                        </>
                    )}

                    {/* Mid-point circle */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
                </div>
            </div>

            {/* Visual Indicators */}
            <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
                {glows.map(g => (
                    <div
                        key={g.id}
                        className={`absolute flex items-center justify-center transition-all duration-700 animate-in fade-in zoom-in-75 ${
                            g.isArrow ? 'w-24 h-24' : 'w-16 h-16 rounded-full blur-xl opacity-80 animate-ping'
                        }`}
                        style={{
                            left: `${g.x}%`,
                            top: `${g.y}%`,
                            transform: `translate(-50%, -50%) ${g.isArrow ? `rotate(${g.angle}deg)` : ''}`,
                            backgroundColor: !g.isArrow ? (g.color === 'green' ? '#34d399' : g.color === 'red' ? '#ef4444' : g.color === 'yellow' ? '#facc15' : g.color) : 'transparent',
                        }}
                    >
                        {!g.isArrow ? (
                            <div className="w-full h-full rounded-full border-2 border-white/30 opacity-50" />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-90 transition-opacity">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" strokeWidth="3" stroke={g.color} strokeLinecap="round" strokeLinejoin="round" className="animate-pulse shadow-2xl">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
