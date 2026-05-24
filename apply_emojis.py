import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace JSX literal emojis and raw string emojis
# Emojis in getEventIcon and labels
replacements = {
    '🏑': '<i className="fa-solid fa-hockey-puck"></i>',
    '🎯': '<i className="fa-solid fa-bullseye"></i>',
    '🥅': '<i className="fa-solid fa-futbol"></i>',
    '📉': '<i className="fa-solid fa-arrow-trend-down"></i>',
    '📈': '<i className="fa-solid fa-arrow-trend-up"></i>',
    '📥': '<i className="fa-solid fa-arrow-right-to-bracket"></i>',
    '📌': '<i className="fa-solid fa-thumbtack"></i>',
    '🏆': '<i className="fa-solid fa-trophy"></i>',
    '📝': '<i className="fa-solid fa-clipboard-list"></i>',
    '📊': '<i className="fa-solid fa-chart-simple"></i>',
    '📋': '<i className="fa-solid fa-list"></i>',
    '🎤': '<i className="fa-solid fa-microphone"></i>',
    '⏸️': '<i className="fa-solid fa-pause"></i>',
    '🛡️': '<i className="fa-solid fa-shield-halved"></i>',
    '💨': '<i className="fa-solid fa-wind"></i>',
    '⚽': '<i className="fa-solid fa-futbol"></i>'
}

for emoji, fa in replacements.items():
    # Extract just the icon name
    icon_name = fa.split('fa-solid ')[1].split('"')[0]
    fa_react = '(<i className="' + icon_name + ' fa-solid text-white"></i>)'
    content = content.replace("return '" + emoji + "'", "return " + fa_react)
    content = content.replace("icon: '" + emoji + "'", "icon: " + fa_react)
    
    # Fix direct emoji inside JSX text
    # e.g. <span>🏑</span> -> <span><i className="fa-solid fa-hockey-puck"></i></span>
    # Wait, just replacing the emoji directly is safer.
    content = content.replace(emoji, '<i className="fa-solid ' + icon_name + '"></i>')

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Emoji Replacement")
