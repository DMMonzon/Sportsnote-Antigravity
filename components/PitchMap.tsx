
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
    const tapTimer = useRef<number | null>(null);
    const pointerStart = useRef<{ x: number, y: number, t: number } | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const isGestureActive = useRef(false);
    const [foulPulse, setFoulPulse] = React.useState(false);
    const [overrideAngle, setOverrideAngle] = React.useState<number | null>(null);
    
    // User requested state for pointer logic
    const lastTapTime = useRef<number>(0);
    const lastTapCoords = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const pitchRef = useRef<HTMLDivElement>(null);

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

    const fireDoubleTap = (x: number, y: number, vx: number, vy: number, sector: string) => {
        if (possession === Possession.HOME) {
            addGlow(vx, vy, 'red');
            onAction('PÉRDIDA', Possession.AWAY, x, y, `Sector: ${sector}`);
        } else if (possession === Possession.AWAY) {
            if (sector.includes('Área')) {
                addGlow(vx, vy, 'red');
                onAction('Ingreso Rival en área', Possession.AWAY, x, y, `Sector: ${sector}`);
            } else if (sector.includes('23 yardas') && (y >= 75)) {
                addGlow(vx, vy, 'red');
                onAction('Ingreso rival en 23', Possession.AWAY, x, y, `Sector: ${sector}`);
            }
        }
    };

    const fireSingleTap = (x: number, y: number, vx: number, vy: number, sector: string) => {
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

        if (possession === Possession.HOME) {
            if (sector.includes('Área')) {
                addGlow(vx, vy, 'green');
                onAction('Ingreso en área', Possession.HOME, x, y, `Sector: ${sector}`);
            } else if (sector.includes('23 yardas') && (y <= 25)) {
                addGlow(vx, vy, 'green');
                onAction('Ingreso en 23', Possession.HOME, x, y, `Sector: ${sector}`);
            }
        } else if (possession === Possession.AWAY) {
            addGlow(vx, vy, 'green');
            onAction('Recupero', Possession.HOME, x, y, `Sector: ${sector}`);
        }
    };

    const homeColor = teamHome?.primaryColor || '#6d5dfc';
    const awayColor = teamAway?.primaryColor || '#ef4444';

    const fireSwipe = (startC: {x: number, y: number}, startVx: number, startVy: number, dy_pitch: number, angle: number) => {
        const startSector = getSector(startC.x, startC.y);
        const inAreaStart = startSector.includes('Área');
        const in23Start = startSector.includes('23 yardas');
        const inTargetZone = inAreaStart || in23Start;

        if (inTargetZone && Math.abs(dy_pitch) > 1) {
            const attackingTeam = dy_pitch < 0 ? Possession.HOME : Possession.AWAY;
            const ownColor = attackingTeam === Possession.HOME ? homeColor : awayColor;
            addGlow(startVx, startVy, ownColor, false);
            triggerFoulAnimation(angle);
            onAction('FALTA A FAVOR EN 23', attackingTeam, startC.x, startC.y, 'Falta en zona de peligro');
            return;
        }

        const isTowardsOwn = possession === Possession.HOME ? dy_pitch > 0 : dy_pitch < 0;
        const isTowardsRival = possession === Possession.HOME ? dy_pitch < 0 : dy_pitch > 0;
        
        if (isTowardsOwn) {
            const oppColor = possession === Possession.HOME ? awayColor : homeColor;
            addGlow(startVx, startVy, oppColor, false);
            triggerFoulAnimation(angle);
            const oppPoss = possession === Possession.HOME ? Possession.AWAY : Possession.HOME;
            onAction('Falta Cometida', oppPoss, startC.x, startC.y, 'Deslizar hacia arco propio (Falta cometida)');
        } else if (isTowardsRival) {
            const ownColor = possession === Possession.HOME ? homeColor : awayColor;
            addGlow(startVx, startVy, ownColor, false);
            triggerFoulAnimation(angle);
            onAction('Falta Cometida', possession, startC.x, startC.y, 'Deslizar hacia arco rival (Falta a favor)');
        }
    };

    useEffect(() => {
        return () => {
            if (tapTimer.current) clearTimeout(tapTimer.current);
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    useEffect(() => {
        const el = pitchRef.current;
        if (!el) return;

        const handlePointerDown = (e: PointerEvent) => {
            // Cancelar comportamientos por defecto del navegador (scroll, zoom, long-press nativo)
            e.preventDefault();
            e.stopPropagation();

            if (!isRunning) return;

            const rect = el.getBoundingClientRect();
            const clientX = e.clientX;
            const clientY = e.clientY;
            const vx = ((clientX - rect.left) / rect.width) * 100;
            const vy = ((clientY - rect.top) / rect.height) * 100;
            const coords = getMappedCoords(vx, vy);
            const { x, y } = coords;

            const now = Date.now();
            const timeDiff = now - lastTapTime.current;
            const dx = clientX - lastTapCoords.current.x;
            const dy = clientY - lastTapCoords.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (timeDiff < 250 && distance < 15) {
                // Doble Tap detectado
                if (tapTimer.current) clearTimeout(tapTimer.current);
                lastTapTime.current = 0; // Prevenir múltiples disparos (triple tap)
                fireDoubleTap(x, y, vx, vy, getSector(x, y));
            } else {
                // Posible Tap Simple
                lastTapTime.current = now;
                lastTapCoords.current = { x: clientX, y: clientY };
                pointerStart.current = { x: clientX, y: clientY, t: now };
                isGestureActive.current = false;

                if (tapTimer.current) clearTimeout(tapTimer.current);
                
                tapTimer.current = window.setTimeout(() => {
                    tapTimer.current = null;
                    if (!isGestureActive.current) {
                        fireSingleTap(x, y, vx, vy, getSector(x, y));
                    }
                }, 200);

                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                longPressTimer.current = window.setTimeout(() => {
                    isGestureActive.current = true;
                    if (tapTimer.current) clearTimeout(tapTimer.current);
                    if (navigator.vibrate) navigator.vibrate(100);
                    addGlow(vx, vy, 'green');
                    onManualMenu(coords.x, coords.y);
                }, 600);
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!pointerStart.current) return;
            
            const dx = e.clientX - pointerStart.current.x;
            const dy = e.clientY - pointerStart.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 15) {
                isGestureActive.current = true; // Anular tap si hay movimiento
                if (tapTimer.current) {
                    clearTimeout(tapTimer.current);
                    tapTimer.current = null;
                }
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isRunning || !pointerStart.current) return;

            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }

            const dx = e.clientX - pointerStart.current.x;
            const dy = e.clientY - pointerStart.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = Date.now() - pointerStart.current.t;

            if (distance > 40 && duration < 500) {
                isGestureActive.current = true;
                if (tapTimer.current) {
                    clearTimeout(tapTimer.current);
                    tapTimer.current = null;
                }

                const rect = el.getBoundingClientRect();
                const vx = ((e.clientX - rect.left) / rect.width) * 100;
                const vy = ((e.clientY - rect.top) / rect.height) * 100;
                
                const startVx = ((pointerStart.current.x - rect.left) / rect.width) * 100;
                const startVy = ((pointerStart.current.y - rect.top) / rect.height) * 100;
                const startC = getMappedCoords(startVx, startVy);
                const endC = getMappedCoords(vx, vy);
                const dy_pitch = endC.y - startC.y;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                fireSwipe(startC, startVx, startVy, dy_pitch, angle);
            }
            // NO limpiamos pointerStart porque podría ser necesario si hacemos un segundo tap rápido (double tap distance measure usa lastTapCoords de todos modos, así que está bien)
        };

        const cancelPointer = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            if (tapTimer.current) {
                clearTimeout(tapTimer.current);
                tapTimer.current = null;
            }
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            isGestureActive.current = true;
        };

        // Escuchadores de eventos pasivos obligatoriamente en false
        el.addEventListener('pointerdown', handlePointerDown as EventListener, { passive: false });
        el.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false });
        el.addEventListener('pointerup', handlePointerUp as EventListener, { passive: false });
        el.addEventListener('pointercancel', cancelPointer, { passive: false });
        el.addEventListener('pointerleave', cancelPointer, { passive: false });

        return () => {
            el.removeEventListener('pointerdown', handlePointerDown as EventListener);
            el.removeEventListener('pointermove', handlePointerMove as EventListener);
            el.removeEventListener('pointerup', handlePointerUp as EventListener);
            el.removeEventListener('pointercancel', cancelPointer);
            el.removeEventListener('pointerleave', cancelPointer);
        };
    }, [isRunning, possession, isLandscape, isFlipped, homeColor, awayColor]);

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
        let x = logicX;
        let y = logicY;
        if (isFlipped) {
            x = 100 - x;
            y = 100 - y;
        }
        if (isLandscape) {
            return { x: y, y: 100 - x };
        }
        return { x, y };
    }, [isLandscape, isFlipped]);

    const topGoalColor = isFlipped ? homeColor : awayColor;
    const bottomGoalColor = isFlipped ? awayColor : homeColor;

    return (
        <div
            ref={pitchRef}
            className="w-full h-full bg-[#3d63b8] relative cursor-crosshair overflow-hidden touch-none select-none transition-all duration-700"
            style={{ 
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
            }}
        >
            {/* Attack Direction Arrow (Big background arrow) */}
            <div 
                className={`absolute top-1/2 left-1/2 pointer-events-none flex items-center justify-center transition-all duration-1000 ease-in-out w-[70%] sm:w-[60%] max-w-[400px] aspect-square ${foulPulse ? 'animate-foul-pulse z-[110]' : 'opacity-20 z-10'}`}
                style={{ 
                    transform: `translate(-50%, -50%) rotate(${(isRunning && possession !== Possession.NONE) ? (overrideAngle ?? currentAttackAngle) : 0}deg)`,
                }}
            >
                {isRunning && possession !== Possession.NONE && currentAttackAngle !== null ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke={possession === Possession.HOME ? (teamHome?.primaryColor || '#6d5dfc') : (teamAway?.primaryColor || '#ef4444')} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full max-w-full drop-shadow-2xl stroke-[2] md:stroke-[3]">
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <polyline points="12 2 22 12 12 22"></polyline>
                    </svg>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-xl w-[40%] h-[40%] max-w-full">
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
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] opacity-60 rounded-sm" style={{ backgroundColor: topGoalColor }} />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] opacity-60 rounded-sm" style={{ backgroundColor: bottomGoalColor }} />
                        </>
                    ) : (
                        <>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[5%] w-[20%] opacity-60 rounded-sm" style={{ backgroundColor: topGoalColor }} />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[5%] w-[20%] opacity-60 rounded-sm" style={{ backgroundColor: bottomGoalColor }} />
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
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[32%] h-[53.2%] border-2 border-white/60 rounded-full -translate-x-1/2" />

                            {/* Bottom/Home Circle */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[32%] h-[53.2%] border-2 border-white/60 rounded-full translate-x-1/2" />
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
