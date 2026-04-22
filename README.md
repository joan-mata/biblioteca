# Biblioteca 📚

Una plataforma premium y moderna para gestionar tu colección personal de libros. Diseñada para ser elegante, rápida y 100% replicable.

## 🚀 Características

- **Diseño Moderno**: Interfaz con Glassmorphism, modo oscuro y micro-animaciones.
- **Gestión Completa**: Controla libros leídos, por leer y en tu estantería física.
- **Arquitectura Limpia**: Código estructurado con separación de responsabilidades (Servicios, API, UI).
- **Despliegue con Docker**: Lista para ser desplegada en segundos.

## 🛠️ Instalación Rápida

### Requisitos Previos

- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- [Node.js 20+](https://nodejs.org/) (opcional, para desarrollo local)

### Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/joan-mata/biblioteca.git
   cd biblioteca
   ```

2. **Preparar variables de entorno:**
   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus credenciales
   ```

3. **Levantar con Docker:**
   ```bash
   docker compose up -d --build
   ```

## 🏗️ Arquitectura (MVC)

El proyecto sigue una estructura modular para facilitar la mantenibilidad:

- `src/app/`: Rutas y páginas (Vistas).
- `src/services/`: Lógica de negocio (Controladores).
- `prisma/`: Definición de la base de datos (Modelos).
- `src/components/`: Componentes UI reutilizables.
- `src/types/`: Interfaces y tipos compartidos.

## 🔒 Seguridad

- Autenticación con **NextAuth**.
- Cifrado de contraseñas con **Bcrypt**.
- Aislamiento de base de datos mediante esquemas de PostgreSQL.

---
Creado con ❤️ por [Joan Mata](https://joanmata.com)
