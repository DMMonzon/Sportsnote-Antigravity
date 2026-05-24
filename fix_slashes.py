import re

with open('views/LiveGameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The regex replace injected literal backslashes into the JSX: className=\"contrail-font ...\"
# We need to remove these backslashes

# Replace className=\" with className="
content = content.replace('className=\\"', 'className="')

# Replace \"> with ">
content = content.replace('\\">', '">')

# Any other lingering \" inside class names or strings
content = content.replace('\\"', '"')

with open('views/LiveGameView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing slashes")
