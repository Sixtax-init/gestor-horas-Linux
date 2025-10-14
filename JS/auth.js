// Authentication System
class AuthSystem {
  constructor() {
    this.currentUser = null
    this.loginAttempts = new Map() // Track login attempts for security
    this.maxAttempts = 5
    this.lockoutTime = 15 * 60 * 1000 // 15 minutes
    this.initializationPromise = this.initializeAuth() // Store initialization promise
  }

  // Initialize authentication system
  async initializeAuth() {
    try {
      await window.db.ensureDBReady()

      // Check if user session is active
      if (window.db.isSessionActive()) {
        const savedUser = window.db.getCurrentUser()
        if (savedUser) {
          // Verify user still exists in database
          const dbUser = await window.db.getUser(savedUser.matricula)
          if (dbUser && dbUser.activo) {
            this.currentUser = dbUser
            window.db.setCurrentUser(dbUser)
            this.showDashboard()
            return
          } else {
            // User no longer exists or is inactive, clear session
            this.logout()
            return
          }
        }
      }

      this.showLogin()
    } catch (error) {
      console.error("[v0] Auth initialization error:", error)
      this.showLogin()
    }
  }

  // Login function
  async login(matricula, password, userType) {
    try {
      await this.ensureAuthReady()

      // Check if account is locked
      if (this.isAccountLocked(matricula)) {
        const lockoutEnd = this.loginAttempts.get(matricula).lockoutEnd
        const remainingTime = Math.ceil((lockoutEnd - Date.now()) / 60000)
        throw new Error(`Cuenta bloqueada. Intenta de nuevo en ${remainingTime} minutos.`)
      }

      // Validate input
      if (!matricula || !password || !userType) {
        throw new Error("Todos los campos son obligatorios")
      }

      // Get user from database
      const user = await window.db.getUser(matricula)

      if (!user) {
        this.recordFailedAttempt(matricula)
        throw new Error("Usuario no encontrado")
      }

      // Check if user is active
      if (!user.activo) {
        throw new Error("Cuenta desactivada. Contacta al administrador.")
      }

      // Verify password and user type
      if (user.password !== password || user.tipoUsuario !== userType) {
        this.recordFailedAttempt(matricula)
        throw new Error("Credenciales incorrectas")
      }

      // Successful login
      this.clearFailedAttempts(matricula)
      this.currentUser = user
      window.db.setCurrentUser(user)

      // Log login activity
      await this.logActivity("login", user.matricula)

      // Show dashboard
      this.showDashboard()

      return { success: true, user }
    } catch (error) {
      console.error("[v0] Login error:", error.message)
      return { success: false, error: error.message }
    }
  }

  // Logout function
  async logout() {
    if (this.currentUser) {
      // Log logout activity
      await this.logActivity("logout", this.currentUser.matricula)
    }

    this.currentUser = null
    window.db.clearCurrentUser()
    this.showLogin()
  }

  // Check if account is locked due to failed attempts
  isAccountLocked(matricula) {
    const attempts = this.loginAttempts.get(matricula)
    if (!attempts) return false

    return attempts.count >= this.maxAttempts && Date.now() < attempts.lockoutEnd
  }

  // Record failed login attempt
  recordFailedAttempt(matricula) {
    const attempts = this.loginAttempts.get(matricula) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()

    if (attempts.count >= this.maxAttempts) {
      attempts.lockoutEnd = Date.now() + this.lockoutTime
    }

    this.loginAttempts.set(matricula, attempts)
  }

  // Clear failed attempts after successful login
  clearFailedAttempts(matricula) {
    this.loginAttempts.delete(matricula)
  }

  // Log user activity
  async logActivity(action, userId) {
    const activity = {
      userId,
      action,
      timestamp: new Date(),
      ip: "localhost", // In a real app, you'd get the actual IP
      userAgent: navigator.userAgent,
    }

    // Store in localStorage for now (in a real app, you'd send to server)
    const activities = JSON.parse(localStorage.getItem("userActivities") || "[]")
    activities.push(activity)

    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100)
    }

    localStorage.setItem("userActivities", JSON.stringify(activities))
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Check if user has permission for specific action
  hasPermission(action) {
    if (!this.currentUser) return false

    const permissions = {
      administrador: [
        "view_all_users",
        "create_user",
        "edit_user",
        "delete_user",
        "view_all_tasks",
        "create_task",
        "edit_task",
        "delete_task",
        "view_all_projects",
        "create_project",
        "edit_project",
        "delete_project",
        "view_system_stats",
        "manage_system",
      ],
      maestro: [
        "view_students",
        "create_task",
        "edit_own_task",
        "view_assigned_tasks",
        "create_project",
        "edit_own_project",
        "view_own_projects",
        "grade_tasks",
      ],
      estudiante: ["view_own_tasks", "edit_own_task", "view_assigned_projects", "submit_task"],
    }

    const userPermissions = permissions[this.currentUser.tipoUsuario] || []
    return userPermissions.includes(action)
  }

  // Show login screen
  showLogin() {
    document.getElementById("loginScreen").classList.add("active")
    document.getElementById("dashboardScreen").classList.remove("active")
  }

  // Show dashboard screen
  showDashboard() {
    document.getElementById("loginScreen").classList.remove("active")
    document.getElementById("dashboardScreen").classList.add("active")

    // Initialize dashboard with current user
    if (window.dashboardManager) {
      window.dashboardManager.initialize(this.currentUser)
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      await this.ensureAuthReady()

      if (!this.currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      if (this.currentUser.password !== currentPassword) {
        throw new Error("Contraseña actual incorrecta")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }

      if (newPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      // Update password in database
      const updatedUser = { ...this.currentUser, password: newPassword }
      await window.db.updateUser(this.currentUser.matricula, updatedUser)

      // Update current user
      this.currentUser = updatedUser
      window.db.setCurrentUser(updatedUser)

      // Log activity
      await this.logActivity("password_change", this.currentUser.matricula)

      return { success: true, message: "Contraseña actualizada correctamente" }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      await this.ensureAuthReady()

      if (!this.currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (profileData.email && !emailRegex.test(profileData.email)) {
        throw new Error("Formato de email inválido")
      }

      // Update user data
      const updatedUser = { ...this.currentUser, ...profileData }
      await window.db.updateUser(this.currentUser.matricula, updatedUser)

      // Update current user
      this.currentUser = updatedUser
      window.db.setCurrentUser(updatedUser)

      // Log activity
      await this.logActivity("profile_update", this.currentUser.matricula)

      return { success: true, message: "Perfil actualizado correctamente" }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get user activities
  getUserActivities(userId = null) {
    const activities = JSON.parse(localStorage.getItem("userActivities") || "[]")

    if (userId) {
      return activities.filter((activity) => activity.userId === userId)
    }

    // For admins, return all activities
    if (this.hasPermission("view_system_stats")) {
      return activities
    }

    // For regular users, return only their activities
    return activities.filter((activity) => activity.userId === this.currentUser?.matricula)
  }

  // Session management
  extendSession() {
    if (this.currentUser) {
      window.db.setCurrentUser(this.currentUser)
    }
  }

  // Check session validity
  isSessionValid() {
    const savedUser = window.db.getCurrentUser()
    return savedUser && this.currentUser && savedUser.matricula === this.currentUser.matricula
  }

  // Auto-logout after inactivity
  setupAutoLogout(timeoutMinutes = 30) {
    let timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(
        () => {
          if (this.currentUser) {
            alert("Sesión expirada por inactividad")
            this.logout()
          }
        },
        timeoutMinutes * 60 * 1000,
      )
    }

    // Reset timeout on user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach((event) => {
      document.addEventListener(event, resetTimeout, true)
    })

    // Initial timeout
    resetTimeout()
  }

  // Password strength checker
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const score = Object.values(checks).filter(Boolean).length
    const strength = score < 2 ? "weak" : score < 4 ? "medium" : "strong"

    return { checks, score, strength }
  }

  async ensureAuthReady() {
    await this.initializationPromise
  }
}

// Initialize global auth system
window.auth = new AuthSystem()
