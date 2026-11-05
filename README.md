# MishooJobs 🥑🇲🇽
### Real-Time Mexican Job Discovery & Verification for Juniors

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.5+-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

> Plataforma de descubrimiento en tiempo real y verificación de empleos para estudiantes e ingenieros de software junior en México (*becarios, prácticas, residencias, servicio social, trainee, junior*).

---

## ⚡ Garantías y Principios Constitucionales

Adhesión estricta a la **Constitución de MishooJobs v1.1.0** (`.specify/memory/constitution.md`):

1. **Cero Cuentas & Privacidad Total (Principio I)**: No existe registro, login ni almacenamiento de datos del candidato en el servidor. Tu CV y pipeline residen exclusivamente en tu navegador (`IndexedDB`).
2. **100% Búsqueda en Vivo (FR-001)**: Cero datos precargados, sintéticos o mocks en producción. Las búsquedas consultan en vivo y en paralelo Computrabajo, Indeed México y OCC Mundial.
3. **100% Enlaces Directos Funcionales (FR-002)**: Cada vacante se verifica al vuelo mediante solicitudes HTTP HEAD asíncronas antes de mostrarse en pantalla.
4. **Calibración Mexicana (Principio II)**: Moneda estrictamente en Pesos Mexicanos (MXN, $), filtros de formatos académicos locales y exclusión automática de vacantes con restricción de visa extranjera.
5. **Cero Claves de Pago de Gemini (Principio V)**: Toda la evaluación profunda de compatibilidad se orquesta localmente mediante el CLI de Antigravity (`agy`), utilizando tu suscripción activa.
6. **Transparencia contra Fraudes (Principio VI)**: Detección determinista de esquemas piramidales (MLM), cobros a candidatos, esquemas de 100% comisión y vacantes no remuneradas con insignias de alto contraste.
7. **Estética Desarrolladora Midudev (Principio IV)**: Tema oscuro `zinc-950`/`zinc-900`, tipografía Geist Mono & Geist Pixel, alta densidad de información y atajos de teclado.

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    Client["Navegador Web (React 19 + TypeScript + Vite)"]
    IDB["IndexedDB Local (mishoojobs_local_db)<br/>• Perfiles CV & Habilidades<br/>• Pipeline de Postulaciones"]
    API["FastAPI Backend (Python 3.12+)"]
    PG[("PostgreSQL (mishoojobs_db)<br/>• Huellas Digitales & Enlaces<br/>• Caché de Evaluaciones AI<br/>• Auditorías de Fraude")]
    AGY["Antigravity CLI (agy)<br/>• Evaluación Profunda de Brechas"]

    Portals["Bolsas de Empleo Mexicanas<br/>• Computrabajo México<br/>• Indeed México<br/>• OCC Mundial"]

    Client <-->|CRUD Privado| IDB
    Client -->|SSE: GET /api/v1/jobs/stream| API
    Client -->|POST /api/v1/vacancies/evaluate| API
    API -->|Concurrencia + HTTP HEAD| Portals
    API <-->|Deduplicación & Caché| PG
    API -->|CLI Subprocess (Zero API Keys)| AGY
```

---

## 🚀 Inicio Rápido y Configuración Local

### Requisitos Previos
- macOS o Linux
- Python 3.12+ (Python 3.14 compatible)
- Node.js v20+ & npm
- PostgreSQL 15+ ejecutándose localmente en puerto 5432
- Antigravity CLI (`agy`) instalado en el PATH

### 1. Clonar y Configurar Backend

```bash
# Crear y activar entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias del backend
pip install -e "./backend[dev]"

# Crear la base de datos en PostgreSQL
psql -d postgres -c "CREATE DATABASE mishoojobs_db;"

# Aplicar migraciones de Alembic
cd backend
alembic upgrade head
cd ..
```

### 2. Configurar Frontend

```bash
cd frontend
npm install
cd ..
```

### 3. Ejecutar en Modo Desarrollo

```bash
# Terminal 1: Iniciar backend FastAPI (puerto 8000)
source .venv/bin/activate
uvicorn mishoojobs.api.main:app --reload --port 8000

# Terminal 2: Iniciar frontend Vite React (puerto 5173)
cd frontend
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## ⌨️ Atajos de Teclado (Navegación Rápida)

| Tecla | Acción |
|---|---|
| `/` | Enfocar inmediatamente la barra de búsqueda |
| `j` o `↓` | Seleccionar siguiente tarjeta de vacante |
| `k` o `↑` | Seleccionar tarjeta anterior |
| `Enter` o `Espacio` | Abrir detalles de la vacante seleccionada |
| `s` | Guardar vacante en tu pipeline local |
| `a` | Marcar vacante como postulada |
| `Esc` | Cerrar cualquier modal abierto |

---

## 🧪 Pruebas Automatizadas

De acuerdo a las reglas constitucionales, las suites de prueba se ejecutan 100% fuera de línea con fixtures estáticos:

```bash
# Ejecutar 19 pruebas del backend (unitarias + integración + contratos)
.venv/bin/pytest backend/tests/ -v

# Ejecutar pruebas del frontend (Vitest + Testing Library)
cd frontend && npm test
```

---

## 📄 Licencia
Distribuido bajo la Licencia MIT. Desarrollado con ❤️ para la comunidad de juniors y estudiantes en México.
