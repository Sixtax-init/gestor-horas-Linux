// Dashboard Management System
class DashboardManager {
  constructor() {
    this.currentUser = null
    this.activeTab = "home"
    this.stats = {}
    this.notifications = []
    this.messages = []
    this.initializeEventListeners()
  }

  // Initialize dashboard with user data
  async initialize(user) {
    this.currentUser = user
    await this.loadUserData()
    this.updateHeader()
    this.updateHomeTab()
    this.loadNotifications()
    this.loadMessages()
    this.setupTabNavigation()
  }

  // Load user-specific data
  async loadUserData() {
    if (!this.currentUser) return

    // Load statistics based on user role
    this.stats = await window.db.getStatistics(this.currentUser.tipoUsuario, this.currentUser.matricula)

    console.log("[v0] Loaded user stats:", this.stats)
  }

  // Update header with user information
  updateHeader() {
    const userNameElement = document.getElementById("userName")
    const userRoleElement = document.getElementById("userRole")

    if (userNameElement) {
      userNameElement.textContent = `${this.currentUser.nombre} ${this.currentUser.apellidos}`
    }

    if (userRoleElement) {
      userRoleElement.textContent =
        this.currentUser.tipoUsuario.charAt(0).toUpperCase() + this.currentUser.tipoUsuario.slice(1)
      userRoleElement.className = `role-badge ${this.currentUser.tipoUsuario}`
    }
  }

  // Update home tab content
  updateHomeTab() {
    const welcomeTitle = document.getElementById("welcomeTitle")
    const welcomeDescription = document.getElementById("welcomeDescription")
    const statsGrid = document.getElementById("statsGrid")
    const roleInfo = document.getElementById("roleInfo")
    const roleDescription = document.getElementById("roleDescription")
    const registrationDate = document.getElementById("registrationDate")

    // Update welcome message
    if (welcomeTitle) {
      welcomeTitle.textContent = `Bienvenido, ${this.currentUser.nombre}`
    }

    // Update description based on role
    const descriptions = {
      administrador: "Gestiona usuarios, grupos y supervisa el sistema completo",
      maestro: "Crea proyectos, asigna tareas y evalúa el progreso de tus estudiantes",
      estudiante: "Consulta tus proyectos asignados, completa tareas y revisa tu progreso académico",
    }

    if (welcomeDescription) {
      welcomeDescription.textContent = descriptions[this.currentUser.tipoUsuario]
    }

    // Update role information
    if (roleInfo) {
      roleInfo.textContent =
        this.currentUser.tipoUsuario.charAt(0).toUpperCase() + this.currentUser.tipoUsuario.slice(1)
      roleInfo.className = `role-badge ${this.currentUser.tipoUsuario}`
    }

    if (roleDescription) {
      const roleDescriptions = {
        administrador: "Tienes acceso completo al sistema",
        maestro: "Puedes crear proyectos y evaluar estudiantes",
        estudiante: "Puedes acceder a tus proyectos y tareas",
      }
      roleDescription.textContent = roleDescriptions[this.currentUser.tipoUsuario]
    }

    if (registrationDate) {
      registrationDate.textContent = `Registrado el ${new Date(this.currentUser.fechaRegistro).toLocaleDateString()}`
    }

    // Update statistics
    this.updateStatsGrid(statsGrid)
  }

  // Update statistics grid
  updateStatsGrid(container) {
    if (!container) return

    const statsConfig = {
      administrador: [
        { label: "Usuarios Activos", value: this.stats.activeUsers || 0, icon: "users" },
        { label: "Proyectos Totales", value: this.stats.totalProjects || 0, icon: "book" },
        { label: "Tareas Totales", value: this.stats.totalTasks || 0, icon: "graduation" },
      ],
      maestro: [
        { label: "Proyectos Creados", value: this.stats.createdProjects || 0, icon: "book" },
        { label: "Tareas Asignadas", value: this.stats.assignedTasks || 0, icon: "graduation" },
        { label: "Estudiantes", value: this.stats.students || 0, icon: "users" },
      ],
      estudiante: [
        { label: "Proyectos Activos", value: this.stats.activeProjects || 0, icon: "book" },
        { label: "Tareas Pendientes", value: this.stats.pendingTasks || 0, icon: "graduation" },
        { label: "Tareas Completadas", value: this.stats.completedTasks || 0, icon: "users" },
      ],
    }

    const userStats = statsConfig[this.currentUser.tipoUsuario] || []
    container.innerHTML = ""

    userStats.forEach((stat) => {
      const statCard = document.createElement("div")
      statCard.className = "stat-card"

      const icon = this.getIconSVG(stat.icon)

      statCard.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
          <h3>${stat.value}</h3>
          <p>${stat.label}</p>
        </div>
      `

      container.appendChild(statCard)
    })

    if (this.currentUser.tipoUsuario === "estudiante") {
      this.addHoursProgressCard(container)
    }
  }

  async addHoursProgressCard(container) {
    const hoursStats = await window.db.getUserHoursStats(this.currentUser.matricula)

    const progressCard = document.createElement("div")
    progressCard.className = "hours-progress-card"

    const progressPercentage = Math.min(hoursStats.porcentajeCompletado, 100)
    const isComplete = hoursStats.horasCompletadas >= hoursStats.horasRequeridas

    progressCard.innerHTML = `
      <div class="hours-header">
        <div class="hours-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </div>
        <div class="hours-info">
          <h3>Servicio Social</h3>
          <p>${hoursStats.horasCompletadas}/${hoursStats.horasRequeridas} horas</p>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${isComplete ? "complete" : ""}" style="width: ${progressPercentage}%"></div>
      </div>
      <div class="hours-details">
        <span class="progress-text">${progressPercentage}% completado</span>
        ${
          isComplete
            ? '<span class="completion-badge">¡Completado!</span>'
            : `<span class="remaining-hours">${hoursStats.horasRequeridas - hoursStats.horasCompletadas} horas restantes</span>`
        }
      </div>
    `

    container.appendChild(progressCard)
  }

  // Setup tab navigation
  setupTabNavigation() {
    const tabTriggers = document.querySelectorAll(".tab-trigger")
    const tabContents = document.querySelectorAll(".tab-content")

    tabTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const tabName = trigger.getAttribute("data-tab")
        this.switchTab(tabName)
      })
    })
  }

  // Switch between tabs
  async switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll(".tab-trigger").forEach((tab) => tab.classList.remove("active"))
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

    // Add active class to selected tab and content
    const selectedTrigger = document.querySelector(`[data-tab="${tabName}"]`)
    const selectedContent = document.getElementById(`${tabName}Tab`)

    if (selectedTrigger) selectedTrigger.classList.add("active")
    if (selectedContent) selectedContent.classList.add("active")

    this.activeTab = tabName

    // Load tab-specific content
    switch (tabName) {
      case "main":
        await this.loadMainPanel()
        break
      case "chat":
        await this.loadChatPanel()
        break
      case "notifications":
        await this.loadNotificationsPanel()
        break
      case "profile":
        await this.loadProfilePanel()
        break
    }
  }

  // Load main panel based on user role
  async loadMainPanel() {
    const rolePanel = document.getElementById("rolePanel")
    if (!rolePanel) return

    switch (this.currentUser.tipoUsuario) {
      case "administrador":
        await this.loadAdminPanel(rolePanel)
        break
      case "maestro":
        await this.loadTeacherPanel(rolePanel)
        break
      case "estudiante":
        await this.loadStudentPanel(rolePanel)
        break
    }
  }

  // Load admin panel
  async loadAdminPanel(container) {
    const allUsers = await window.db.getAllUsers()
    const allTasks = await window.db.getAllTasks()

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Gestión de Usuarios</h3>
        </div>
        <div class="section-content">
          <div class="users-grid">
            ${allUsers.map((user) => ``).join("")}
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="section-header">
          <h3>Tareas del Sistema</h3>
        </div>
        <div class="section-content">
          <div class="tasks-list">
            ${allTasks.map((task) => ``).join("")}
          </div>
        </div>
      </div>
    `
  }

  // Load teacher panel
  async loadTeacherPanel(container) {
    const teacherTasks = await window.db.getTasksByUser(this.currentUser.matricula)
    const teacherGroups = await window.db.getGroupsByTeacher(this.currentUser.matricula)

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Tareas Creadas</h3>
          <p>Gestiona y monitorea el progreso de las tareas asignadas</p>
        </div>
        <div class="section-content">
          <button class="btn-primary" onclick="window.app.showCreateTaskModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear Nueva Tarea
          </button>
          <div class="tasks-list teacher-tasks-list">
            ${
              teacherTasks.length > 0
                ? teacherTasks
                    .map(
                      (task) => `
              <div class="task-item teacher-task-item">
                <div class="task-header">
                  <h4>${task.title}</h4>
                  <div class="task-badges">
                    ${
                      task.hasHours
                        ? `<span class="hours-badge">${task.hoursAssigned} horas</span>`
                        : '<span class="no-hours-badge">Sin horas</span>'
                    }
                    ${task.groupId ? '<span class="group-badge">Tarea de Grupo</span>' : '<span class="individual-badge">Individual</span>'}
                    ${task.allowAttachments ? '<span class="attachments-badge">Permite archivos</span>' : ""}
                  </div>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                  <span class="status-badge ${task.status}">${task.status}</span>
                  <span class="priority-badge ${task.priority}">${task.priority}</span>
                  <p class="due-date">Vence: ${new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <div class="task-actions">
                  <button onclick="window.dashboardManager.viewTaskSubmissions(${task.id})" class="btn-view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Ver Entregas
                  </button>
                  <button onclick="window.app.showEditTaskModal(${task.id})" class="btn-edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                  </button>
                  <button onclick="window.app.deleteTask(${task.id})" class="btn-delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 0 2-2h4a2 2 0 0 0 2 2v2"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-tasks">No has creado tareas aún</p>'
            }
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Grupos</h3>
          <p>Grupos que administras</p>
        </div>
        <div class="section-content">
          <div class="groups-grid">
            ${
              teacherGroups.length > 0
                ? teacherGroups
                    .map(
                      (group) => `
              <div class="group-card">
                <h4>${group.nombre}</h4>
                <p>${group.descripcion || "Sin descripción"}</p>
                <div class="group-meta">
                  <span class="group-type-badge ${group.tipoGrupo}">${
                    group.tipoGrupo === "servicio_social" ? "Servicio Social" : "Taller/Curso"
                  }</span>
                  <span class="students-count">${(group.alumnosAsignados || []).length} estudiantes</span>
                </div>
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-groups">No tienes grupos asignados</p>'
            }
          </div>
        </div>
      </div>
    `
  }

  async viewTaskSubmissions(taskId) {
    const stats = await window.db.getTaskSubmissionStats(taskId)

    if (!stats.task) {
      alert("No se pudo cargar la información de la tarea")
      return
    }

    // Create modal for submissions view
    const modal = document.createElement("div")
    modal.className = "modal active"
    modal.id = "submissionsModal"

    modal.innerHTML = `
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h2>Entregas de Tarea: ${stats.task.title}</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="submissions-stats">
            <div class="stat-card">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="stat-info">
                <h3>${stats.totalStudents}</h3>
                <p>Total Estudiantes</p>
              </div>
            </div>
            
            <div class="stat-card success">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              <div class="stat-info">
                <h3>${stats.submittedCount}</h3>
                <p>Han Entregado</p>
              </div>
            </div>
            
            <div class="stat-card warning">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div class="stat-info">
                <h3>${stats.pendingCount}</h3>
                <p>Pendientes</p>
              </div>
            </div>
            
            <div class="stat-card info">
              <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <div class="stat-info">
                <h3>${stats.submissionPercentage}%</h3>
                <p>Completado</p>
              </div>
            </div>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${stats.submissionPercentage}%"></div>
            </div>
            <p class="progress-text">${stats.submittedCount} de ${stats.totalStudents} estudiantes han entregado</p>
          </div>
          
          <div class="submissions-list">
            <h3>Detalle de Entregas</h3>
            ${
              stats.submissions.length > 0
                ? stats.submissions
                    .map(
                      (submission) => `
              <div class="submission-item ${submission.hasSubmitted ? "submitted" : "pending"}">
                <div class="submission-header">
                  <div class="student-info">
                    <div class="student-avatar">
                      ${submission.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div class="student-details">
                      <h4>${submission.studentName}</h4>
                      <p>${submission.studentEmail}</p>
                      <span class="student-id">${submission.studentId}</span>
                    </div>
                  </div>
                  <div class="submission-status">
                    ${
                      submission.hasSubmitted
                        ? `
                      <span class="status-badge completed">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        Entregado
                      </span>
                      <p class="submission-date">
                        ${new Date(submission.submissionDate).toLocaleString()}
                      </p>
                    `
                        : `
                      <span class="status-badge pending">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        Pendiente
                      </span>
                    `
                    }
                  </div>
                </div>
                
                ${
                  submission.hasSubmitted && submission.attachments.length > 0
                    ? `
                  <div class="submission-attachments">
                    <h5>Archivos Adjuntos (${submission.attachments.length})</h5>
                    <div class="attachments-grid">
                      ${submission.attachments
                        .map(
                          (att) => `
                        <div class="attachment-card">
                          <div class="attachment-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7,10 12,15 17,10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </div>
                          <div class="attachment-info">
                            <p class="attachment-name">${att.name}</p>
                            <p class="attachment-size">${(att.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <button onclick="window.app.downloadAttachment('${att.data}', '${att.name}')" class="btn-download">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7,10 12,15 17,10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                        </div>
                      `,
                        )
                        .join("")}
                    </div>
                  </div>
                `
                    : ""
                }
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-submissions">No hay estudiantes asignados a esta tarea</p>'
            }
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-outline" onclick="this.closest('.modal').remove()">Cerrar</button>
          <button class="btn-primary" onclick="window.dashboardManager.exportSubmissions(${taskId})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar Reporte
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
  }

  async exportSubmissions(taskId) {
    const stats = await window.db.getTaskSubmissionStats(taskId)

    const report = {
      tarea: stats.task.title,
      descripcion: stats.task.description,
      fechaVencimiento: stats.task.dueDate,
      estadisticas: {
        totalEstudiantes: stats.totalStudents,
        entregados: stats.submittedCount,
        pendientes: stats.pendingCount,
        porcentajeCompletado: stats.submissionPercentage,
      },
      entregas: stats.submissions.map((s) => ({
        estudiante: s.studentName,
        matricula: s.studentId,
        email: s.studentEmail,
        estado: s.hasSubmitted ? "Entregado" : "Pendiente",
        fechaEntrega: s.submissionDate,
        archivosAdjuntos: s.attachments.length,
      })),
    }

    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte_${stats.task.title.replace(/\s+/g, "_")}_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    alert("Reporte exportado exitosamente")
  }

  // Load student panel
  async loadStudentPanel(container) {
    const studentTasks = await window.db.getAllTasksForStudent(this.currentUser.matricula)
    const hoursStats = await window.db.getUserHoursStats(this.currentUser.matricula)

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Progreso de Servicio Social</h3>
        </div>
        <div class="section-content">
          <div class="hours-summary">
            <div class="hours-card">
              <h4>Horas Completadas</h4>
              <div class="hours-number">${hoursStats.horasCompletadas}</div>
              <p>de ${hoursStats.horasRequeridas} requeridas</p>
            </div>
            <div class="hours-card">
              <h4>Progreso</h4>
              <div class="hours-number">${hoursStats.porcentajeCompletado}%</div>
              <p>del total requerido</p>
            </div>
            <div class="hours-card">
              <h4>Tareas con Horas</h4>
              <div class="hours-number">${hoursStats.tareasConHoras}</div>
              <p>tareas completadas</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Tareas Asignadas</h3>
        </div>
        <div class="section-content">
          <div class="tasks-list">
            ${
              studentTasks.length > 0
                ? studentTasks
                    .map(
                      (task) => `
              <div class="task-item ${task.hasHours ? "has-hours" : ""}">
                <div class="task-header">
                  <h4>${task.title}</h4>
                  <div class="task-badges">
                    ${
                      task.hasHours
                        ? `<span class="hours-badge">${task.hoursAssigned} horas</span>`
                        : '<span class="no-hours-badge">Sin horas</span>'
                    }
                    ${task.groupId ? '<span class="group-badge">Tarea de Grupo</span>' : ""}
                  </div>
                </div>
                <p>${task.description}</p>
                <div class="task-meta">
                  <span class="status-badge ${task.status}">${task.status}</span>
                  <span class="priority-badge ${task.priority}">${task.priority}</span>
                  <p class="due-date">Vence: ${new Date(task.dueDate).toLocaleDateString()}</p>
                  ${
                    task.attachments && task.attachments.length > 0
                      ? `
                    <span class="attachments-count">${task.attachments.length} archivo(s)</span>
                  `
                      : ""
                  }
                </div>
                <div class="task-actions">
                  <button onclick="window.app.showTaskDetailsModal(${task.id})" class="btn-view">Ver Detalles</button>
                  ${
                    task.status !== "completed"
                      ? `<button onclick="window.dashboardManager.markTaskComplete(${task.id})" class="btn-complete">
                      Marcar Completada
                    </button>`
                      : `<span class="completed-badge">✓ Completada</span>
                    ${task.hasHours ? `<span class="hours-earned">+${task.hoursAssigned} horas acreditadas</span>` : ""}`
                  }
                </div>
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-tasks">No tienes tareas asignadas</p>'
            }
          </div>
        </div>
      </div>
    `
  }

  // Load notifications
  async loadNotifications() {
    this.notifications = await window.db.getNotificationsByUser(this.currentUser.matricula)
  }

  // Load notifications panel
  async loadNotificationsPanel() {
    const notificationsList = document.getElementById("notificationsList")
    if (!notificationsList) return

    await this.loadNotifications()

    notificationsList.innerHTML = this.notifications.map((notification) => ``).join("")
  }

  // Load messages
  async loadMessages() {
    this.messages = await window.db.getAllMessages()
  }

  // Load chat panel
  async loadChatPanel() {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    await this.loadMessages()

    chatMessages.innerHTML = this.messages.map((message) => ``).join("")

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // Load profile panel
  async loadProfilePanel() {
    const profileInfo = document.getElementById("profileInfo")
    if (!profileInfo) return

    const hoursStats = await window.db.getUserHoursStats(this.currentUser.matricula)

    profileInfo.innerHTML = `
      <div class="profile-field">
        <label>Matrícula:</label>
        <span>${this.currentUser.matricula}</span>
      </div>
      <div class="profile-field">
        <label>Nombre:</label>
        <span>${this.currentUser.nombre}</span>
      </div>
      <div class="profile-field">
        <label>Apellidos:</label>
        <span>${this.currentUser.apellidos}</span>
      </div>
      <div class="profile-field">
        <label>Email:</label>
        <span>${this.currentUser.email}</span>
      </div>
      <div class="profile-field">
        <label>Tipo de Usuario:</label>
        <span class="role-badge ${this.currentUser.tipoUsuario}">
          ${this.currentUser.tipoUsuario.charAt(0).toUpperCase() + this.currentUser.tipoUsuario.slice(1)}
        </span>
      </div>
      <div class="profile-field">
        <label>Fecha de Registro:</label>
        <span>${new Date(this.currentUser.fechaRegistro).toLocaleDateString()}</span>
      </div>
      ${this.currentUser.tipoUsuario === "estudiante" ? `` : ``}
      <div class="profile-actions">
        <button class="btn-primary" onclick="window.dashboardManager.showEditProfile()">
          Editar Perfil
        </button>
        <button class="btn-outline" onclick="window.dashboardManager.showChangePassword()">
          Cambiar Contraseña
        </button>
      </div>
    `
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Chat functionality
    document.addEventListener("DOMContentLoaded", () => {
      const sendButton = document.getElementById("sendMessage")
      const chatInput = document.getElementById("chatInput")

      if (sendButton) {
        sendButton.addEventListener("click", () => this.sendMessage())
      }

      if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            this.sendMessage()
          }
        })
      }
    })
  }

  // Send chat message
  async sendMessage() {
    const chatInput = document.getElementById("chatInput")
    if (!chatInput || !chatInput.value.trim()) return

    const message = {
      userId: this.currentUser.matricula,
      userName: `${this.currentUser.nombre} ${this.currentUser.apellidos}`,
      content: chatInput.value.trim(),
      timestamp: new Date(),
    }

    await window.db.addMessage(message)
    chatInput.value = ""

    // Reload chat if currently viewing
    if (this.activeTab === "chat") {
      await this.loadChatPanel()
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    await window.db.markNotificationAsRead(notificationId)
    await this.loadNotificationsPanel()
  }

  // Task management methods (to be implemented in next phase)
  createNewTask() {
    alert("Función de crear tarea - próximamente")
  }

  editTask(taskId) {
    alert(`Editar tarea ${taskId} - próximamente`)
  }

  deleteTask(taskId) {
    alert(`Eliminar tarea ${taskId} - próximamente`)
  }

  markTaskComplete(taskId) {
    alert(`Marcar tarea ${taskId} como completada - próximamente`)
  }

  showEditProfile() {
    alert("Editar perfil - próximamente")
  }

  showChangePassword() {
    alert("Cambiar contraseña - próximamente")
  }

  getIconSVG(iconName) {
    const icons = {
      users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>`,
      book: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>`,
      graduation: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
      </svg>`,
      clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12,6 12,12 16,14"></polyline>
      </svg>`,
    }

    return icons[iconName] || icons.book
  }
}

// Initialize global dashboard manager
window.dashboardManager = new DashboardManager()
