import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix icon="<i className="fa-solid fa-... "></i>"
# We want icon={<i className="fa-solid fa-..."></i>}
content = re.sub(r'icon=\"(<i className=\"fa-solid fa-[a-zA-Z0-9\-]+\"></i>)\"', r'icon={\1}', content)

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing icons")
