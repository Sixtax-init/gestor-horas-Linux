// Main Application Controller
class TaskManagementApp {
  constructor() {
    this.initialized = false
    this.currentModal = null
    this.init()
  }

  // Initialize the application
  async init() {
    // Wait for database to be ready
    if (!window.db || !window.db.db) {
      setTimeout(() => this.init(), 100)
      return
    }

    this.setupEventListeners()
    this.initialized = true

    console.log("[v0] Task Management App initialized")
  }

  // Setup all event listeners
  setupEventListeners() {
    // Login form
    const loginBtn = document.getElementById("loginBtn")
    const logoutBtn = document.getElementById("logoutBtn")

    if (loginBtn) {
      loginBtn.addEventListener("click", () => this.handleLogin())
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout())
    }

    // Enter key on login form
    const loginInputs = document.querySelectorAll("#loginScreen input")
    loginInputs.forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleLogin()
        }
      })
    })

    // Setup auto-logout
    if (window.auth) {
      window.auth.setupAutoLogout(30) // 30 minutes
    }
  }

  // Handle login
  async handleLogin() {
    const matricula = document.getElementById("matricula").value
    const password = document.getElementById("password").value
    const userType = document.getElementById("userType").value

    if (!matricula || !password) {
      this.showAlert("Por favor, completa todos los campos", "error")
      return
    }

    const result = await window.auth.login(matricula, password, userType)

    if (result.success) {
      this.showAlert("Inicio de sesión exitoso", "success")
      // Clear form
      document.getElementById("matricula").value = ""
      document.getElementById("password").value = ""
    } else {
      this.showAlert(result.error, "error")
    }
  }

  // Handle logout
  async handleLogout() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await window.auth.logout()
      this.showAlert("Sesión cerrada correctamente", "info")
    }
  }

  // Show alert message
  showAlert(message, type = "info") {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert")
    if (existingAlert) {
      existingAlert.remove()
    }

    const alert = document.createElement("div")
    alert.className = `alert alert-${type}`
    alert.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="alert-close">&times;</button>
    `

    document.body.appendChild(alert)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove()
      }
    }, 5000)
  }

  // Task Management Functions
  async createTask(taskData) {
    try {
      const task = {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: taskData.status || "pending",
        hasHours: taskData.hasHours || false,
        hoursAssigned: taskData.hoursAssigned || 0,
        hoursCompleted: 0,
      }

      const taskId = await window.db.addTask(task)

      // Create notification for assigned user
      if (taskData.userId !== window.auth.getCurrentUser().matricula) {
        const hoursMessage = task.hasHours
          ? ` (${task.hoursAssigned} horas de servicio social)`
          : " (sin horas asignadas)"

        await this.createNotification({
          userId: taskData.userId,
          title: "Nueva tarea asignada",
          message: `Se te ha asignado la tarea: ${taskData.title}${hoursMessage}`,
          type: "task",
        })
      }

      this.showAlert("Tarea creada exitosamente", "success")
      return { success: true, taskId }
    } catch (error) {
      console.error("[v0] Error creating task:", error)
      this.showAlert("Error al crear la tarea", "error")
      return { success: false, error: error.message }
    }
  }

  async updateTask(taskId, updates) {
    try {
      const task = await window.db.getTask(taskId)
      if (!task) {
        throw new Error("Tarea no encontrada")
      }

      const updatedTask = {
        ...task,
        ...updates,
        updatedAt: new Date(),
      }

      await window.db.updateTask(taskId, updatedTask)

      if (updates.status === "completed" && task.hasHours && task.status !== "completed") {
        const hoursResult = await window.db.updateUserHours(task.userId, task.hoursAssigned)
        if (hoursResult.success) {
          await this.createNotification({
            userId: task.userId,
            title: "Horas de servicio social acreditadas",
            message: `Se han acreditado ${task.hoursAssigned} horas. Total: ${hoursResult.newTotal}/480 horas`,
            type: "hours_update",
          })
        }
      }

      // Create notification if status changed
      if (updates.status && updates.status !== task.status) {
        await this.createNotification({
          userId: task.userId,
          title: "Estado de tarea actualizado",
          message: `La tarea "${task.title}" cambió a: ${updates.status}`,
          type: "task_update",
        })
      }

      this.showAlert("Tarea actualizada exitosamente", "success")
      return { success: true }
    } catch (error) {
      console.error("[v0] Error updating task:", error)
      this.showAlert("Error al actualizar la tarea", "error")
      return { success: false, error: error.message }
    }
  }

  async deleteTask(taskId) {
    try {
      if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
        return { success: false, cancelled: true }
      }

      await window.db.deleteTask(taskId)
      this.showAlert("Tarea eliminada exitosamente", "success")

      // Refresh current view
      if (window.dashboardManager && window.dashboardManager.activeTab === "main") {
        await window.dashboardManager.loadMainPanel()
      }

      return { success: true }
    } catch (error) {
      console.error("[v0] Error deleting task:", error)
      this.showAlert("Error al eliminar la tarea", "error")
      return { success: false, error: error.message }
    }
  }

  // Notification Management
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        read: false,
        createdAt: new Date(),
      }

      await window.db.addNotification(notification)
      return { success: true }
    } catch (error) {
      console.error("[v0] Error creating notification:", error)
      return { success: false, error: error.message }
    }
  }

  // Modal Management
  showModal(content, title = "Modal") {
    this.closeModal() // Close any existing modal

    const modalOverlay = document.createElement("div")
    modalOverlay.className = "modal-overlay"
    modalOverlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="window.app.closeModal()">&times;</button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
      </div>
    `

    document.body.appendChild(modalOverlay)
    this.currentModal = modalOverlay

    // Close on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        this.closeModal()
      }
    })

    // Close on escape key
    document.addEventListener("keydown", this.handleEscapeKey.bind(this))
  }

  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove()
      this.currentModal = null
      document.removeEventListener("keydown", this.handleEscapeKey.bind(this))
    }
  }

  handleEscapeKey(e) {
    if (e.key === "Escape") {
      this.closeModal()
    }
  }

  // Task Creation Modal
  showCreateTaskModal() {
    const currentUser = window.auth.getCurrentUser()
    if (!currentUser) return

    const content = `
      <form id="createTaskForm" class="task-form">
        <div class="form-group">
          <label for="taskTitle">Título de la Tarea</label>
          <input type="text" id="taskTitle" required placeholder="Ingresa el título de la tarea">
        </div>
        
        <div class="form-group">
          <label for="taskDescription">Descripción</label>
          <textarea id="taskDescription" rows="4" placeholder="Describe la tarea..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="taskPriority">Prioridad</label>
          <select id="taskPriority">
            <option value="low">Baja</option>
            <option value="medium" selected>Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="taskDueDate">Fecha de Vencimiento</label>
          <input type="date" id="taskDueDate" required>
        </div>
        
        ${
          currentUser.tipoUsuario !== "estudiante"
            ? `
          <div class="form-group">
            <label for="taskAssignee">Asignar a</label>
            <select id="taskAssignee">
              <option value="${currentUser.matricula}">Yo mismo</option>
            </select>
          </div>
        `
            : ""
        }
        
        <!-- Added hours system to task creation form -->
        <div class="form-group">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="taskHasHours" onchange="window.app.toggleHoursInput()"> 
              Esta tarea otorga horas de servicio social
            </label>
          </div>
        </div>
        
        <div class="form-group" id="hoursInputGroup" style="display: none;">
          <label for="taskHours">Horas a asignar</label>
          <input type="number" id="taskHours" min="1" max="40" placeholder="Número de horas">
          <small>Máximo 40 horas por tarea</small>
        </div>
        
        <div class="form-actions">
          <button type="button" onclick="window.app.closeModal()" class="btn-outline">Cancelar</button>
          <button type="submit" class="btn-primary">Crear Tarea</button>
        </div>
      </form>
    `

    this.showModal(content, "Crear Nueva Tarea")

    // Load users for assignment (if not student)
    if (currentUser.tipoUsuario !== "estudiante") {
      this.loadUsersForAssignment()
    }

    // Set minimum date to today
    const dueDateInput = document.getElementById("taskDueDate")
    if (dueDateInput) {
      dueDateInput.min = new Date().toISOString().split("T")[0]
    }

    // Handle form submission
    const form = document.getElementById("createTaskForm")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleCreateTask()
      })
    }
  }

  toggleHoursInput() {
    const checkbox = document.getElementById("taskHasHours")
    const hoursGroup = document.getElementById("hoursInputGroup")
    const hoursInput = document.getElementById("taskHours")

    if (checkbox && hoursGroup) {
      if (checkbox.checked) {
        hoursGroup.style.display = "block"
        hoursInput.required = true
      } else {
        hoursGroup.style.display = "none"
        hoursInput.required = false
        hoursInput.value = ""
      }
    }
  }

  // Task Edit Modal
  async showEditTaskModal(taskId) {
    try {
      const task = await window.db.getTask(taskId)
      if (!task) {
        this.showAlert("Tarea no encontrada", "error")
        return
      }

      const content = `
        <form id="editTaskForm" class="task-form">
          <div class="form-group">
            <label for="editTaskTitle">Título de la Tarea</label>
            <input type="text" id="editTaskTitle" required value="${task.title}">
          </div>
          
          <div class="form-group">
            <label for="editTaskDescription">Descripción</label>
            <textarea id="editTaskDescription" rows="4">${task.description || ""}</textarea>
          </div>
          
          <div class="form-group">
            <label for="editTaskStatus">Estado</label>
            <select id="editTaskStatus">
              <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pendiente</option>
              <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>En Progreso</option>
              <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completada</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="editTaskPriority">Prioridad</label>
            <select id="editTaskPriority">
              <option value="low" ${task.priority === "low" ? "selected" : ""}>Baja</option>
              <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Media</option>
              <option value="high" ${task.priority === "high" ? "selected" : ""}>Alta</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="editTaskDueDate">Fecha de Vencimiento</label>
            <input type="date" id="editTaskDueDate" required value="${task.dueDate.toISOString().split("T")[0]}">
          </div>
          
          <div class="form-actions">
            <button type="button" onclick="window.app.closeModal()" class="btn-outline">Cancelar</button>
            <button type="submit" class="btn-primary">Actualizar Tarea</button>
          </div>
        </form>
      `

      this.showModal(content, "Editar Tarea")

      // Handle form submission
      const form = document.getElementById("editTaskForm")
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault()
          this.handleEditTask(taskId)
        })
      }
    } catch (error) {
      console.error("[v0] Error loading task for edit:", error)
      this.showAlert("Error al cargar la tarea", "error")
    }
  }

  async handleEditTask(taskId) {
    const title = document.getElementById("editTaskTitle").value
    const description = document.getElementById("editTaskDescription").value
    const status = document.getElementById("editTaskStatus").value
    const priority = document.getElementById("editTaskPriority").value
    const dueDate = document.getElementById("editTaskDueDate").value

    if (!title || !dueDate) {
      this.showAlert("Por favor, completa todos los campos obligatorios", "error")
      return
    }

    const updates = {
      title,
      description,
      status,
      priority,
      dueDate: new Date(dueDate),
    }

    const result = await this.updateTask(taskId, updates)

    if (result.success) {
      this.closeModal()
      // Refresh the main panel if currently viewing
      if (window.dashboardManager && window.dashboardManager.activeTab === "main") {
        await window.dashboardManager.loadMainPanel()
      }
    }
  }

  // Profile Management
  showEditProfileModal() {
    const currentUser = window.auth.getCurrentUser()
    if (!currentUser) return

    const content = `
      <form id="editProfileForm" class="profile-form">
        <div class="form-group">
          <label for="profileNombre">Nombre</label>
          <input type="text" id="profileNombre" required value="${currentUser.nombre}">
        </div>
        
        <div class="form-group">
          <label for="profileApellidos">Apellidos</label>
          <input type="text" id="profileApellidos" required value="${currentUser.apellidos}">
        </div>
        
        <div class="form-group">
          <label for="profileEmail">Email</label>
          <input type="email" id="profileEmail" required value="${currentUser.email}">
        </div>
        
        <div class="form-actions">
          <button type="button" onclick="window.app.closeModal()" class="btn-outline">Cancelar</button>
          <button type="submit" class="btn-primary">Actualizar Perfil</button>
        </div>
      </form>
    `

    this.showModal(content, "Editar Perfil")

    // Handle form submission
    const form = document.getElementById("editProfileForm")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleEditProfile()
      })
    }
  }

  async handleEditProfile() {
    const nombre = document.getElementById("profileNombre").value
    const apellidos = document.getElementById("profileApellidos").value
    const email = document.getElementById("profileEmail").value

    if (!nombre || !apellidos || !email) {
      this.showAlert("Por favor, completa todos los campos", "error")
      return
    }

    const result = await window.auth.updateProfile({ nombre, apellidos, email })

    if (result.success) {
      this.showAlert("Perfil actualizado correctamente", "success")
      this.closeModal()
      // Refresh dashboard
      if (window.dashboardManager) {
        await window.dashboardManager.initialize(window.auth.getCurrentUser())
      }
    } else {
      this.showAlert(result.error, "error")
    }
  }

  // Change Password Modal
  showChangePasswordModal() {
    const content = `
      <form id="changePasswordForm" class="password-form">
        <div class="form-group">
          <label for="currentPassword">Contraseña Actual</label>
          <input type="password" id="currentPassword" required>
        </div>
        
        <div class="form-group">
          <label for="newPassword">Nueva Contraseña</label>
          <input type="password" id="newPassword" required minlength="6">
          <small>Mínimo 6 caracteres</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmar Nueva Contraseña</label>
          <input type="password" id="confirmPassword" required minlength="6">
        </div>
        
        <div class="form-actions">
          <button type="button" onclick="window.app.closeModal()" class="btn-outline">Cancelar</button>
          <button type="submit" class="btn-primary">Cambiar Contraseña</button>
        </div>
      </form>
    `

    this.showModal(content, "Cambiar Contraseña")

    // Handle form submission
    const form = document.getElementById("changePasswordForm")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleChangePassword()
      })
    }
  }

  async handleChangePassword() {
    const currentPassword = document.getElementById("currentPassword").value
    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showAlert("Por favor, completa todos los campos", "error")
      return
    }

    const result = await window.auth.changePassword(currentPassword, newPassword, confirmPassword)

    if (result.success) {
      this.showAlert("Contraseña actualizada correctamente", "success")
      this.closeModal()
    } else {
      this.showAlert(result.error, "error")
    }
  }

  // Utility Functions
  formatDate(date) {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Export data functionality
  async exportUserData() {
    try {
      const data = await window.db.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `task-management-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.showAlert("Datos exportados correctamente", "success")
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
      this.showAlert("Error al exportar datos", "error")
    }
  }

  // Load users for assignment
  async loadUsersForAssignment() {
    try {
      const users = await window.db.getAllUsers()
      const assigneeSelect = document.getElementById("taskAssignee")
      const currentUser = window.auth.getCurrentUser()

      if (assigneeSelect && users) {
        // Clear existing options except self
        assigneeSelect.innerHTML = `<option value="${currentUser.matricula}">Yo mismo</option>`

        // Add other users based on role
        users.forEach((user) => {
          if (user.matricula !== currentUser.matricula && user.activo) {
            // Admins can assign to anyone, teachers can assign to students
            if (
              currentUser.tipoUsuario === "administrador" ||
              (currentUser.tipoUsuario === "maestro" && user.tipoUsuario === "estudiante")
            ) {
              const option = document.createElement("option")
              option.value = user.matricula
              option.textContent = `${user.nombre} ${user.apellidos} (${user.tipoUsuario})`
              assigneeSelect.appendChild(option)
            }
          }
        })
      }
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    }
  }

  // Handle task creation
  async handleCreateTask() {
    const title = document.getElementById("taskTitle").value
    const description = document.getElementById("taskDescription").value
    const priority = document.getElementById("taskPriority").value
    const dueDate = document.getElementById("taskDueDate").value
    const assigneeSelect = document.getElementById("taskAssignee")
    const assignee = assigneeSelect ? assigneeSelect.value : window.auth.getCurrentUser().matricula

    const hasHours = document.getElementById("taskHasHours").checked
    const hoursAssigned = hasHours ? Number.parseInt(document.getElementById("taskHours").value) || 0 : 0

    if (!title || !dueDate) {
      this.showAlert("Por favor, completa todos los campos obligatorios", "error")
      return
    }

    if (hasHours && (!hoursAssigned || hoursAssigned <= 0)) {
      this.showAlert("Por favor, especifica las horas a asignar", "error")
      return
    }

    const taskData = {
      title,
      description,
      priority,
      dueDate: new Date(dueDate),
      userId: assignee,
      status: "pending",
      hasHours,
      hoursAssigned,
    }

    const result = await this.createTask(taskData)

    if (result.success) {
      this.closeModal()
      // Refresh the main panel if currently viewing
      if (window.dashboardManager && window.dashboardManager.activeTab === "main") {
        await window.dashboardManager.loadMainPanel()
      }
    }
  }
}

// Enhanced Dashboard Manager with Task Management
window.dashboardManager.createNewTask = () => {
  window.app.showCreateTaskModal()
}

window.dashboardManager.editTask = (taskId) => {
  window.app.showEditTaskModal(taskId)
}

window.dashboardManager.deleteTask = (taskId) => {
  window.app.deleteTask(taskId)
}

window.dashboardManager.markTaskComplete = async function (taskId) {
  const result = await window.app.updateTask(taskId, { status: "completed" })
  if (result.success && this.activeTab === "main") {
    await this.loadMainPanel()
  }
}

window.dashboardManager.showEditProfile = () => {
  window.app.showEditProfileModal()
}

window.dashboardManager.showChangePassword = () => {
  window.app.showChangePasswordModal()
}

// Initialize the application
window.app = new TaskManagementApp()

// Add alert styles to CSS
const alertStyles = `
<style>
.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.alert-success {
  background: #059669;
}

.alert-error {
  background: #dc2626;
}

.alert-info {
  background: #2563eb;
}

.alert-warning {
  background: #d97706;
}

.alert-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 12px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.task-form,
.profile-form,
.password-form {
  display: grid;
  gap: 16px;
}

.task-form .form-group,
.profile-form .form-group,
.password-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-form label,
.profile-form label,
.password-form label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.task-form input,
.task-form select,
.task-form textarea,
.profile-form input,
.password-form input {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.task-form input:focus,
.task-form select:focus,
.task-form textarea:focus,
.profile-form input:focus,
.password-form input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.task-form textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.task-form small {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}
</style>
`

document.head.insertAdjacentHTML("beforeend", alertStyles)
