const fs = require('fs');
let content = fs.readFileSync('views/MatchHistory.tsx', 'utf8');

// Add imports
content = content.replace("import { Game } from '../types';", "import { Game } from '../types';\nimport { Breadcrumb } from '../components/Breadcrumb';\nimport { GlassCard } from '../components/GlassCard';");

// Replace Header and background
const oldHeader = `<div className="min-h-screen w-full flex flex-col bg-surface overflow-y-auto no-scrollbar pb-16 relative">
            <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-surfaceVariant shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-surfaceVariant shadow-sm hover:scale-110 transition-transform"
                    >
                        <span className="text-primary font-black">←</span>
                    </button>
                    <img
                        src="./assets/logoLargoSN.svg"
                        alt="SportNotes Logo"
                        className="h-8 md:h-9 w-auto"
                    />
                </div>
            </header>`;

const newHeader = `<div className="min-h-screen w-full flex flex-col overflow-y-auto no-scrollbar pb-16 relative z-10">
            <div className="pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
                <Breadcrumb paths={[{ label: 'Dashboard', url: '/dashboard' }, { label: 'Historial de Partidos' }]} />
            </div>`;

content = content.replace(oldHeader, newHeader);

// Replace card classes and tags
content = content.replace(/<div[^>]*className="bg-white border border-surfaceVariant rounded-\[32px\][^>]*>/g, (match) => {
    return match.replace('<div', '<GlassCard').replace('bg-white border border-surfaceVariant rounded-[32px]', '');
});

// Since each game is a GlassCard now, the corresponding closing div needs to be </GlassCard>
// The layout is:
// <GlassCard>
//   <div className="flex items-center gap-4 md:gap-8 flex-1 w-full md:w-auto"> ... </div>
//   <div className="flex items-center gap-3 shrink-0 ..."> ... </div>
// </div>
// So we just replace the exact pattern:
//                             </div>
//                         </div>
//                     ))}
// with
//                             </div>
//                         </GlassCard>
//                     ))}
content = content.replace(/<\/div>\\s*<\\/div>\\s*}\\)\\)}/g, '</div>\n                        </GlassCard>\n                    ))}');

// Change text colors to be white-friendly
content = content.replace(/text-dark/g, 'text-white');
content = content.replace(/text-onSurfaceVariant/g, 'text-white/70');
content = content.replace(/border-surfaceVariant/g, 'border-white/10');
content = content.replace(/bg-surface/g, 'bg-white/5');
content = content.replace(/hover:bg-primary\/5/g, 'hover:bg-white/10');

// Empty state
content = content.replace(/bg-surfaceVariant\/10/g, 'bg-white/5');

// Modal
content = content.replace(/bg-brandDark\/60/g, 'bg-black/80');
content = content.replace(/<div className="bg-white w-full max-w-sm rounded-\[40px\] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300 border border-white\/10">/, '<GlassCard className="w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">');
// Since Modal wrapper is now GlassCard, its closing tag is </GlassCard>
content = content.replace(/<\\/button>\\s*<\\/div>\\s*<\\/div>\\s*<\\/div>\\s*\\)}\\s*<\\/div>/, '</button>\n                        </div>\n                    </GlassCard>\n                </div>\n            )}\n        </div>');

fs.writeFileSync('views/MatchHistory.tsx', content);
console.log('MatchHistory.tsx updated');
