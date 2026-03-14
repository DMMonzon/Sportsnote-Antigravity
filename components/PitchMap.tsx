
import React, { useState, useRef } from 'react';
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
    color: 'green' | 'red' | 'yellow';
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

    const addGlow = (vx: number, vy: number, color: 'green' | 'red' | 'yellow') => {
        const id = Date.now() + Math.random();
        setGlows(prev => [...prev, { id, x: vx, y: vy, color }]);
        setTimeout(() => setGlows(prev => prev.filter(g => g.id !== id)), 1000);
    };

    const getSector = (x: number, y: number): string => {
        const isTop = y < 50;
        const sideSuffix = isTop ? 'Rival' : 'Propia';
        const lane = x < 33.3 ? 'Izquierda' : x < 66.6 ? 'Centro' : 'Derecha';
        const centerY = isTop ? 0 : 100;

        // Hockey Area is a semi-circle of 14.63m radius from the posts + 3.66m goal width.
        // In 0-100 units (representing 55m width x 91.4m length): 
        // Radius Y = 16% (14.63 / 91.4)
        // Radius X (approx for ellipse) = 30% ( (14.63 + 3.66/2) / 55 )
        const isArea = Math.pow(x - 50, 2) / Math.pow(30, 2) + Math.pow(y - centerY, 2) / Math.pow(16, 2) <= 1;

        if (isArea) {
            const dy = isTop ? y : 100 - y;
            const dx = x - 50;
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // 0 to 180

            let fanSector = '';
            if (angle < 36) fanSector = 'Extremo Derecho';
            else if (angle < 72) fanSector = 'Centro Derecha';
            else if (angle < 108) fanSector = 'Centro';
            else if (angle < 144) fanSector = 'Centro Izquierda';
            else fanSector = 'Extremo Izquierdo';

            return `Área ${isTop ? 'Rival' : 'Propia'} ${fanSector}`;
        }

        // 23m line is actually located at 22.9m / 91.4m = 25%
        if (y < 25 || y > 75) {
            return `23 yardas ${sideSuffix} ${lane}`;
        }

        return `Transición ${sideSuffix} ${lane}`;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
        if (!isRunning || !pointerStart.current) return;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        if (isGestureActive.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * 100;
        const vy = ((e.clientY - rect.top) / rect.height) * 100;
        const duration = Date.now() - pointerStart.current.t;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;

        // Swipe Up -> Falta
        if (dy < -60 && Math.abs(dx) < 120 && duration < 400) {
            e.preventDefault();
            e.stopPropagation();
            isGestureActive.current = true;
            addGlow(vx, vy, 'yellow');
            const coords = getMappedCoords(vx, vy);
            onAction('Falta Cometida', Possession.AWAY, coords.x, coords.y, 'Gesto: Deslizar Arriba');
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
            } else if (possession === Possession.AWAY) {
                // RIVAL ENTRY
                if (y > 75) {
                    const type = sector.includes('Área') ? 'Ingreso Rival en área' : 'Ingreso rival en 23';
                    addGlow(vx, vy, 'red');
                    onAction(type, Possession.AWAY, x, y, `Sector: ${sector}`);
                }
            }
        } else {
            tapTimer.current = window.setTimeout(() => {
                tapCount.current = 0;
                // Single Tap
                if (possession === Possession.HOME) {
                    // ENTRY
                    if (y < 25) {
                        const type = sector.includes('Área') ? 'Ingreso en área' : 'Ingreso en 23';
                        addGlow(vx, vy, 'green');
                        onAction(type, Possession.HOME, x, y, `Sector: ${sector}`);
                    }
                } else if (possession === Possession.AWAY) {
                    // RECOVER
                    addGlow(vx, vy, 'green');
                    onAction('Recupero', Possession.HOME, x, y, `Sector: ${sector}`);
                }
            }, 300);
        }
    };

    const homeColor = teamHome?.primaryColor || '#6d5dfc';
    const awayColor = teamAway?.primaryColor || '#ef4444';

    return (
        <div
            className="w-full h-full bg-[#3d63b8] relative cursor-crosshair overflow-hidden touch-none select-none transition-all duration-700"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                tapCount.current = 0;
            }}
        >
            {/* Field Markings */}
            <div className={`absolute inset-0 pointer-events-none transition-transform duration-700`}>
                <div className="absolute inset-[2%] border-2 border-white/60 overflow-hidden">
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

                            {/* D-Areas Hockey Style */}
                            {/* Top/Away Circle */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[32%] h-[60%] border-2 border-white/60 rounded-full -translate-x-1/2" />

                            {/* Bottom/Home Circle */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[32%] h-[60%] border-2 border-white/60 rounded-full translate-x-1/2" />
                        </>
                    ) : (
                        <>
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60" />
                            <div className="absolute top-[25%] left-0 right-0 h-px border-t-2 border-dashed border-white/40" />
                            <div className="absolute bottom-[25%] left-0 right-0 h-px border-b-2 border-dashed border-white/40" />

                            {/* D-Areas Hockey Style */}
                            {/* Top/Away Circle */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[32%] border-2 border-white/60 rounded-full -translate-y-1/2" />

                            {/* Bottom/Home Circle */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[32%] border-2 border-white/60 rounded-full translate-y-1/2" />
                        </>
                    )}

                    {/* Mid-point circle */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm" />
                </div>
            </div>

            {/* Visual Indicators */}
            <div className="absolute inset-0 pointer-events-none z-[100]">
                {glows.map(g => (
                    <div
                        key={g.id}
                        className={`absolute w-16 h-16 rounded-full blur-xl opacity-80 animate-ping transition-all ${g.color === 'green' ? 'bg-emerald-400' : g.color === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                            }`}
                        style={{
                            left: `${g.x}%`,
                            top: `${g.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className="w-full h-full rounded-full border-2 border-white/30 opacity-50" />
                    </div>
                ))}
            </div>
        </div>
    );
};
