import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix title="Pérdidas <i className="fa-solid fa-arrow-trend-down"></i>"
# We want title={<>Pérdidas <i className="fa-solid fa-arrow-trend-down"></i></>}
content = re.sub(r'title=\"([^\"]+)<i className=\"fa-solid fa-[a-zA-Z0-9\-]+\"></i>\"', 
                 lambda m: f'title={{<>{m.group(1)}<i className="fa-solid {m.group(0).split("fa-solid ")[1].split("\"")[0]}"></i></>}}', 
                 content)

# And if there's "Faltas ⚠️" which I missed earlier?
content = content.replace('title="Faltas ⚠️"', 'title={<>Faltas <i className="fa-solid fa-triangle-exclamation"></i></>}')

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing title icons")
