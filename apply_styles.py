import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add contrail-font to all h3, h4 tags
content = re.sub(r'<h([34]) className=\"(.*?)\"', r'<h\1 className=\"contrail-font \2\"', content)
# Add contrail-font to p tags that are titles (tracking-widest)
content = re.sub(r'<p className=\"(.*?)tracking-widest(.*?)\"', r'<p className=\"contrail-font \1tracking-widest\2\"', content)

# 2. Replace text-slate-400 with text-white in LiveGameView to boost contrast
content = content.replace('text-slate-400', 'text-white')

# 3. Icon replacement to FontAwesome
content = content.replace('<span>📝</span>', '<i className=\"fa-solid fa-clipboard-list text-white\"></i>')
content = content.replace('<span>🥅</span>', '<i className=\"fa-solid fa-futbol text-white\"></i>')
content = content.replace('<span>⚠️</span>', '<i className=\"fa-solid fa-triangle-exclamation text-white\"></i>')
content = content.replace('<span>📉</span>', '<i className=\"fa-solid fa-arrow-trend-down text-white\"></i>')
content = content.replace('<span>📈</span>', '<i className=\"fa-solid fa-arrow-trend-up text-white\"></i>')
content = content.replace('<span>🏁</span>', '<i className=\"fa-solid fa-flag-checkered text-white\"></i>')
content = content.replace('<span>🏠</span>', '<i className=\"fa-solid fa-house text-white\"></i>')
content = content.replace('<div className=\"text-4xl mb-4\">⚠️</div>', '<div className=\"text-4xl mb-4 text-white\"><i className=\"fa-solid fa-triangle-exclamation\"></i></div>')
content = content.replace('<div className=\"text-4xl mb-4\">⏳</div>', '<div className=\"text-4xl mb-4 text-white\"><i className=\"fa-solid fa-hourglass-half\"></i></div>')
content = content.replace('<div className=\"text-4xl mb-4\">🏁</div>', '<div className=\"text-4xl mb-4 text-white\"><i className=\"fa-solid fa-flag-checkered\"></i></div>')
content = content.replace('<div className=\"text-4xl mb-4\">🏑</div>', '<div className=\"text-4xl mb-4 text-white\"><i className=\"fa-solid fa-hockey-puck\"></i></div>')
content = content.replace('<div className=\"w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl mb-6\">⏱️</div>', '<div className=\"w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl mb-6\"><i className=\"fa-solid fa-stopwatch\"></i></div>')


# Ensure the 'Saque Inicial' text is perfectly legible
content = content.replace('text-[11px] font-bold text-white uppercase leading-relaxed\">Selecciona', 'text-[13px] font-bold text-white uppercase leading-relaxed tracking-wider\">Selecciona')

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done styling update")
