# AGENTS.md

## Proyecto

**Nombre:** inmobiliaria-crm-2026

**Objetivo:**
CRM inmobiliario moderno para administración de:

* Inmuebles
* Contactos
* Blog
* Usuarios
* API Users
* Mapas (Mapbox)

---

# Stack Tecnológico

## Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS 4
* shadcn/ui
* Lucide Icons
* TanStack Table
* React Hook Form
* Zod

## Backend

* Next.js App Router
* Server Actions
* Route Handlers

## Base de Datos

* PostgreSQL

## ORM

* Prisma

## Mapas

* Mapbox GL JS

## Storage

* AWS S3

## Autenticación

* Better Auth

## Contenedores

* Docker
* Docker Compose

---

# Filosofía del Proyecto

Este proyecto debe priorizar:

1. Simplicidad
2. Legibilidad
3. Performance
4. Seguridad
5. DX (Developer Experience)

Evitar complejidad innecesaria.

No agregar librerías sin justificación clara.

---

# Arquitectura

src/

app/
components/
features/
lib/
services/
types/
hooks/
actions/

prisma/

public/

---

# Estructura de Features

Cada módulo debe vivir dentro de:

src/features/

Ejemplo:

src/features/properties
src/features/contacts
src/features/blog
src/features/users
src/features/api-users

Cada feature puede contener:

components/
actions/
schemas/
types/
services/

---

# Base de Datos

Prisma es la única forma permitida de acceso a PostgreSQL.

NO usar:

* pg
* consultas SQL directas
* drivers personalizados

Excepto cuando exista una razón técnica documentada.

---

# Variables de Entorno

Nunca hardcodear:

* passwords
* tokens
* secrets
* URLs privadas

Todo debe provenir de:

.env.local
.env.production

Agregar nuevas variables también a:

.env.example

---

# Docker

Reglas:

* No colocar secretos dentro de docker-compose.yml
* Usar env_file
* Todo secreto vive en .env

---

# UI / UX

Inspiración:

* Linear
* Vercel
* Stripe Dashboard
* Raycast
* Notion

Características:

* Diseño limpio
* Mucho espacio en blanco
* Mobile First
* Responsive
* Accesibilidad
* Dark Mode
* Light Mode

Evitar:

* Bootstrap
* AdminLTE
* Dashboards antiguos

---

# Componentes

Usar:

* shadcn/ui

Antes de crear un componente personalizado verificar si ya existe en shadcn.

---

# Tablas

Usar:

* TanStack Table

Obligatorio:

* búsqueda
* filtros
* ordenamiento
* paginación

---

# Formularios

Usar:

* React Hook Form
* Zod

No usar formularios sin validación.

---

# Código

Preferencias:

* TypeScript estricto
* Interfaces claras
* Funciones pequeñas
* Componentes pequeños

Evitar:

* archivos gigantes
* lógica mezclada
* duplicación

---

# Convenciones

## Componentes

PascalCase

PropertyCard.tsx

## Hooks

useProperty.ts

## Acciones

createProperty.ts
updateProperty.ts
deleteProperty.ts

## Servicios

property.service.ts

---

# Seguridad

Validar siempre:

* Inputs
* Uploads
* Parámetros URL
* Server Actions

Nunca confiar en datos del cliente.

---

# Git

Commits pequeños.

Ejemplos:

feat(properties): create property listing page

feat(contacts): add contact filters

fix(auth): session validation bug

## Push a main/master

Al hacer push a las ramas `main` o `master`, usar la deploy key SSH que ya está configurada en el repositorio.

No usar `gh` para realizar estos pushes; no es necesario.

---

# Regla Principal

Antes de introducir una nueva dependencia:

1. Justificarla.
2. Explicar beneficios.
3. Explicar impacto.
4. Verificar si el stack actual ya resuelve el problema.

Menos dependencias = mejor mantenimiento.

---

# Estado Inicial del Proyecto

Base de datos PostgreSQL existente.

Prisma ya configurado e introspectado.

Docker preparado.

Siguiente objetivo:

Construir Dashboard moderno con métricas reales utilizando Prisma.
