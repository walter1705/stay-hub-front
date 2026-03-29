# StayHub Dashboard Spec (Sprint 1)

## Alcance funcional actual

- Contrato activo en `openapi.yaml`:
  - `POST /api/v2/users/auth/signup`
  - `POST /api/v2/users/auth/login`
  - `GET /api/v2/accommodations/{id}`
- Todo modulo sin endpoint publicado queda implementado como UI lista para integrar backend.

## Arquitectura de rutas y navegacion

- Base autenticada: `/dashboard`
- Rutas role-based:
  - Cliente: `/dashboard/guest` + `bookings|payments|reviews|search|profile`
  - Propietario: `/dashboard/host` + `properties|bookings|availability|packages|reviews|notifications|profile`
  - Administrador: `/dashboard/admin` + `users|hosts|properties|bookings|alerts|audit`
- Shell comun:
  - Menu lateral (desktop) + menu sheet (mobile)
  - Barra superior con breadcrumbs y switch de rol
  - Cierre de sesion JWT

## Wireframe textual por modulo

- **Resumen por rol**
  - Header de pagina
  - Grid KPI
  - Tabla/resumen principal
  - Cards de actividad reciente
- **Modulos de lista**
  - Barra de filtros (busqueda + estado)
  - Tabla paginada
  - Estado vacio
- **Flujos en preparacion backend**
  - Formulario validado en frontend
  - Confirmacion toast
  - Mensaje "listo para integrar endpoint"

## Regla de inventario/disponibilidad (obligatoria)

Selector en propietario para paquetes/disponibilidad:

1. `HOME_ONLY` (Solo Casa Entera)
2. `ROOMS_ONLY` (Solo Habitaciones)
3. `BOTH` (Casa Entera + Habitaciones)

Aplicacion de reglas:

- `HOME_ONLY`
  - Solo permite reservar casa entera.
  - Reserva bloquea casa + todas las habitaciones.
- `ROOMS_ONLY`
  - Solo permite reservar habitaciones.
  - Reserva bloquea solo habitaciones afectadas.
- `BOTH`
  - Permite ambos tipos de reserva.
  - Si se reserva una habitacion, se bloquea casa entera en mismo periodo.
  - Si se reserva casa entera, se bloquean todas las habitaciones en mismo periodo.

Validaciones incluidas:

- tipo inventario obligatorio
- rango de fechas valido
- restricciones por tipo
- conflicto por solape de bloqueos en reservas

## Permisos y seguridad

- Sesion JWT almacenada en cliente
- Header `Authorization: Bearer <token>` inyectado por `apiClient`
- Guard de rutas por estado autenticado
- Guard de rol por seccion
- Si usuario entra a ruta de otro rol:
  - se muestra vista de acceso restringido
  - se ofrece CTA a su dashboard permitido

## Requisitos no funcionales cubiertos

- Responsive (sidebar desktop + sheet mobile)
- Carga progresiva con loader en validacion de sesion
- Tablas paginadas
- Accesibilidad base (labels, botones, foco)
- Auditoria basica en UI admin (eventos de ejemplo)

## Endpoints pendientes para completar backend real

- cambio de contrasena
- busqueda de casa por codigo
- reservas cliente/propietario
- pagos 20% y recordatorios
- notificaciones propietario
- baja de casa
- CRUD paquetes/disponibilidad
- modulos admin (usuarios/casas/reservas/alertas/auditoria)
