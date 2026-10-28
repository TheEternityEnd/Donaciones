# Centro de Control de Donaciones (`@fundacion/donaciones-control-center`)

Sistema integral web para la administración, trazabilidad y control de donaciones, inventario médico/ortopédico, préstamos de equipamiento y solicitudes de insumos dentro de un Centro Comunitario / Fundación.

---

## Propósito del Proyecto

El **Centro de Control de Donaciones** tiene como objetivo centralizar y digitalizar el flujo operativo de insumos donados (medicamentos, material de curación, equipo ortopédico y artículos generales), conectando el área de donaciones con otros departamentos como **Farmacia** y **Ortopedia**.

### Funcionalidades Principales
- **Panel de Control (Dashboard):** Visualización de métricas clave, estadísticas de entradas/salidas, alertas de stock o caducidad y actividad reciente.
- **Gestión de Inventario:** Consulta y control de existencias categorizadas (medicamentos, ortopedia, insumos médicos), lotes, números de serie y fechas de caducidad.
- **Registro de Donaciones:** Captura de entradas de donaciones con generación de folios maestros y detalle de artículos recibidos.
- **Solicitudes de Salida:** Gestión y despacho de insumos solicitados por distintas áreas del centro comunitario.
- **Préstamos de Equipo Ortopédico:** Control de préstamos temporales de aparatos ortopédicos (sillas de ruedas, muletas, andaderas, etc.) a beneficiarios, seguimiento de fechas de devolución pactadas/reales y cartas de compromiso.
- **Reportes Médicos y Operativos:** Generación y exportación de reportes en formato PDF para auditoría y control interno.

---

## Tecnologías y Dependencias

El proyecto está construido bajo una arquitectura **Full-Stack** (Cliente + Servidor API REST) dentro del mismo repositorio:

### Frontend
- **React 18** + **TypeScript** (empaquetado con **Vite 6**)
- **React Router 7:** Enrutamiento SPA configurado bajo la ruta base `/donaciones`.
- **Tailwind CSS 4** + **Radix UI:** Sistema de diseño accesible, componentes interactivos y soporte de temas (`next-themes`).
- **Recharts:** Gráficos e indicadores estadísticos.
- **React Hook Form:** Manejo y validación de formularios.
- **jsPDF** y **jsPDF-AutoTable:** Generación de reportes y comprobantes en PDF.
- **Lucide React** y **Motion:** Iconografía y animaciones fluidas.

### Backend (`Server/`)
- **Node.js** con **Express 5:** Servidor API REST modular.
- **pg (`node-postgres`):** Cliente y pool de conexiones a **PostgreSQL** (interactuando con los esquemas `donaciones`, `farmacia`, `ortopedia` y `public`).
- **jsonwebtoken (JWT)** y **cookie-parser:** Autenticación y validación de sesión integrada con el Login Central.
- **cors** y **dotenv:** Seguridad de orígenes cruzados y manejo de variables de entorno.

### Herramientas de Desarrollo
- **Concurrently:** Ejecución simultánea del servidor de desarrollo de Vite y el backend de Express con un solo comando.

---

## Requisitos Previos

Antes de iniciar, asegúrate de contar con lo siguiente instalado en tu entorno:
1. **Node.js** (versión 20 LTS o superior recomendada) y **npm**.
2. **PostgreSQL** (versión 14 o superior) en ejecución con la base de datos `centro_comunitario` (y los esquemas correspondientes como `donaciones`).
3. *(Opcional)* **Docker** si deseas ejecutar o desplegar los contenedores de frontend (Nginx) y backend.

---

## Cómo Hacerlo Funcionar

### 1. Instalar las dependencias
Desde la raíz del proyecto, instala todos los paquetes necesarios para el frontend y el backend:

```bash
npm install
```

### 2. Configurar las variables de entorno
Crea un archivo `.env` dentro de la carpeta `Server/` (o en la raíz del proyecto) tomando como plantilla el archivo `Server/.env.example`:

```bash
cp Server/.env.example Server/.env
```

Edita `Server/.env` con tus credenciales locales de PostgreSQL y configuración:

```env
NODE_ENV=development
PORT=5000

# Clave secreta para validación de tokens JWT del Login Central
JWT_SECRET=tu_clave_secreta_jwt_aqui

# Orígenes permitidos por CORS separados por comas
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Conexión a la base de datos PostgreSQL
DB_DONACION_USER=tu_usuario_pg
DB_DONACION_PASSWORD=tu_password_pg
DB_DONACION_HOST=localhost
DB_DONACION_NAME=centro_comunitario
DB_DONACION_PORT=5432
```

### 3. Inicializar las tablas de la base de datos (Opcional)
Si es la primera vez que ejecutas el proyecto y necesitas crear/verificar las tablas del esquema `donaciones` (`usuarios_config`, `folios_maestros`, `detalle_operaciones`, `control_prestamos`), ejecuta:

```bash
node Server/scripts/init_db.cjs
```

### 4. Iniciar el entorno de desarrollo
Para levantar tanto el **Frontend (Vite)** como el **Backend (Express)** al mismo tiempo, ejecuta:

```bash
npm run dev
```

- **Frontend:** Disponible en `http://localhost:5173/donaciones/` *(Vite redirige automáticamente las peticiones `/api` hacia el puerto `5000`)*.
- **Backend API:** Escuchando en `http://localhost:5000` (puedes verificar su estado en `http://localhost:5000/api/health`).

---

## Compilación y Producción

### Compilar el Frontend
Para generar los archivos estáticos optimizados en la carpeta `dist/`:

```bash
npm run build
```

### Ejecución con Docker
El proyecto incluye un `Dockerfile` multi-etapa con objetivos (`targets`) separados para **frontend** (servido con Nginx) y **backend** (Node.js):

```bash
# Construir imagen del Frontend
docker build --target frontend -t donaciones-frontend .

# Construir imagen del Backend
docker build --target backend -t donaciones-backend .
```

---

## Estructura del Proyecto

```text
├── Server/                  # Backend Node.js + Express
│   ├── config/              # Configuración de variables de entorno y pool de PostgreSQL
│   ├── controllers/         # Lógica de negocio (donaciones, inventario, ortopedia, préstamos, etc.)
│   ├── middlewares/         # Autenticación JWT, CORS y manejo centralizado de errores
│   ├── routes/              # Definición de endpoints REST bajo /api
│   ├── scripts/             # Scripts de inicialización y diagnóstico de base de datos
│   ├── app.cjs              # Configuración de la aplicación Express
│   └── index.cjs            # Punto de entrada del servidor backend
├── src/                     # Frontend React + TypeScript
│   ├── app/
│   │   ├── components/      # Componentes de interfaz y layout (Radix UI / Tailwind)
│   │   ├── contexts/        # Contextos globales de la aplicación
│   │   ├── pages/           # Vistas principales (Dashboard, Inventory, Loans, etc.)
│   │   └── routes.tsx       # Configuración de rutas (basename: /donaciones)
│   ├── styles/              # Hojas de estilo globales y configuración de Tailwind CSS
│   └── main.tsx             # Punto de entrada de React
├── Dockerfile               # Construcción multi-etapa para despliegue en contenedores
├── package.json             # Dependencias y scripts del proyecto
└── vite.config.ts           # Configuración de Vite y proxy hacia el backend
```
