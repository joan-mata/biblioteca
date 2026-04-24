# CLAUDE.md - Contexto de Desarrollo

## 🏗️ Guía Maestra
Consulta [AGENTS.md](file:///Users/server_user/Documents/biblioteca/AGENTS.md) para principios de arquitectura, estilos y lógica de negocio.

## 🚀 Comandos Útiles

- **Desarrollo**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Base de Datos**: 
  - `npx prisma db push` (sincronizar esquema)
  - `npx prisma studio` (ver datos)
  - `npx prisma generate` (actualizar cliente)
- **Docker**:
  - `docker compose up -d --build` (reconstruir y desplegar)
  - `docker compose logs -f` (ver logs)

## 📌 Estado Actual
- **Ownership**: Implementado sistema de 3 estados (Comprado, Deseado, No comprar).
- **Seguridad**: Rutas de imágenes protegidas por sesión.
- **UI**: Modal ultra-responsive con scroll lock y scroll interno habilitado.
