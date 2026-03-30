# TaskFlow - PRD (Product Requirements Document)

## Original Problem Statement
Crear una aplicación web de Gestor de Tareas/Taskflow que permita gestionar tareas diarias. Completo y preciso con funcionalidades avanzadas.

## User Personas
1. **Profesional Ocupado**: Necesita organizar múltiples tareas con prioridades y fechas límite
2. **Equipo de Trabajo**: Requiere visualización Kanban para flujo de trabajo
3. **Usuario Individual**: Busca simplicidad con funciones avanzadas opcionales

## Core Requirements (Static)
- Autenticación JWT segura
- Tablero Kanban con drag & drop
- Gestión completa de tareas (CRUD)
- Prioridades (Alta, Media, Baja)
- Fechas límite con calendario
- Categorías personalizables
- Sistema de etiquetas
- Filtros y búsqueda
- Estadísticas de productividad
- Recordatorios por email (SendGrid)
- Diseño oscuro, elegante y minimalista

## What's Been Implemented (2026-03-30)

### Backend (FastAPI + MongoDB)
- ✅ Autenticación JWT completa (register, login, logout, me, refresh)
- ✅ CRUD de tareas con todos los campos
- ✅ Filtros por estado, prioridad, categoría, búsqueda
- ✅ Categorías personalizables con colores
- ✅ Sistema de etiquetas
- ✅ Recordatorios programados (APScheduler)
- ✅ Integración SendGrid para emails
- ✅ Estadísticas de tareas
- ✅ Índices MongoDB optimizados

### Frontend (React)
- ✅ Páginas de Login/Registro con diseño split
- ✅ Dashboard con estadísticas visuales
- ✅ Tablero Kanban con 3 columnas
- ✅ Drag & drop funcional (@dnd-kit)
- ✅ Modal de creación/edición de tareas
- ✅ Selector de fecha con calendario
- ✅ Sistema de recordatorios
- ✅ Gestión de categorías desde sidebar
- ✅ Filtros por prioridad
- ✅ Búsqueda de tareas
- ✅ Tema oscuro elegante (Zinc palette)
- ✅ Tipografía Manrope + Inter
- ✅ Componentes Shadcn/UI personalizados

## Prioritized Backlog

### P0 - Completado
- [x] Autenticación de usuarios
- [x] CRUD de tareas
- [x] Tablero Kanban
- [x] Diseño responsive

### P1 - En Progreso
- [ ] Verificación de email del remitente SendGrid
- [ ] Tests unitarios backend
- [ ] Tests E2E frontend

### P2 - Siguiente Fase
- [ ] Perfil de usuario editable
- [ ] Exportar tareas a CSV
- [ ] Modo offline (PWA)
- [ ] Colaboración en tiempo real
- [ ] Asignación de tareas a otros usuarios
- [ ] Integraciones con Google Calendar

### P3 - Futuro
- [ ] App móvil nativa
- [ ] Plantillas de tareas
- [ ] Subtareas
- [ ] Adjuntos de archivos
- [ ] Historial de cambios

## Technical Architecture
```
Frontend (React 19)
├── Context API (Auth)
├── Shadcn/UI Components
├── @dnd-kit (Drag & Drop)
├── React Router v7
├── Axios (HTTP Client)
└── Tailwind CSS

Backend (FastAPI)
├── Motor (Async MongoDB)
├── PyJWT (Auth)
├── bcrypt (Password Hashing)
├── SendGrid (Emails)
├── APScheduler (Reminders)
└── Pydantic (Validation)

Database (MongoDB)
├── users
├── tasks
├── categories
└── login_attempts
```

## Next Tasks List
1. Verificar email remitente en SendGrid para activar notificaciones
2. Agregar perfil de usuario con avatar
3. Implementar subtareas
4. Añadir vista de calendario
5. Agregar estadísticas más detalladas con gráficos

## Notes
- SendGrid configurado pero requiere verificación del dominio/email remitente
- El drag & drop usa @dnd-kit/core para máxima compatibilidad
- El tema sigue paleta Zinc para consistencia dark mode
