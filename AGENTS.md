# Guía para Agentes de IA - Biblioteca 🤖

Este documento sirve como manual de instrucciones para que cualquier IA (Claude, ChatGPT, etc.) pueda mantener y extender este proyecto manteniendo la arquitectura y calidad originales.

## 🏗️ Principios Arquitectónicos

1.  **Separación de Responsabilidades**:
    -   **Servicios (`src/services/`)**: TODA la lógica de negocio debe estar aquí. Las rutas de la API no deben realizar consultas directas a Prisma ni manipular datos complejos.
    -   **API Routes (`src/app/api/`)**: Actúan solo como controladores de entrada/salida. Validan la sesión y llaman a los servicios correspondientes.
    -   **Componentes UI (`src/components/`)**: Deben ser lo más puros posible. La lógica de estado compleja debe manejarse mediante hooks o en las páginas de nivel superior.

2.  **Tipado Estricto**:
    -   Cualquier nueva entidad debe definirse en `src/types/index.ts`.
    -   Evitar el uso de `any` a toda costa.

3.  **Estética Premium**:
    -   Utilizar siempre variables de CSS definidas en `globals.css`.
    -   Mantener el estilo **Glassmorphism** para componentes elevados.

## 🛠️ Cómo Extender el Proyecto

-   **Añadir una nueva funcionalidad**:
    1.  Definir el modelo en `prisma/schema.prisma`.
    2.  Ejecutar `npx prisma generate`.
    3.  Crear el servicio en `src/services/`.
    4.  Crear la ruta de API en `src/app/api/`.
    5.  Implementar la UI en `src/components/` o `src/app/`.

-   **Mantenimiento**:
    -   Siempre verificar los lints con `npm run lint`.
    -   Asegurarse de que el `Dockerfile` sigue siendo válido para compilaciones en entornos aislados.

---
*Heed these rules to preserve the soul of the project.*
