class DashboardManager {
  constructor() {
    this.currentUser = null
    this.activeTab = "home"
    this.stats = {}
    this.notifications = []
    this.messages = []
    this.initializeEventListeners()
  }

  async initialize(user) {
    this.currentUser = user
    await this.loadUserData()
    this.updateHeader()
    this.updateHomeTab()
    this.loadNotifications()
    this.loadMessages()
    this.setupTabNavigation()
  }

  async loadUserData() {
    if (!this.currentUser) return

    this.stats = await window.db.getStatistics(this.currentUser.tipoUsuario, this.currentUser.matricula)

    console.log("[v0] Loaded user stats:", this.stats)
  }

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

  updateHomeTab() {
    const welcomeTitle = document.getElementById("welcomeTitle")
    const welcomeDescription = document.getElementById("welcomeDescription")
    const statsGrid = document.getElementById("statsGrid")
    const roleInfo = document.getElementById("roleInfo")
    const roleDescription = document.getElementById("roleDescription")
    const registrationDate = document.getElementById("registrationDate")

    if (welcomeTitle) {
      welcomeTitle.textContent = `Bienvenido, ${this.currentUser.nombre}`
    }

    const descriptions = {
      administrador: "Gestiona usuarios, grupos y supervisa el sistema completo",
      maestro: "Crea proyectos, asigna tareas y evalúa el progreso de tus estudiantes",
      estudiante: "Consulta tus proyectos asignados, completa tareas y revisa tu progreso académico",
    }

    if (welcomeDescription) {
      welcomeDescription.textContent = descriptions[this.currentUser.tipoUsuario]
    }

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

    this.updateStatsGrid(statsGrid)
  }

  updateStatsGrid(container) {
    if (!container) return

    const statsConfig = {
      administrador: [
        { label: "Usuarios Activos", value: this.stats.activeUsers || 0, icon: "users" },
        { label: "Grupos Totales", value: this.stats.totalGroups || 0, icon: "book" },
        { label: "Grupos de Servicio", value: this.stats.serviceGroups || 0, icon: "graduation" },
        { label: "Talleres/Cursos", value: this.stats.courseGroups || 0, icon: "clock" },
      ],
      maestro: [
        { label: "Mis Grupos", value: this.stats.myGroups || 0, icon: "book" },
        { label: "Tareas Creadas", value: this.stats.assignedTasks || 0, icon: "graduation" },
        { label: "Estudiantes", value: this.stats.students || 0, icon: "users" },
        { label: "Grupos Activos", value: this.stats.activeGroups || 0, icon: "clock" },
      ],
      estudiante: [
        { label: "Mis Grupos", value: this.stats.myGroups || 0, icon: "book" },
        { label: "Tareas Pendientes", value: this.stats.pendingTasks || 0, icon: "graduation" },
        { label: "Tareas Completadas", value: this.stats.completedTasks || 0, icon: "users" },
        { label: "Servicio Social", value: this.stats.serviceGroups || 0, icon: "clock" },
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

  async switchTab(tabName) {
    document.querySelectorAll(".tab-trigger").forEach((tab) => tab.classList.remove("active"))
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

    const selectedTrigger = document.querySelector(`[data-tab="${tabName}"]`)
    const selectedContent = document.getElementById(`${tabName}Tab`)

    if (selectedTrigger) selectedTrigger.classList.add("active")
    if (selectedContent) selectedContent.classList.add("active")

    this.activeTab = tabName

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

  async loadAdminPanel(container) {
    const allUsers = await window.db.getAllUsers()
    const allGroups = await window.db.getAllGroups()

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Gestión de Usuarios</h3>
          <button class="btn-primary" onclick="window.dashboardManager.showCreateUserModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Crear Usuario
          </button>
        </div>
        <div class="section-content">
          <div class="users-management-grid">
            ${allUsers
              .map(
                (user) => `
              <div class="user-management-card">
                <div class="user-header">
                  <h4>${user.nombre} ${user.apellidos}</h4>
                  <span class="role-badge ${user.tipoUsuario}">${user.tipoUsuario}</span>
                </div>
                <div class="user-details">
                  <p><strong>Matrícula:</strong> ${user.matricula}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <div class="user-status">
                    <span class="status-badge ${user.activo ? "active" : "inactive"}">
                      ${user.activo ? "Activo" : "Inactivo"}
                    </span>
                    ${
                      user.tipoUsuario === "estudiante"
                        ? `<span class="hours-info">${user.horasCompletadas || 0}/${user.horasRequeridas || 480} horas</span>`
                        : ""
                    }
                  </div>
                </div>
                <div class="user-actions">
                  <button onclick="window.dashboardManager.editUser('${user.matricula}')" class="btn-edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                  </button>
                  <button onclick="window.dashboardManager.deleteUser('${user.matricula}')" class="btn-delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-header">
          <h3>Gestión de Grupos</h3>
          <button class="btn-primary" onclick="window.dashboardManager.showCreateGroupModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear Nuevo Grupo
          </button>
        </div>
        <div class="section-content">
          ${
            allGroups.length > 0
              ? `
          <div class="groups-grid">
            ${allGroups
              .map(
                (group) => `
              <div class="group-card ${group.tipoGrupo}">
                <div class="group-header">
                  <h4>${group.nombre}</h4>
                  <span class="group-type-badge ${group.tipoGrupo}">
                    ${group.tipoGrupo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                  </span>
                </div>
                <p>${group.descripcion}</p>
                <div class="group-stats">
                  <span class="student-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    ${(group.alumnosAsignados || []).length} estudiantes
                  </span>
                  <span class="teacher-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${group.maestroResponsable}
                  </span>
                </div>
                <div class="group-actions">
                  <button onclick="window.dashboardManager.manageGroupUsers(${group.id})" class="btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Gestionar Usuarios
                  </button>
                  <button onclick="window.dashboardManager.deleteGroup(${group.id})" class="btn-delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : `
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; color: #d1d5db;">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <h3>No hay grupos creados</h3>
            <p>Crea el primer grupo para comenzar a organizar estudiantes y tareas</p>
            <button class="btn-primary" onclick="window.dashboardManager.showCreateGroupModal()">
              Crear Primer Grupo
            </button>
          </div>
          `
          }
        </div>
      </div>
    `
  }

  async manageGroupUsers(groupId) {
    try {
      const group = await window.db.getGroupById(groupId)
      const allUsers = await window.db.getAllUsers()

      // Obtener usuarios asignados al grupo
      const assignedUsers = (group.alumnosAsignados || [])
        .map((matricula) => allUsers.find((user) => user.matricula === matricula))
        .filter(Boolean)

      const modal = document.createElement("div")
      modal.className = "modal-overlay large-modal"
      modal.innerHTML = `
        <div class="modal-content extra-wide">
          <div class="modal-header">
            <h3>Gestionar Usuarios - ${group.nombre}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="section-header" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
              <h4>Usuarios en este grupo (${assignedUsers.length})</h4>
              <button class="btn-primary" onclick="window.dashboardManager.addUserToGroupAdmin(${groupId})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Añadir Usuario
              </button>
            </div>
            
            <div id="groupUsersList" class="users-management-grid">
              ${
                assignedUsers.length > 0
                  ? assignedUsers
                      .map(
                        (user) => `
                <div class="user-management-card">
                  <div class="user-header">
                    <h4>${user.nombre} ${user.apellidos}</h4>
                    <span class="role-badge ${user.tipoUsuario}">${user.tipoUsuario}</span>
                  </div>
                  <div class="user-details">
                    <p><strong>Matrícula:</strong> ${user.matricula}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <div class="user-status">
                      <span class="status-badge ${user.activo ? "active" : "inactive"}">
                        ${user.activo ? "Activo" : "Inactivo"}
                      </span>
                      ${
                        user.tipoUsuario === "estudiante"
                          ? `<span class="hours-info">${user.horasCompletadas || 0}/${user.horasRequeridas || 480} horas</span>`
                          : ""
                      }
                    </div>
                  </div>
                  <div class="user-actions">
                    <button onclick="window.dashboardManager.editUserFromGroup('${user.matricula}', ${groupId})" class="btn-edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>
                    <button onclick="window.dashboardManager.removeUserFromGroupAdmin(${groupId}, '${user.matricula}')" class="btn-warning">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Remover del Grupo
                    </button>
                    <button onclick="window.dashboardManager.deleteUserFromGroup('${user.matricula}', ${groupId})" class="btn-delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                      Eliminar Usuario
                    </button>
                  </div>
                </div>
              `,
                      )
                      .join("")
                  : '<p class="no-students" style="text-align: center; padding: 40px; color: #6b7280;">No hay usuarios asignados a este grupo</p>'
              }
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error managing group users:", error)
      this.showNotification("Error al cargar usuarios del grupo", "error")
    }
  }

  async addUserToGroupAdmin(groupId) {
    try {
      const availableUsers = await window.db.getAvailableStudentsForGroup(groupId)
      const allUsers = await window.db.getAllUsers()
      const group = await window.db.getGroupById(groupId)

      // Incluir también maestros disponibles
      const assignedUserIds = group.alumnosAsignados || []
      const availableAllUsers = allUsers.filter((user) => !assignedUserIds.includes(user.matricula) && user.activo)

      if (availableAllUsers.length === 0) {
        this.showNotification("No hay usuarios disponibles para asignar", "info")
        return
      }

      const modal = document.createElement("div")
      modal.className = "modal-overlay"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Añadir Usuario al Grupo</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <form id="addUserToGroupForm">
              <div class="form-group">
                <label for="selectUserForGroup">Seleccionar Usuario:</label>
                <select id="selectUserForGroup" required>
                  <option value="">Seleccionar usuario</option>
                  ${availableAllUsers
                    .map(
                      (user) =>
                        `<option value="${user.matricula}">${user.nombre} ${user.apellidos} (${user.tipoUsuario}) - ${user.matricula}</option>`,
                    )
                    .join("")}
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn-primary">
                  Añadir al Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      document.getElementById("addUserToGroupForm").addEventListener("submit", async (e) => {
        e.preventDefault()
        const userId = document.getElementById("selectUserForGroup").value

        if (!userId) {
          this.showNotification("Por favor, selecciona un usuario", "error")
          return
        }

        try {
          await window.db.assignUserToGroup(groupId, userId, this.currentUser.matricula)
          modal.remove()

          // Recargar la vista de gestión de usuarios
          await this.manageGroupUsers(groupId)

          this.showNotification("Usuario añadido al grupo exitosamente", "success")
        } catch (error) {
          console.error("[v0] Error adding user to group:", error)
          this.showNotification(error.message || "Error al añadir usuario al grupo", "error")
        }
      })

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error loading available users:", error)
      this.showNotification("Error al cargar usuarios disponibles", "error")
    }
  }

  async editUserFromGroup(matricula, groupId) {
    await this.editUser(matricula)
    // Después de editar, recargar la vista del grupo
    setTimeout(() => this.manageGroupUsers(groupId), 500)
  }

  async removeUserFromGroupAdmin(groupId, userId) {
    if (!confirm("¿Estás seguro de que deseas remover este usuario del grupo?")) {
      return
    }

    try {
      await window.db.removeUserFromGroup(groupId, userId)
      await this.manageGroupUsers(groupId)
      this.showNotification("Usuario removido del grupo exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error removing user from group:", error)
      this.showNotification("Error al remover usuario del grupo", "error")
    }
  }

  async deleteUserFromGroup(matricula, groupId) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await window.db.deleteUser(matricula)
      await this.manageGroupUsers(groupId)
      await this.loadUserData()
      this.updateHomeTab()
      this.showNotification("Usuario eliminado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      this.showNotification("Error al eliminar el usuario", "error")
    }
  }

  async loadTeacherPanel(container) {
    const teacherGroups = await window.db.getGroupsByTeacher(this.currentUser.matricula)

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Grupos</h3>
        </div>
        <div class="section-content">
          ${
            teacherGroups.length > 0
              ? `
          <div class="groups-grid">
            ${teacherGroups
              .map(
                (group) => `
              <div class="group-card ${group.tipoGrupo}" onclick="window.dashboardManager.enterGroup(${group.id})">
                <div class="group-header">
                  <h4>${group.nombre}</h4>
                  <span class="group-type-badge ${group.tipoGrupo}">
                    ${group.tipoGrupo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                  </span>
                </div>
                <p>${group.descripcion}</p>
                <div class="group-stats">
                  <span class="student-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    ${(group.alumnosAsignados || []).length} estudiantes
                  </span>
                </div>
                <div class="group-actions">
                  <button onclick="window.dashboardManager.createTaskForGroup(${group.id}); event.stopPropagation()" class="btn-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crear Tarea
                  </button>
                  <button onclick="window.dashboardManager.manageGroupUsers(${group.id}); event.stopPropagation()" class="btn-manage">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Gestionar Usuarios
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : `
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; color: #d1d5db;">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <h3>No tienes grupos asignados</h3>
            <p>Contacta al administrador para que te asigne grupos</p>
          </div>
          `
          }
        </div>
      </div>
    `
  }

  async enterGroup(groupId) {
    try {
      const group = await window.db.getGroupById(groupId)
      const tasks = await window.db.getTasksByGroup(groupId)

      const modal = document.createElement("div")
      modal.className = "modal-overlay large-modal"
      modal.innerHTML = `
        <div class="modal-content extra-wide">
          <div class="modal-header">
            <div>
              <h3>Grupo: ${group.nombre}</h3>
              <span class="group-type-badge ${group.tipoGrupo}" style="margin-top: 8px;">
                ${group.tipoGrupo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
              </span>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="group-details-tabs">
              <div class="tab-buttons">
                <button class="tab-btn active" onclick="window.dashboardManager.switchGroupTab('tasks', this)">
                  Tareas (${tasks.length})
                </button>
                <button class="tab-btn" onclick="window.dashboardManager.switchGroupTab('students', this)">
                  Estudiantes (${(group.alumnosAsignados || []).length})
                </button>
              </div>
              
              <div id="tasksTab" class="tab-content active">
                <div class="section-header">
                  <h4>Tareas del Grupo</h4>
                  <button class="btn-primary" onclick="window.dashboardManager.createTaskForGroup(${groupId})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Crear Nueva Tarea
                  </button>
                </div>
                <div class="tasks-detailed-list">
                  ${
                    tasks.length > 0
                      ? tasks
                          .map(
                            (task) => `
                    <div class="task-detailed-item ${task.isAvailable ? "available" : "closed"}">
                      <div class="task-detailed-header">
                        <h5>${task.title}</h5>
                        <div class="task-status-badges">
                          ${
                            task.hoursAssigned > 0
                              ? `<span class="hours-badge">+${task.hoursAssigned} horas</span>`
                              : '<span class="no-hours-badge">Sin horas</span>'
                          }
                          <span class="status-badge ${task.isAvailable ? "available" : "closed"}">
                            ${task.isAvailable ? "✓ Abierta" : "✗ Cerrada"}
                          </span>
                          ${
                            task.maxStudents
                              ? `<span class="capacity-badge ${task.currentEnrollments >= task.maxStudents ? "full" : ""}">${task.currentEnrollments || 0}/${task.maxStudents} inscritos</span>`
                              : `<span class="unlimited-badge">${task.currentEnrollments || 0} inscritos</span>`
                          }
                        </div>
                      </div>
                      <p class="task-description">${task.description}</p>
                      <div class="task-meta-info">
                        <span class="priority-badge ${task.priority}">
                          ${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"} prioridad
                        </span>
                        <span class="due-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Vence: ${new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div class="enrolled-students">
                        <h6>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          Estudiantes inscritos (${task.enrolledStudents.length}):
                        </h6>
                        ${
                          task.enrolledStudents.length > 0
                            ? `<div class="students-list">
                            ${task.enrolledStudents
                              .map(
                                (student) =>
                                  `<span class="student-chip">${student.nombre} <small>(${student.matricula})</small></span>`,
                              )
                              .join("")}
                          </div>`
                            : '<p class="no-students">Ningún estudiante inscrito</p>'
                        }
                      </div>
                    </div>
                  `,
                          )
                          .join("")
                      : '<div class="empty-state"><p class="no-tasks">No hay tareas creadas para este grupo</p><button class="btn-primary" onclick="window.dashboardManager.createTaskForGroup(' +
                        groupId +
                        ')">Crear Primera Tarea</button></div>'
                  }
                </div>
              </div>
              
              <div id="studentsTab" class="tab-content">
                <div class="section-header">
                  <h4>Estudiantes del Grupo</h4>
                  <button class="btn-primary" onclick="window.dashboardManager.addStudentToGroup(${groupId})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Añadir Estudiante
                  </button>
                </div>
                <div id="groupStudentsList">
                   Se carga dinámicamente 
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Cargar estudiantes del grupo
      await this.loadGroupStudents(groupId)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error entering group:", error)
      this.showNotification("Error al cargar el grupo", "error")
    }
  }

  async createTaskForGroup(groupId) {
    const group = await window.db.getGroupById(groupId)
    if (!group) return

    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content wide">
        <div class="modal-header">
          <h3>Crear Tarea para: ${group.nombre}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="createTaskForm">
            <div class="form-group">
              <label for="taskTitle">Título de la Tarea:</label>
              <input type="text" id="taskTitle" required placeholder="Ej: Recolección de basura en parque">
            </div>
            <div class="form-group">
              <label for="taskDescription">Descripción:</label>
              <textarea id="taskDescription" required placeholder="Describe las actividades y objetivos de la tarea..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="taskMaxStudents">Límite de estudiantes:</label>
                <input type="number" id="taskMaxStudents" min="1" placeholder="Dejar vacío para sin límite">
                <small class="form-help">Número máximo de estudiantes que pueden inscribirse</small>
              </div>
              ${
                group.tipoGrupo === "servicio_social"
                  ? `
              <div class="form-group">
                <label for="taskHours">Horas que otorga:</label>
                <input type="number" id="taskHours" min="0" step="0.5" required placeholder="Ej: 5">
                <small class="form-help">Horas de servicio social que se acreditarán</small>
              </div>
              `
                  : `
              <input type="hidden" id="taskHours" value="0">
              <div class="info-message">
                <p><strong>Nota:</strong> Este es un grupo de Taller/Curso. Las tareas no otorgarán horas de servicio social.</p>
              </div>
              `
              }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="taskPriority">Prioridad:</label>
                <select id="taskPriority" required>
                  <option value="low">Baja</option>
                  <option value="medium" selected>Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div class="form-group">
                <label for="taskDueDate">Fecha límite:</label>
                <input type="date" id="taskDueDate" required>
              </div>
            </div>
            
            <div class="task-form-section">
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px;">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13,2 13,9 20,9"></polyline>
                </svg>
                Archivo de la Tarea (Opcional)
              </h4>
              <div class="form-group">
                <label for="taskFile">Los estudiantes podrán subir un archivo al inscribirse:</label>
                <div class="file-upload-area" id="taskFileUploadArea">
                  <input type="file" id="taskFile" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png">
                  <div class="file-upload-text">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17,8 12,3 7,8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Haz clic o arrastra un archivo aquí</p>
                  </div>
                  <div class="file-upload-hint">PDF, Word, imágenes (máx. 10MB)</div>
                </div>
                <div id="uploadedFileInfo" style="display: none;"></div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("taskDueDate").min = today

    // Manejar envío del formulario
    document.getElementById("createTaskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createTask(groupId)
    })

    // Manejar área de subida de archivos
    const fileInput = document.getElementById("taskFile")
    const uploadArea = document.getElementById("taskFileUploadArea")
    const uploadedInfo = document.getElementById("uploadedFileInfo")

    uploadArea.addEventListener("click", () => fileInput.click())

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        uploadedInfo.style.display = "block"
        uploadedInfo.innerHTML = `
          <div class="uploaded-file">
            <span class="uploaded-file-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13,2 13,9 20,9"></polyline>
              </svg>
              ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            </span>
            <button type="button" class="remove-file" onclick="document.getElementById('taskFile').value=''; document.getElementById('uploadedFileInfo').style.display='none';">
              ✕
            </button>
          </div>
        `
      }
    })

    // Drag and drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      uploadArea.classList.add("dragover")
    })

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover")
    })

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault()
      uploadArea.classList.remove("dragover")
      const file = e.dataTransfer.files[0]
      if (file) {
        fileInput.files = e.dataTransfer.files
        fileInput.dispatchEvent(new Event("change"))
      }
    })
  }

  async loadStudentPanel(container) {
    const studentGroups = await window.db.getUserGroups(this.currentUser.matricula)
    const availableTasks = await window.db.getAvailableTasksForStudent(this.currentUser.matricula)
    const studentTasks = await window.db.getEnrolledTasksForStudent(this.currentUser.matricula)
    const hoursStats = await window.db.getUserHoursStats(this.currentUser.matricula)

    container.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h3>Progreso de Horas</h3>
        </div>
        <div class="
          <div class="hours-summary-detailed">
            <div class="hours-card main">
              <h4>Horas Acumuladas</h4>
              <div class="hours-number-large">${hoursStats.horasCompletadas}</div>
              <div class="hours-progress-bar">
                <div class="progress-fill" style="width: ${Math.min(hoursStats.porcentajeCompletado, 100)}%"></div>
              </div>
              <p>${hoursStats.horasCompletadas} de ${hoursStats.horasRequeridas} horas (${hoursStats.porcentajeCompletado}%)</p>
            </div>
            <div class="hours-card">
              <h4>Horas Restantes</h4>
              <div class="hours-number">${Math.max(0, hoursStats.horasRequeridas - hoursStats.horasCompletadas)}</div>
              <p>para completar servicio</p>
            </div>
            <div class="hours-card">
              <h4>Tareas Completadas</h4>
              <div class="hours-number">${hoursStats.tareasConHoras}</div>
              <p>con horas acreditadas</p>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Grupos</h3>
        </div>
        <div class="section-content">
          <div class="groups-grid">
            ${studentGroups
              .map(
                (group) => `
              <div class="group-card ${group.tipoGrupo}">
                <div class="group-header">
                  <h4>${group.nombre}</h4>
                  <span class="group-type-badge ${group.tipoGrupo}">
                    ${group.tipoGrupo === "servicio_social" ? "Servicio Social" : "Taller/Curso"}
                  </span>
                </div>
                <p>${group.descripcion}</p>
                <div class="group-info">
                  <span class="teacher-name">Maestro: ${group.maestroResponsable}</span>
                  ${
                    group.tipoGrupo === "servicio_social"
                      ? '<span class="hours-info">✓ Las tareas suman horas</span>'
                      : '<span class="no-hours-info">Las tareas no suman horas</span>'
                  }
                </div>
                <div class="group-actions">
                  <button onclick="window.dashboardManager.viewGroupTasks(${group.id})" class="btn-primary">
                    Ver Tareas del Grupo
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="section-header">
          <h3>Mis Tareas Inscritas</h3>
        </div>
        <div class="section-content">
          <div class="tasks-list">
            ${
              studentTasks.length > 0
                ? studentTasks
                    .filter((task) => task.status !== "completed")
                    .map(
                      (task) => `
              <div class="task-item enrolled-task">
                <div class="task-header">
                  <h4>${task.title}</h4>
                  <div class="task-badges">
                    ${
                      task.hoursAssigned > 0
                        ? `<span class="hours-badge">+${task.hoursAssigned} horas</span>`
                        : '<span class="no-hours-badge">Sin horas</span>'
                    }
                    <span class="status-badge enrolled">Inscrito</span>
                  </div>
                </div>
                <p>${task.description}</p>
                <div class="task-meta">
                  <span class="priority-badge ${task.priority}">${task.priority}</span>
                  <p class="due-date">Vence: ${new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <div class="task-actions">
                  <button onclick="window.dashboardManager.markTaskComplete(${task.id})" class="btn-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Marcar como Terminada
                  </button>
                  <button onclick="window.dashboardManager.attachDocumentToTask(${task.id})" class="btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17,8 12,3 7,8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Adjuntar Documento
                  </button>
                </div>
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-tasks">No tienes tareas inscritas pendientes.</p>'
            }
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-header">
          <h3>Tareas Disponibles</h3>
        </div>
        <div class="section-content">
          <div class="tasks-list">
            ${
              availableTasks.length > 0
                ? availableTasks
                    .map(
                      (task) => `
              <div class="task-item available-task">
                <div class="task-header">
                  <h4>${task.title}</h4>
                  <div class="task-badges">
                    ${
                      task.hoursAssigned > 0
                        ? `<span class="hours-badge">+${task.hoursAssigned} horas</span>`
                        : '<span class="no-hours-badge">Sin horas</span>'
                    }
                    ${
                      task.maxStudents
                        ? `<span class="capacity-badge">${task.currentEnrollments || 0}/${task.maxStudents} disponibles</span>`
                        : '<span class="unlimited-badge">Sin límite</span>'
                    }
                  </div>
                </div>
                <p>${task.description}</p>
                <div class="task-meta">
                  <span class="priority-badge ${task.priority}">${task.priority}</span>
                  <p class="due-date">Vence: ${new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <div class="task-actions">
                  <button onclick="window.dashboardManager.viewTaskDetails(${task.id})" class="btn-outline">
                    Ver Detalles
                  </button>
                  <button onclick="window.dashboardManager.enrollInTaskWithFile(${task.id})" class="btn-primary">
                    Inscribirse
                  </button>
                </div>
              </div>
            `,
                    )
                    .join("")
                : '<p class="no-tasks">No hay tareas disponibles en este momento.</p>'
            }
          </div>
        </div>
      </div>
    `
  }

  async loadNotifications() {
    this.notifications = await window.db.getNotificationsByUser(this.currentUser.matricula)
  }

  async loadNotificationsPanel() {
    const notificationsList = document.getElementById("notificationsList")
    if (!notificationsList) return

    await this.loadNotifications()

    notificationsList.innerHTML = this.notifications
      .map(
        (notification) => `
        <div class="notification-item ${notification.read ? "" : "unread"}">
          <h4>${notification.title}</h4>
          <p>${notification.message}</p>
          <span class="notification-date">${new Date(notification.createdAt).toLocaleDateString()}</span>
          ${
            !notification.read
              ? `<button onclick="window.dashboardManager.markNotificationRead(${notification.id})">Marcar como leída</button>`
              : ""
          }
        </div>
      `,
      )
      .join("")
  }

  async loadMessages() {
    this.messages = await window.db.getAllMessages()
  }

  async loadChatPanel() {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    await this.loadMessages()

    chatMessages.innerHTML = this.messages
      .map(
        (message) => `
        <div class="message ${message.userId === this.currentUser.matricula ? "own" : "other"}">
          <strong>${message.userName}:</strong> ${message.content}
          <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
      `,
      )
      .join("")

    chatMessages.scrollTop = chatMessages.scrollHeight
  }

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
      ${
        this.currentUser.tipoUsuario === "estudiante"
          ? `
        <div class="profile-field">
          <label>Progreso de Servicio Social:</label>
          <div class="hours-progress-inline">
            <span class="hours-text">${hoursStats.horasCompletadas}/${hoursStats.horasRequeridas} horas (${hoursStats.porcentajeCompletado}%)</span>
            <div class="progress-bar-small">
              <div class="progress-fill-small" style="width: ${Math.min(hoursStats.porcentajeCompletado, 100)}%"></div>
            </div>
          </div>
        </div>
      `
          : `
        <div class="profile-field">
          <label>Horas Acumuladas:</label>
          <span>${this.currentUser.horasAcumuladas || 0} horas</span>
        </div>
      `
      }
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

  initializeEventListeners() {
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

    if (this.activeTab === "chat") {
      await this.loadChatPanel()
    }
  }

  async markNotificationRead(notificationId) {
    await window.db.markNotificationAsRead(notificationId)
    await this.loadNotificationsPanel()
  }

  // Administrador - Crear grupo
  showCreateGroupModal() {
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Crear Nuevo Grupo</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="createGroupForm">
            <div class="form-group">
              <label for="groupName">Nombre del Grupo:</label>
              <input type="text" id="groupName" required placeholder="Ej: Servicio Social - Comunidad">
            </div>
            <div class="form-group">
              <label for="groupDescription">Descripción:</label>
              <textarea id="groupDescription" required placeholder="Describe las actividades y objetivos del grupo..."></textarea>
            </div>
            <div class="form-group">
              <label for="groupType">Tipo de Grupo:</label>
              <select id="groupType" required onchange="window.dashboardManager.updateGroupTypeInfo()">
                <option value="">Seleccionar tipo</option>
                <option value="servicio_social">Servicio Social</option>
                <option value="taller_curso">Taller/Curso</option>
              </select>
              <div id="groupTypeInfo" class="info-message" style="display: none; margin-top: 8px;">
                <p id="groupTypeDescription"></p>
              </div>
            </div>
            <div class="form-group">
              <label for="groupTeacher">Maestro Responsable:</label>
              <select id="groupTeacher" required>
                <option value="">Seleccionar maestro</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Crear Grupo
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Cargar maestros disponibles
    this.loadTeachersForSelect()

    // Manejar envío del formulario
    document.getElementById("createGroupForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createGroup()
    })

    // Cerrar modal al hacer clic fuera
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  async loadTeachersForSelect() {
    try {
      const teachers = await window.db.getAllUsers()
      const teacherSelect = document.getElementById("groupTeacher")

      if (!teacherSelect) return

      // Limpiar opciones existentes excepto la primera
      teacherSelect.innerHTML = '<option value="">Seleccionar maestro</option>'

      const teacherUsers = teachers.filter((user) => user.tipoUsuario === "maestro" && user.activo)

      if (teacherUsers.length === 0) {
        const option = document.createElement("option")
        option.value = ""
        option.textContent = "No hay maestros disponibles"
        option.disabled = true
        teacherSelect.appendChild(option)
        return
      }

      teacherUsers.forEach((teacher) => {
        const option = document.createElement("option")
        option.value = teacher.matricula
        option.textContent = `${teacher.nombre} ${teacher.apellidos} (${teacher.matricula})`
        teacherSelect.appendChild(option)
      })
    } catch (error) {
      console.error("[v0] Error loading teachers:", error)
      this.showNotification("Error al cargar maestros", "error")
    }
  }

  async createGroup() {
    const groupName = document.getElementById("groupName").value.trim()
    const groupDescription = document.getElementById("groupDescription").value.trim()
    const groupType = document.getElementById("groupType").value
    const groupTeacher = document.getElementById("groupTeacher").value

    // Validaciones
    if (!groupName || !groupDescription || !groupType || !groupTeacher) {
      this.showNotification("Por favor, completa todos los campos", "error")
      return
    }

    if (groupName.length < 3) {
      this.showNotification("El nombre del grupo debe tener al menos 3 caracteres", "error")
      return
    }

    if (groupDescription.length < 10) {
      this.showNotification("La descripción debe tener al menos 10 caracteres", "error")
      return
    }

    const groupData = {
      nombre: groupName,
      descripcion: groupDescription,
      tipoGrupo: groupType,
      maestroResponsable: groupTeacher,
    }

    try {
      await window.db.addGroup(groupData)

      // Cerrar modal
      document.querySelector(".modal-overlay").remove()

      // Recargar panel
      await this.loadMainPanel()

      // Actualizar estadísticas
      await this.loadUserData()
      this.updateHomeTab()

      // Mostrar notificación de éxito
      const typeText = groupType === "servicio_social" ? "Servicio Social" : "Taller/Curso"
      this.showNotification(`Grupo de ${typeText} creado exitosamente`, "success")
    } catch (error) {
      console.error("[v0] Error creating group:", error)
      this.showNotification("Error al crear el grupo: " + error.message, "error")
    }
  }

  // Maestro - Crear tarea para grupo
  async createTaskForGroup(groupId) {
    const group = await window.db.getGroupById(groupId)
    if (!group) return

    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content wide">
        <div class="modal-header">
          <h3>Crear Tarea para: ${group.nombre}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="createTaskForm">
            <div class="form-group">
              <label for="taskTitle">Título de la Tarea:</label>
              <input type="text" id="taskTitle" required placeholder="Ej: Recolección de basura en parque">
            </div>
            <div class="form-group">
              <label for="taskDescription">Descripción:</label>
              <textarea id="taskDescription" required placeholder="Describe las actividades y objetivos de la tarea..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="taskMaxStudents">Límite de estudiantes:</label>
                <input type="number" id="taskMaxStudents" min="1" placeholder="Dejar vacío para sin límite">
                <small class="form-help">Número máximo de estudiantes que pueden inscribirse</small>
              </div>
              ${
                group.tipoGrupo === "servicio_social"
                  ? `
              <div class="form-group">
                <label for="taskHours">Horas que otorga:</label>
                <input type="number" id="taskHours" min="0" step="0.5" required placeholder="Ej: 5">
                <small class="form-help">Horas de servicio social que se acreditarán</small>
              </div>
              `
                  : `
              <input type="hidden" id="taskHours" value="0">
              <div class="info-message">
                <p><strong>Nota:</strong> Este es un grupo de Taller/Curso. Las tareas no otorgarán horas de servicio social.</p>
              </div>
              `
              }
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="taskPriority">Prioridad:</label>
                <select id="taskPriority" required>
                  <option value="low">Baja</option>
                  <option value="medium" selected>Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div class="form-group">
                <label for="taskDueDate">Fecha límite:</label>
                <input type="date" id="taskDueDate" required>
              </div>
            </div>
            
            <div class="task-form-section">
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px;">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13,2 13,9 20,9"></polyline>
                </svg>
                Archivo de la Tarea (Opcional)
              </h4>
              <div class="form-group">
                <label for="taskFile">Los estudiantes podrán subir un archivo al inscribirse:</label>
                <div class="file-upload-area" id="taskFileUploadArea">
                  <input type="file" id="taskFile" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png">
                  <div class="file-upload-text">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17,8 12,3 7,8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Haz clic o arrastra un archivo aquí</p>
                  </div>
                  <div class="file-upload-hint">PDF, Word, imágenes (máx. 10MB)</div>
                </div>
                <div id="uploadedFileInfo" style="display: none;"></div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("taskDueDate").min = today

    // Manejar envío del formulario
    document.getElementById("createTaskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createTask(groupId)
    })

    // Manejar área de subida de archivos
    const fileInput = document.getElementById("taskFile")
    const uploadArea = document.getElementById("taskFileUploadArea")
    const uploadedInfo = document.getElementById("uploadedFileInfo")

    uploadArea.addEventListener("click", () => fileInput.click())

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        uploadedInfo.style.display = "block"
        uploadedInfo.innerHTML = `
          <div class="uploaded-file">
            <span class="uploaded-file-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13,2 13,9 20,9"></polyline>
              </svg>
              ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            </span>
            <button type="button" class="remove-file" onclick="document.getElementById('taskFile').value=''; document.getElementById('uploadedFileInfo').style.display='none';">
              ✕
            </button>
          </div>
        `
      }
    })

    // Drag and drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      uploadArea.classList.add("dragover")
    })

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover")
    })

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault()
      uploadArea.classList.remove("dragover")
      const file = e.dataTransfer.files[0]
      if (file) {
        fileInput.files = e.dataTransfer.files
        fileInput.dispatchEvent(new Event("change"))
      }
    })
  }

  async createTask(groupId) {
    const taskData = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDescription").value,
      maxStudents: document.getElementById("taskMaxStudents").value
        ? Number.parseInt(document.getElementById("taskMaxStudents").value)
        : null,
      hoursAssigned: Number.parseFloat(document.getElementById("taskHours").value) || 0,
      priority: document.getElementById("taskPriority").value,
      dueDate: new Date(document.getElementById("taskDueDate").value),
      groupId: groupId,
      createdBy: this.currentUser.matricula,
      status: "pending",
      currentEnrollments: 0,
      isAvailable: true,
      allowFiles: document.getElementById("taskAllowFiles") ? document.getElementById("taskAllowFiles").checked : false,
    }

    try {
      await window.db.addTask(taskData)
      document.querySelector(".modal-overlay").remove()

      // Si hay un modal de grupo abierto, recargar
      if (document.getElementById("tasksTab")) {
        await this.enterGroup(groupId)
      } else {
        await this.loadMainPanel()
      }

      this.showNotification("Tarea creada exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error creating task:", error)
      this.showNotification("Error al crear la tarea", "error")
    }
  }

  // Estudiante - Inscribirse en tarea
  async enrollInTask(taskId) {
    try {
      await window.db.enrollStudentInTask(taskId, this.currentUser.matricula)

      // Recargar panel
      await this.loadMainPanel()

      // Mostrar notificación de éxito
      this.showNotification("Te has inscrito exitosamente en la tarea", "success")
    } catch (error) {
      console.error("[v0] Error enrolling in task:", error)
      this.showNotification(error.message || "Error al inscribirse en la tarea", "error")
    }
  }

  // Completar tarea y sumar horas
  async markTaskComplete(taskId) {
    try {
      const result = await window.db.completeTaskAndAddHours(taskId, this.currentUser.matricula)

      if (result.success) {
        // Recargar panel
        await this.loadMainPanel()

        // Mostrar notificación con información de horas
        if (result.hoursAdded > 0) {
          this.showNotification(
            `Tarea completada. Se han agregado ${result.hoursAdded} horas. Total: ${result.newTotal} horas`,
            "success",
          )
        } else {
          this.showNotification("Tarea completada exitosamente", "success")
        }
      }
    } catch (error) {
      console.error("[v0] Error completing task:", error)
      this.showNotification("Error al completar la tarea", "error")
    }
  }

  // Mostrar notificaciones
  showNotification(message, type = "info") {
    // Remover notificaciones existentes
    const existingToasts = document.querySelectorAll(".notification-toast")
    existingToasts.forEach((toast) => toast.remove())

    const notification = document.createElement("div")
    notification.className = `notification-toast ${type}`

    // Agregar icono según el tipo
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`,
    }

    notification.innerHTML = `
      <div style="display: flex; align-items: center;">
        ${icons[type] || icons.info}
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(notification)

    // Remover después de 4 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = "slideOutRight 0.3s ease-in"
        setTimeout(() => notification.remove(), 300)
      }
    }, 4000)
  }

  async viewGroupTasks(groupId) {
    try {
      const group = await window.db.getGroupById(groupId)
      const tasks = await window.db.getTasksByGroup(groupId)

      const modal = document.createElement("div")
      modal.className = "modal-overlay large-modal"
      modal.innerHTML = `
        <div class="modal-content extra-wide">
          <div class="modal-header">
            <h3>Tareas del Grupo: ${group.nombre}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="tasks-detailed-list">
              ${
                tasks.length > 0
                  ? tasks
                      .map(
                        (task) => {
                          const isEnrolled = task.enrolledStudents.some(s => s.matricula === this.currentUser.matricula)
                          const isCompleted = task.status === "completed" // Assuming task has status if enrolled
                          const canEnroll = task.isAvailable && (!task.maxStudents || task.currentEnrollments < task.maxStudents) && !isEnrolled

                          return `
                    <div class="task-detailed-item ${task.isAvailable ? "available" : "closed"} ${isEnrolled ? "enrolled" : ""}">
                      <div class="task-detailed-header">
                        <h5>${task.title}</h5>
                        <div class="task-status-badges">
                          ${
                            task.hoursAssigned > 0
                              ? `<span class="hours-badge">+${task.hoursAssigned} horas</span>`
                              : '<span class="no-hours-badge">Sin horas</span>'
                          }
                          <span class="status-badge ${task.isAvailable ? "available" : "closed"}">
                            ${task.isAvailable ? "✓ Abierta" : "✗ Cerrada"}
                          </span>
                          ${
                            task.maxStudents
                              ? `<span class="capacity-badge ${task.currentEnrollments >= task.maxStudents ? "full" : ""}">${task.currentEnrollments || 0}/${task.maxStudents} inscritos</span>`
                              : `<span class="unlimited-badge">${task.currentEnrollments || 0} inscritos</span>`
                          }
                          ${
                            isEnrolled
                              ? `<span class="enrollment-badge enrolled">Inscrito</span>`
                              : canEnroll
                              ? `<span class="enrollment-badge available">Disponible</span>`
                              : `<span class="enrollment-badge unavailable">No disponible</span>`
                          }
                        </div>
                      </div>
                      <p class="task-description">${task.description}</p>
                      <div class="task-meta-info">
                        <span class="priority-badge ${task.priority}">
                          ${task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"} prioridad
                        </span>
                        <span class="due-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Vence: ${new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div class="task-actions">
                        ${
                          isEnrolled && !isCompleted
                            ? `
                          <button onclick="window.dashboardManager.markTaskComplete(${task.id})" class="btn-success">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                            Marcar como Terminada
                          </button>
                          <button onclick="window.dashboardManager.attachDocumentToTask(${task.id})" class="btn-outline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17,8 12,3 7,8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Adjuntar Documento
                          </button>
                        `
                            : isEnrolled && isCompleted
                            ? `<span class="completed-status">✓ Tarea completada</span>`
                            : canEnroll
                            ? `<button onclick="window.dashboardManager.enrollInTaskWithFile(${task.id})" class="btn-primary">Inscribirse</button>`
                            : `<span class="unavailable-status">No disponible para inscribirse</span>`
                        }
                      </div>
                    </div>
                  `
                        }
                      )
                      .join("")
                  : '<div class="empty-state"><p class="no-tasks">No hay tareas creadas para este grupo</p></div>'
              }
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error viewing group tasks:", error)
      this.showNotification("Error al cargar las tareas del grupo", "error")
    }
  }

  // Métodos placeholder para funcionalidades futuras
  editGroup(groupId) {
    this.showNotification("Función de editar grupo - próximamente", "info")
  }

  manageGroupStudents(groupId) {
    this.showNotification("Función de gestionar estudiantes - próximamente", "info")
  }

  editTask(taskId) {
    this.showNotification("Función de editar tarea - próximamente", "info")
  }

  viewTaskEnrollments(taskId) {
    this.showNotification("Función de ver inscritos - próximamente", "info")
  }

  deleteTask(taskId) {
    this.showNotification("Función de eliminar tarea - próximamente", "info")
  }

  showEditProfile() {
    this.showNotification("Función de editar perfil - próximamente", "info")
  }

  showChangePassword() {
    this.showNotification("Función de cambiar contraseña - próximamente", "info")
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

  updateGroupTypeInfo() {
    const groupType = document.getElementById("groupType").value
    const infoDiv = document.getElementById("groupTypeInfo")
    const descriptionP = document.getElementById("groupTypeDescription")

    if (groupType) {
      const descriptions = {
        servicio_social:
          "Las tareas de este grupo SÍ sumarán horas al servicio social de los estudiantes. Ideal para actividades comunitarias y proyectos de impacto social.",
        taller_curso:
          "Las tareas de este grupo NO sumarán horas de servicio social. Perfecto para talleres, cursos y actividades académicas regulares.",
      }

      descriptionP.textContent = descriptions[groupType]
      infoDiv.style.display = "block"
    } else {
      infoDiv.style.display = "none"
    }
  }

  // Administrador - Crear usuario
  showCreateUserModal() {
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Crear Nuevo Usuario</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="createUserForm">
            <div class="form-group">
              <label for="userMatricula">Matrícula:</label>
              <input type="text" id="userMatricula" required placeholder="Ej: est001, maestro001">
            </div>
            <div class="form-group">
              <label for="userName">Nombre:</label>
              <input type="text" id="userName" required>
            </div>
            <div class="form-group">
              <label for="userLastName">Apellidos:</label>
              <input type="text" id="userLastName" required>
            </div>
            <div class="form-group">
              <label for="userEmail">Email:</label>
              <input type="email" id="userEmail" required>
            </div>
            <div class="form-group">
              <label for="userType">Tipo de Usuario:</label>
              <select id="userType" required>
                <option value="">Seleccionar tipo</option>
                <option value="estudiante">Estudiante</option>
                <option value="maestro">Maestro</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div class="form-group">
              <label for="userPassword">Contraseña:</label>
              <input type="password" id="userPassword" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("createUserForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createUser()
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  async createUser() {
    const userData = {
      matricula: document.getElementById("userMatricula").value.trim(),
      nombre: document.getElementById("userName").value.trim(),
      apellidos: document.getElementById("userLastName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      tipoUsuario: document.getElementById("userType").value,
      password: document.getElementById("userPassword").value,
    }

    if (
      !userData.matricula ||
      !userData.nombre ||
      !userData.apellidos ||
      !userData.email ||
      !userData.tipoUsuario ||
      !userData.password
    ) {
      this.showNotification("Por favor, completa todos los campos", "error")
      return
    }

    try {
      await window.db.createUser(userData)
      document.querySelector(".modal-overlay").remove()
      await this.loadMainPanel()
      await this.loadUserData()
      this.updateHomeTab()
      this.showNotification("Usuario creado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error creating user:", error)
      this.showNotification(error.message || "Error al crear el usuario", "error")
    }
  }

  // Administrador - Editar usuario
  async editUser(matricula) {
    try {
      const user = await window.db.getUser(matricula)
      if (!user) {
        this.showNotification("Usuario no encontrado", "error")
        return
      }

      const modal = document.createElement("div")
      modal.className = "modal-overlay"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Editar Usuario</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <form id="editUserForm">
              <div class="form-group">
                <label for="editUserMatricula">Matrícula:</label>
                <input type="text" id="editUserMatricula" value="${user.matricula}" readonly>
              </div>
              <div class="form-group">
                <label for="editUserName">Nombre:</label>
                <input type="text" id="editUserName" value="${user.nombre}" required>
              </div>
              <div class="form-group">
                <label for="editUserLastName">Apellidos:</label>
                <input type="text" id="editUserLastName" value="${user.apellidos}" required>
              </div>
              <div class="form-group">
                <label for="editUserEmail">Email:</label>
                <input type="email" id="editUserEmail" value="${user.email}" required>
              </div>
              <div class="form-group">
                <label for="editUserType">Tipo de Usuario:</label>
                <select id="editUserType" required>
                  <option value="estudiante" ${user.tipoUsuario === "estudiante" ? "selected" : ""}>Estudiante</option>
                  <option value="maestro" ${user.tipoUsuario === "maestro" ? "selected" : ""}>Maestro</option>
                  <option value="administrador" ${user.tipoUsuario === "administrador" ? "selected" : ""}>Administrador</option>
                </select>
              </div>
              <div class="form-group">
                <label for="editUserActive">Estado:</label>
                <select id="editUserActive" required>
                  <option value="true" ${user.activo ? "selected" : ""}>Activo</option>
                  <option value="false" ${!user.activo ? "selected" : ""}>Inactivo</option>
                </select>
              </div>
              ${
                user.tipoUsuario === "estudiante"
                  ? `
              <div class="form-group">
                <label for="editUserHours">Horas Completadas:</label>
                <input type="number" id="editUserHours" value="${user.horasCompletadas || 0}" min="0" step="0.5">
              </div>
              `
                  : ""
              }
              <div class="form-actions">
                <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn-primary">
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      document.getElementById("editUserForm").addEventListener("submit", (e) => {
        e.preventDefault()
        this.updateUser(matricula)
      })

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error loading user for edit:", error)
      this.showNotification("Error al cargar los datos del usuario", "error")
    }
  }

  async updateUser(matricula) {
    const userData = {
      matricula: matricula,
      nombre: document.getElementById("editUserName").value.trim(),
      apellidos: document.getElementById("editUserLastName").value.trim(),
      email: document.getElementById("editUserEmail").value.trim(),
      tipoUsuario: document.getElementById("editUserType").value,
      activo: document.getElementById("editUserActive").value === "true",
    }

    const hoursInput = document.getElementById("editUserHours")
    if (hoursInput) {
      userData.horasCompletadas = Number.parseFloat(hoursInput.value) || 0
      userData.horasAcumuladas = userData.horasCompletadas
    }

    try {
      const originalUser = await window.db.getUser(matricula)
      const updatedUser = { ...originalUser, ...userData }

      await window.db.updateUser(matricula, updatedUser)
      document.querySelector(".modal-overlay").remove()
      await this.loadMainPanel()
      this.showNotification("Usuario actualizado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      this.showNotification("Error al actualizar el usuario", "error")
    }
  }

  // Administrador - Eliminar usuario
  async deleteUser(matricula) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await window.db.deleteUser(matricula)
      await this.loadMainPanel()
      await this.loadUserData()
      this.updateHomeTab()
      this.showNotification("Usuario eliminado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      this.showNotification("Error al eliminar el usuario", "error")
    }
  }

  // Administrador - Eliminar grupo
  async deleteGroup(groupId) {
    if (!confirm("¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await window.db.deleteGroup(groupId)
      await this.loadMainPanel()
      await this.loadUserData()
      this.updateHomeTab()
      this.showNotification("Grupo eliminado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error deleting group:", error)
      this.showNotification("Error al eliminar el grupo", "error")
    }
  }

  // Maestro - Entrar al grupo (ver tareas y estudiantes)
  async enterGroup(groupId) {
    try {
      const group = await window.db.getGroupById(groupId)
      const tasks = await window.db.getTasksByGroup(groupId)

      const modal = document.createElement("div")
      modal.className = "modal-overlay large-modal"
      modal.innerHTML = `
        <div class="modal-content extra-wide">
          <div class="modal-header">
            <h3>Grupo: ${group.nombre}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="group-details-tabs">
              <div class="tab-buttons">
                <button class="tab-btn active" onclick="window.dashboardManager.switchGroupTab('tasks', this)">Tareas</button>
                <button class="tab-btn" onclick="window.dashboardManager.switchGroupTab('students', this)">Estudiantes</button>
              </div>
              
              <div id="tasksTab" class="tab-content active">
                <div class="section-header">
                  <h4>Tareas del Grupo</h4>
                  <button class="btn-primary" onclick="window.dashboardManager.createTaskForGroup(${groupId})">
                    Crear Nueva Tarea
                  </button>
                </div>
                <div class="tasks-detailed-list">
                  ${
                    tasks.length > 0
                      ? tasks
                          .map(
                            (task) => `
                    <div class="task-detailed-item">
                      <div class="task-detailed-header">
                        <h5>${task.title}</h5>
                        <div class="task-status-badges">
                          ${
                            task.hoursAssigned > 0
                              ? `<span class="hours-badge">${task.hoursAssigned} horas</span>`
                              : '<span class="no-hours-badge">Sin horas</span>'
                          }
                          <span class="status-badge ${task.isAvailable ? "available" : "closed"}">
                            ${task.isAvailable ? "Disponible" : "Cerrada"}
                          </span>
                          ${
                            task.maxStudents
                              ? `<span class="capacity-badge">${task.currentEnrollments || 0}/${task.maxStudents}</span>`
                              : '<span class="unlimited-badge">Sin límite</span>'
                          }
                        </div>
                      </div>
                      <p>${task.description}</p>
                      <div class="enrolled-students">
                        <h6>Estudiantes inscritos (${task.enrolledStudents.length}):</h6>
                        ${
                          task.enrolledStudents.length > 0
                            ? `<div class="students-list">
                            ${task.enrolledStudents
                              .map(
                                (student) =>
                                  `<span class="student-chip">${student.nombre} (${student.matricula})</span>`,
                              )
                              .join("")}
                          </div>`
                            : '<p class="no-students">Ningún estudiante inscrito</p>'
                        }
                      </div>
                    </div>
                  `,
                          )
                          .join("")
                      : '<p class="no-tasks">No hay tareas creadas para este grupo</p>'
                  }
                </div>
              </div>
              
              <div id="studentsTab" class="tab-content">
                <div class="section-header">
                  <h4>Estudiantes del Grupo</h4>
                  <button class="btn-primary" onclick="window.dashboardManager.addStudentToGroup(${groupId})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Añadir Estudiante
                  </button>
                </div>
                <div id="groupStudentsList">
                   Se carga dinámicamente 
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Cargar estudiantes del grupo
      await this.loadGroupStudents(groupId)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error entering group:", error)
      this.showNotification("Error al cargar el grupo", "error")
    }
  }

  switchGroupTab(tabName, button) {
    // Remover clase active de todos los botones y contenidos
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

    // Activar el botón y contenido seleccionado
    button.classList.add("active")
    document.getElementById(`${tabName}Tab`).classList.add("active")
  }

  async loadGroupStudents(groupId) {
    try {
      const group = await window.db.getGroupById(groupId)
      const allUsers = await window.db.getAllUsers()
      const assignedStudents = (group.alumnosAsignados || [])
        .map((matricula) => allUsers.find((user) => user.matricula === matricula))
        .filter(Boolean)

      const studentsList = document.getElementById("groupStudentsList")
      if (!studentsList) return

      studentsList.innerHTML = `
        <div class="students-grid">
          ${
            assignedStudents.length > 0
              ? assignedStudents
                  .map(
                    (student) => `
            <div class="student-card">
              <div class="student-header">
                <h5>${student.nombre} ${student.apellidos}</h5>
                <span class="student-matricula">${student.matricula}</span>
              </div>
              <p class="student-email">${student.email}</p>
              ${
                student.tipoUsuario === "estudiante"
                  ? `<div class="student-hours">
                  <span class="hours-info">${student.horasCompletadas || 0}/${student.horasRequeridas || 480} horas</span>
                </div>`
                  : ""
              }
              <div class="student-actions">
                <button onclick="window.dashboardManager.removeStudentFromGroup(${groupId}, '${student.matricula}')" class="btn-delete-small">
                  Remover
                </button>
              </div>
            </div>
          `,
                  )
                  .join("")
              : '<p class="no-students">No hay estudiantes asignados a este grupo</p>'
          }
        </div>
      `
    } catch (error) {
      console.error("[v0] Error loading group students:", error)
    }
  }

  // Maestro - Añadir estudiante al grupo
  async addStudentToGroup(groupId) {
    try {
      const availableStudents = await window.db.getAvailableStudentsForGroup(groupId)

      if (availableStudents.length === 0) {
        this.showNotification("No hay estudiantes disponibles para asignar", "info")
        return
      }

      const modal = document.createElement("div")
      modal.className = "modal-overlay"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Añadir Estudiante al Grupo</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <form id="addStudentForm">
              <div class="form-group">
                <label for="selectStudent">Seleccionar Estudiante:</label>
                <select id="selectStudent" required>
                  <option value="">Seleccionar estudiante</option>
                  ${availableStudents
                    .map(
                      (student) =>
                        `<option value="${student.matricula}">${student.nombre} ${student.apellidos} (${student.matricula})</option>`,
                    )
                    .join("")}
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn-primary">
                  Añadir Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      document.getElementById("addStudentForm").addEventListener("submit", (e) => {
        e.preventDefault()
        this.assignStudentToGroup(groupId)
      })

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error loading available students:", error)
      this.showNotification("Error al cargar estudiantes disponibles", "error")
    }
  }

  async assignStudentToGroup(groupId) {
    const studentId = document.getElementById("selectStudent").value

    if (!studentId) {
      this.showNotification("Por favor, selecciona un estudiante", "error")
      return
    }

    try {
      await window.db.assignUserToGroup(groupId, studentId, this.currentUser.matricula)
      document.querySelector(".modal-overlay").remove()

      // Si hay un modal de grupo abierto, recargar la lista de estudiantes
      if (document.getElementById("groupStudentsList")) {
        await this.loadGroupStudents(groupId)
      }

      this.showNotification("Estudiante añadido al grupo exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error assigning student to group:", error)
      this.showNotification(error.message || "Error al añadir estudiante al grupo", "error")
    }
  }

  async removeStudentFromGroup(groupId, studentId) {
    if (!confirm("¿Estás seguro de que deseas remover este estudiante del grupo?")) {
      return
    }

    try {
      await window.db.removeUserFromGroup(groupId, studentId)
      await this.loadGroupStudents(groupId)
      this.showNotification("Estudiante removido del grupo exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error removing student from group:", error)
      this.showNotification("Error al remover estudiante del grupo", "error")
    }
  }

  // Estudiante - Inscribirse en tarea con archivo
  async enrollInTaskWithFile(taskId) {
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Inscribirse en Tarea</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="enrollTaskForm">
            <div class="form-group">
              <label for="taskFile">Archivo (opcional):</label>
              <input type="file" id="taskFile" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png">
              <small class="form-help">Puedes subir un archivo relacionado con la tarea (opcional)</small>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                Inscribirse
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("enrollTaskForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.processTaskEnrollment(taskId)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  async processTaskEnrollment(taskId) {
    const fileInput = document.getElementById("taskFile")
    const file = fileInput.files[0] || null

    try {
      await window.db.enrollStudentInTaskWithFile(taskId, this.currentUser.matricula, file)
      document.querySelector(".modal-overlay").remove()
      await this.loadMainPanel()

      const message = file
        ? "Te has inscrito exitosamente en la tarea y tu archivo ha sido subido"
        : "Te has inscrito exitosamente en la tarea"

      this.showNotification(message, "success")
    } catch (error) {
      console.error("[v0] Error enrolling in task:", error)
      this.showNotification(error.message || "Error al inscribirse en la tarea", "error")
    }
  }

  // Estudiante - Adjuntar documento a tarea
  async attachDocumentToTask(taskId) {
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Adjuntar Documento</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="attachDocumentForm">
            <div class="form-group">
              <label for="taskDocument">Seleccionar Archivo:</label>
              <input type="file" id="taskDocument" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" required>
              <small class="form-help">Formatos permitidos: PDF, Word, imágenes (máx. 10MB)</small>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17,8 12,3 7,8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Adjuntar Documento
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("attachDocumentForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.processDocumentAttachment(taskId)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  async processDocumentAttachment(taskId) {
    const fileInput = document.getElementById("taskDocument")
    const file = fileInput.files[0]

    if (!file) {
      this.showNotification("Por favor, selecciona un archivo", "error")
      return
    }

    // Validar tamaño del archivo (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification("El archivo es demasiado grande. Máximo 10MB", "error")
      return
    }

    try {
      await window.db.addTaskFile(taskId, file, this.currentUser.matricula)
      document.querySelector(".modal-overlay").remove()
      this.showNotification("Documento adjuntado exitosamente", "success")
    } catch (error) {
      console.error("[v0] Error attaching document:", error)
      this.showNotification("Error al adjuntar el documento", "error")
    }
  }

  // Estudiante - Ver detalles de tarea
  async viewTaskDetails(taskId) {
    try {
      const task = await window.db.getTaskById(taskId)
      const enrollments = await window.db.getTaskEnrollmentsWithDetails(taskId)

      const modal = document.createElement("div")
      modal.className = "modal-overlay"
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>${task.title}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="task-details">
              <div class="task-info">
                <p><strong>Descripción:</strong> ${task.description}</p>
                <p><strong>Fecha límite:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                <p><strong>Prioridad:</strong> ${task.priority}</p>
                ${
                  task.hoursAssigned > 0
                    ? `<p><strong>Horas que otorga:</strong> ${task.hoursAssigned}</p>`
                    : "<p><strong>Horas:</strong> Esta tarea no otorga horas</p>"
                }
                ${
                  task.maxStudents
                    ? `<p><strong>Cupo:</strong> ${task.currentEnrollments || 0}/${task.maxStudents} estudiantes</p>`
                    : "<p><strong>Cupo:</strong> Sin límite</p>"
                }
              </div>

              <div class="enrolled-students-section">
                <h4>Estudiantes Inscritos (${enrollments.length})</h4>
                ${
                  enrollments.length > 0
                    ? `<div class="enrolled-students-list">
                    ${enrollments
                      .map(
                        (enrollment) =>
                          `<div class="enrolled-student-item">
                        <span class="student-name">${enrollment.studentName}</span>
                        <span class="student-matricula">(${enrollment.studentMatricula})</span>
                      </div>`,
                      )
                      .join("")}
                  </div>`
                    : '<p class="no-enrollments">Ningún estudiante inscrito aún</p>'
                }
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">
                Cerrar
              </button>
              ${
                task.isAvailable && (!task.maxStudents || task.currentEnrollments < task.maxStudents)
                  ? `<button class="btn-primary" onclick="window.dashboardManager.enrollInTaskWithFile(${taskId}); this.closest('.modal-overlay').remove();">
                  Inscribirse
                </button>`
                  : '<span class="task-full-notice">Tarea no disponible o llena</span>'
              }
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error("[v0] Error loading task details:", error)
      this.showNotification("Error al cargar los detalles de la tarea", "error")
    }
  }
}

// Initialize global dashboard manager
window.dashboardManager = new DashboardManager()
