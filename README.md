# 📘 Gestor de Horas (Servicio Social)

El **Gestor de Horas (Servicio Social)** es una aplicación web diseñada para **registrar y gestionar las horas de servicio social de los estudiantes** mediante la asignación y seguimiento de tareas. Su objetivo es facilitar el control de actividades realizadas, mantener un registro preciso de las horas completadas y mejorar la transparencia del proceso.

---

## ✨ Características principales

- 📋 **Registro de tareas** – Asigna y documenta actividades para cada estudiante
- ⏱️ **Seguimiento automático** – Contabiliza las horas de servicio social completadas
- 👩‍🎓 **Panel personalizado** – Visualiza el progreso individual en tiempo real
- 🔐 **Autenticación segura** – Sistema de gestión de usuarios y permisos
- 💾 **Almacenamiento local** – Persistencia de datos mediante LocalStorage
- 🎨 **Diseño responsive** – Interfaz intuitiva adaptable a cualquier dispositivo

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **HTML5** | Estructura y semántica del sitio |
| **CSS3** | Estilos, diseño visual y responsividad |
| **JavaScript (Vanilla)** | Lógica de negocio y manipulación del DOM |
| **LocalStorage** | Persistencia de datos del cliente |

---

## 📁 Estructura del proyecto

```
student-hours-tracking/
├── index.html              # Página principal
├── styles.css              # Estilos globales
├── package.json            # Información del proyecto
├── JS/
│   ├── app.js              # Lógica general de la aplicación
│   ├── auth.js             # Módulo de autenticación
│   ├── dashboard.js        # Panel de usuario y seguimiento
│   └── database.js         # Gestión de almacenamiento
└── .vscode/
    └── launch.json         # Configuración de entorno
```

---

## 🚀 Instalación y uso

### Requisitos previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Editor de código (opcional): VS Code, Sublime Text, etc.

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/Sixtax-init/gestor-horas-Linux.git
   cd gestor-horas-linux
   ```

2. **Abre el proyecto**
   - Opción 1: Abre `index.html` directamente en tu navegador
   - Opción 2: Usa un servidor local (recomendado)
    

3. **¡Comienza a usar la aplicación!**
   - Registra tus tareas
   - Lleva el control de tus horas de servicio social
   - Visualiza tu progreso en el dashboard

---

## 📖 Guía de uso

### Para estudiantes
1. Inicia sesión con tus credenciales
2. Visualiza las tareas asignadas en tu dashboard
3. Registra las horas dedicadas a cada actividad
4. Consulta tu progreso acumulado

### Para administradores
1. Accede con permisos de administrador
2. Crea y asigna tareas a los estudiantes
3. Supervisa el avance general
4. Genera reportes de actividades

---


## 🗺️ Roadmap

### Próximas funcionalidades

- [ ] 🌐 Integración con base de datos en la nube (Firebase/Supabase)
- [ ] 📊 Exportación de reportes en PDF y Excel
- [ ] 🔒 Autenticación avanzada con OAuth
- [ ] 👨‍💼 Panel de administración completo para supervisores
- [ ] 📧 Sistema de notificaciones por correo electrónico
- [ ] 🌙 Modo oscuro

---


## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.


MIT License - Puedes usar, modificar y distribuir libremente con el debido reconocimiento.


<div align="center">

** Si este proyecto te es útil, considera darle una estrella en GitHub **


© 2025 Student Hours Tracking

</div>
