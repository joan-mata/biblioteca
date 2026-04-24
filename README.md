# Biblioteca 📚

Una plataforma premium y moderna para gestionar tu colección personal de libros. Diseñada para ser elegante, rápida y 100% segura para entornos homelab.

## 🚀 Características

- **Diseño Premium**: Interfaz con **Glassmorphism**, modo oscuro, micro-animaciones y diseño **ultra-responsive**.
- **Gestión Avanzada**: Controla libros leídos, por leer y tu lista de deseos con un sistema de 3 estados:
    - 🏠 **Comprado**: Libros que ya posees.
    - ✨ **Deseado**: Tu lista de deseos personal (estado por defecto al añadir).
    - 🚫 **No comprar**: Libros que no te interesan adquirir.
- **Seguridad de Media**: Acceso a imágenes de portadas protegido por sesión. Solo usuarios autenticados pueden ver las fotos subidas.
- **Arquitectura MVC**: Código estructurado con clara separación entre Servicios, API y UI.
- **Despliegue Offline**: Optimizado para servidores locales sin acceso constante a internet mediante instalación global de dependencias en Docker.

## 🛠️ Instalación Rápida

### Requisitos Previos

- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/) (o usar el contenedor compartido configurado en `.env`)

### Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/joan-mata/biblioteca.git
   cd biblioteca
   ```

2. **Preparar variables de entorno:**
   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus credenciales y DATABASE_URL
   ```

3. **Levantar con Docker:**
   ```bash
   docker compose up -d --build
   ```

## 🏗️ Guía para Desarrolladores (IA y Humanos)

Este proyecto está diseñado para ser mantenido por agentes de IA. Consulta los siguientes archivos para más detalles:
- [AGENTS.md](./AGENTS.md): Principios arquitectónicos y reglas de oro.
- [CLAUDE.md](./CLAUDE.md): Comandos útiles y estado del proyecto.

## 🔒 Seguridad

- Autenticación robusta con **NextAuth**.
- Cifrado de contraseñas con **Bcrypt**.
- **Acceso Protegido a Media**: Las imágenes subidas no son públicas; se sirven a través de `/api/uploads` validando la sesión del usuario.

---
Creado con ❤️ por [Joan Mata](https://joanmata.com)
