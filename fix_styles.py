import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Root background and image
content = content.replace(
    'className="bg-surface select-none transition-all duration-500 fixed inset-0 z-50 w-full"\n      style={{ display: \'flex\', flexDirection: \'column\', height: \'100dvh\', overflow: \'hidden\', overscrollBehavior: \'none\' }}',
    'className="bg-[#020617] select-none transition-all duration-500 fixed inset-0 z-50 w-full bg-cover bg-center"\n      style={{ display: \'flex\', flexDirection: \'column\', height: \'100dvh\', overflow: \'hidden\', overscrollBehavior: \'none\', backgroundImage: \'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(./assets/dashboard-bg.jpg)\' }}'
)

# 2. Modals overlay
content = content.replace('bg-brandDark/40', 'bg-black/60')

# 3. Colors and glassmorphism replacements
content = content.replace('bg-white', 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10')
content = content.replace('bg-surface', 'bg-[#1e293b]/45 backdrop-blur-md border border-white/10')
content = content.replace('bg-surfaceVariant', 'bg-white/10')
content = content.replace('border-surfaceVariant', 'border-white/10')

# 4. Text colors
content = content.replace('text-dark', 'text-white')
content = content.replace('text-onSurfaceVariant', 'text-slate-400')
content = content.replace('text-onSurface', 'text-white')

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
