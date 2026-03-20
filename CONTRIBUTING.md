# Contributing to Disease Dashboard

Thank you for your interest in contributing! Here's how to do it correctly.

## Before You Contribute

By submitting a Pull Request, you agree that:
- Your contribution is your original work
- You grant the author (Kuldeep Solanki) a perpetual license to use your contribution
- You have read and accept the project [LICENSE](LICENSE)

## What We Welcome

- 🐛 Bug fixes
- 📱 Mobile/responsive improvements  
- 🌐 Translations and localisation
- 📖 Documentation improvements
- ⚡ Performance optimisations
- 🔒 Security improvements

## What Requires Discussion First

Open an issue before starting work on:
- New pages or major features
- Changes to the database schema
- Changes to the authentication system
- Anything that changes the public API

## Setup for Development

```bash
git clone https://github.com/kuldeepsolanki/disease-dashboard.git
cd disease-dashboard
cd backend && cp .env.example .env
# Fill in .env, then:
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd ../database
python seed_database.py    # use PATIENT_COUNT=1000 for fast dev seed
python seed_users.py
cd ../backend && python app.py
```

## Pull Request Guidelines

1. **One PR per issue** — don't bundle unrelated changes
2. **Test on mobile** — check Chrome DevTools mobile view at 390px width
3. **No credentials** — never include `.env`, `*.pem`, or `*.key` files
4. **Update README** if you add a feature
5. **Keep `api.js` MOCK data in sync** if you change API response shapes

## Code Style

- JavaScript: plain ES6+, no frameworks, no build tools
- Python: PEP 8, type hints encouraged
- CSS: BEM-ish class names, CSS variables for all colors
- No `console.log` in production code (use `Toast.show()` for user messages)

## Security

If you find a security vulnerability, **do not open a public issue**.  
Email: dr.kuldeep@bmchealth.in

---

All contributions are subject to the project [LICENSE](LICENSE).