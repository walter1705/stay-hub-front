# stay-front

Frontend del proyecto **Stay**, construido con [Next.js](https://nextjs.org) 16, React 19 y Tailwind CSS 4.

---

## Guía de inicio para desarrolladores

### 1. Requisitos previos

Asegúrate de tener instalado lo siguiente antes de comenzar:

| Herramienta | Versión mínima  | Enlace              |
| ----------- | --------------- | ------------------- |
| Node.js     | 18.x o superior | https://nodejs.org  |
| Bun         | 1.x o superior  | https://bun.sh      |
| Git         | 2.x o superior  | https://git-scm.com |

Verifica las versiones instaladas:

```bash
node -v
bun -v
git --version
```

---

### 2. Clonar el repositorio

```bash
git clone https://github.com/walter1705/stay-front.git
cd stay-front
```

---

### 3. Cambiar a la rama de trabajo

Consulta las ramas disponibles:

```bash
git branch -a
```

Cámbiate a la rama en la que vas a trabajar (por ejemplo `main`):

```bash
git checkout main
```

O crea una rama nueva a partir de la rama principal:

```bash
git checkout -b feature/nombre-de-la-feature main
```

Verifica que estés en la rama correcta:

```bash
git branch
```

---

### 4. Instalar dependencias

```bash
bun install
```

---

### 5. Iniciar el servidor de desarrollo

```bash
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador para ver la aplicación.

La aplicación se recarga automáticamente al guardar cambios en cualquier archivo.

---

### 6. Scripts disponibles

| Comando          | Descripción                                      |
| ---------------- | ------------------------------------------------ |
| `bun dev`        | Inicia el servidor de desarrollo                 |
| `bun run build`  | Genera el build de producción                    |
| `bun start`      | Inicia el servidor con el build de producción    |
| `bun run lint`   | Ejecuta el linter (ESLint)                       |
| `bun test`       | Ejecuta los tests unitarios una vez              |
| `bun test:watch` | Ejecuta los tests en modo watch (re-corre al guardar) |

---

### 7. Tests unitarios

El proyecto usa [Vitest](https://vitest.dev) con [Testing Library](https://testing-library.com).

```bash
# Correr todos los tests una vez
bun test

# Modo watch — re-corre al guardar un archivo
bun test:watch
```

Los tests se encuentran en `__tests__/` y cubren:

- **`lib/auth/session`** — decodificación JWT, extracción de roles, helpers de localStorage
- **`lib/dashboard/roles`** — routing por rol, prioridades, validación de segmentos
- **`lib/auth/password`** — validación de las tres regex de contraseña del backend (signup, change, reset)
- **`lib/api/client`** — inyección del token, limpieza en 401, manejo de errores de red

---

### 8. Estructura del proyecto

```
stay-front/
├── app/
│   ├── globals.css      # Estilos globales (Tailwind CSS)
│   ├── layout.tsx       # Layout raíz de la aplicación
│   └── page.tsx         # Página de inicio
├── public/              # Archivos estáticos
├── next.config.ts       # Configuración de Next.js
└── tsconfig.json        # Configuración de TypeScript
```

---

### 8. Flujo de trabajo recomendado

1. Sincroniza la rama principal antes de crear una nueva rama:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Crea tu rama de trabajo:
   ```bash
   git checkout -b feature/mi-feature
   ```
3. Realiza tus cambios y haz commits descriptivos:
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   ```
4. Sube la rama al repositorio remoto:
   ```bash
   git push origin feature/mi-feature
   ```
5. Abre un **Pull Request** hacia `main` en GitHub.
