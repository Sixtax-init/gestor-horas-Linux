// Local Database System using localStorage and IndexedDB
class LocalDatabase {
  constructor() {
    this.dbName = "TaskManagementDB"
    this.version = 1
    this.db = null
    this.isInitialized = false // Add initialization flag
    this.initPromise = this.initializeDB() // Store initialization promise
  }

  // Initialize IndexedDB for complex data
  async initializeDB() {
    if (this.isInitialized) return this.db // Return if already initialized

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true // Set initialization flag
        resolve(this.db)
        setTimeout(() => this.seedInitialData(), 100)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Users store
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "matricula" })
          userStore.createIndex("email", "email", { unique: true })
          userStore.createIndex("tipoUsuario", "tipoUsuario", { unique: false })
        }

        // Tasks store
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true })
          taskStore.createIndex("userId", "userId", { unique: false })
          taskStore.createIndex("status", "status", { unique: false })
          taskStore.createIndex("priority", "priority", { unique: false })
          taskStore.createIndex("groupId", "groupId", { unique: false }) // Added index for groupId
        }

        // Projects store
        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", { keyPath: "id", autoIncrement: true })
          projectStore.createIndex("createdBy", "createdBy", { unique: false })
          projectStore.createIndex("status", "status", { unique: false })
        }

        // Notifications store
        if (!db.objectStoreNames.contains("notifications")) {
          const notificationStore = db.createObjectStore("notifications", { keyPath: "id", autoIncrement: true })
          notificationStore.createIndex("userId", "userId", { unique: false })
          notificationStore.createIndex("read", "read", { unique: false })
        }

        // Chat messages store
        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", { keyPath: "id", autoIncrement: true })
          messageStore.createIndex("userId", "userId", { unique: false })
          messageStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Groups store
        if (!db.objectStoreNames.contains("groups")) {
          const groupStore = db.createObjectStore("groups", { keyPath: "id", autoIncrement: true })
          groupStore.createIndex("maestroResponsable", "maestroResponsable", { unique: false })
          groupStore.createIndex("tipoGrupo", "tipoGrupo", { unique: false })
          groupStore.createIndex("activo", "activo", { unique: false })
        }

        // Group assignments store
        if (!db.objectStoreNames.contains("groupAssignments")) {
          const assignmentStore = db.createObjectStore("groupAssignments", { keyPath: "id", autoIncrement: true })
          assignmentStore.createIndex("groupId", "groupId", { unique: false })
          assignmentStore.createIndex("userId", "userId", { unique: false })
          assignmentStore.createIndex("assignedBy", "assignedBy", { unique: false })
        }
      }
    })
  }

  async ensureDBReady() {
    if (!this.isInitialized) {
      await this.initPromise
    }
    return this.db
  }

  // Seed initial data
  async seedInitialData() {
    await this.ensureDBReady()

    if (!this.db) {
      console.log("[v0] Database not ready for seeding")
      return
    }

    // Check if users already exist
    try {
      const existingUsers = await this.getAllUsers()
      if (existingUsers.length > 0) return
    } catch (error) {
      console.log("[v0] Error checking existing users, proceeding with seeding")
    }

    // Create initial users
    const initialUsers = [
      {
        matricula: "admin123",
        nombre: "Administrador",
        apellidos: "del Sistema",
        email: "admin@sistema.com",
        tipoUsuario: "administrador",
        password: "admin123",
        fechaRegistro: new Date(),
        activo: true,
        horasAcumuladas: 0,
        horasRequeridas: 480, // Required hours for service social
        horasCompletadas: 0,
      },
      {
        matricula: "maestro001",
        nombre: "Juan Carlos",
        apellidos: "García López",
        email: "jgarcia@escuela.edu",
        tipoUsuario: "maestro",
        password: "maestro123",
        fechaRegistro: new Date(),
        activo: true,
        horasAcumuladas: 0,
        horasRequeridas: 480,
        horasCompletadas: 0,
      },
      {
        matricula: "est001",
        nombre: "María Elena",
        apellidos: "Rodríguez Martínez",
        email: "mrodriguez@estudiante.edu",
        tipoUsuario: "estudiante",
        password: "est123",
        fechaRegistro: new Date(),
        activo: true,
        horasAcumuladas: 45,
        horasRequeridas: 480,
        horasCompletadas: 45,
      },
    ]

    // Add users to database
    for (const user of initialUsers) {
      await this.addUser(user)
    }

    // Create initial tasks
    const initialTasks = [
      {
        title: "Completar proyecto de matemáticas",
        description: "Resolver los ejercicios del capítulo 5",
        userId: "est001",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        hasHours: true,
        hoursAssigned: 8,
        hoursCompleted: 0,
        groupId: 1, // Added groupId for task
      },
      {
        title: "Revisar tareas de estudiantes",
        description: "Calificar las tareas entregadas esta semana",
        userId: "maestro001",
        status: "in-progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        hasHours: false,
        hoursAssigned: 0,
        hoursCompleted: 0,
        groupId: 2, // Added groupId for task
      },
    ]

    for (const task of initialTasks) {
      await this.addTask(task)
    }

    // Create initial notifications
    const initialNotifications = [
      {
        userId: "est001",
        title: "Nueva tarea asignada",
        message: "Se te ha asignado una nueva tarea de matemáticas",
        type: "task",
        read: false,
        createdAt: new Date(),
      },
      {
        userId: "maestro001",
        title: "Recordatorio",
        message: "Tienes tareas pendientes por revisar",
        type: "reminder",
        read: false,
        createdAt: new Date(),
      },
    ]

    for (const notification of initialNotifications) {
      await this.addNotification(notification)
    }

    console.log("[v0] Database seeded with initial data")
  }

  // User operations
  async addUser(user) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.add(user)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUser(matricula) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.get(matricula)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllUsers() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["users"], "readonly")
      const store = transaction.objectStore("users")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateUser(matricula, userData) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.put({ ...userData, matricula })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Task operations
  async addTask(task) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readwrite")
      const store = transaction.objectStore("tasks")
      const request = store.add(task)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTask(taskId) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readonly")
      const store = transaction.objectStore("tasks")
      const request = store.get(taskId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTasksByUser(userId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readonly")
      const store = transaction.objectStore("tasks")
      const index = store.index("userId")
      const request = index.getAll(userId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTasksByGroup(groupId) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readonly")
      const store = transaction.objectStore("tasks")
      const request = store.getAll()

      request.onsuccess = () => {
        const allTasks = request.result
        const groupTasks = allTasks.filter((task) => task.groupId === groupId)
        resolve(groupTasks)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllTasksForStudent(userId) {
    await this.ensureDBReady()
    try {
      // Get tasks assigned directly to the student
      const directTasks = await this.getTasksByUser(userId)

      // Get all groups the student belongs to
      const studentGroups = await this.getUserGroups(userId)

      // Get tasks from all groups
      const groupTasks = []
      for (const group of studentGroups) {
        const tasks = await this.getTasksByGroup(group.id)
        groupTasks.push(...tasks)
      }

      // Combine and deduplicate tasks
      const allTasks = [...directTasks, ...groupTasks]
      const uniqueTasks = Array.from(new Map(allTasks.map((task) => [task.id, task])).values())

      return uniqueTasks
    } catch (error) {
      console.error("[v0] Error getting all tasks for student:", error)
      return []
    }
  }

  async getAllTasks() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readonly")
      const store = transaction.objectStore("tasks")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateTask(taskId, taskData) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readwrite")
      const store = transaction.objectStore("tasks")
      const request = store.put({ ...taskData, id: taskId })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTask(taskId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readwrite")
      const store = transaction.objectStore("tasks")
      const request = store.delete(taskId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async addTaskAttachment(taskId, attachment) {
    await this.ensureDBReady()
    try {
      const task = await this.getTask(taskId)
      if (!task) {
        throw new Error("Tarea no encontrada")
      }

      const attachments = task.attachments || []
      attachments.push({
        ...attachment,
        uploadedAt: new Date(),
        id: Date.now(),
      })

      await this.updateTask(taskId, { ...task, attachments })
      return { success: true, attachments }
    } catch (error) {
      console.error("[v0] Error adding attachment:", error)
      return { success: false, error: error.message }
    }
  }

  async removeTaskAttachment(taskId, attachmentId) {
    await this.ensureDBReady()
    try {
      const task = await this.getTask(taskId)
      if (!task) {
        throw new Error("Tarea no encontrada")
      }

      const attachments = (task.attachments || []).filter((att) => att.id !== attachmentId)
      await this.updateTask(taskId, { ...task, attachments })
      return { success: true, attachments }
    } catch (error) {
      console.error("[v0] Error removing attachment:", error)
      return { success: false, error: error.message }
    }
  }

  // Project operations
  async addProject(project) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["projects"], "readwrite")
      const store = transaction.objectStore("projects")
      const request = store.add(project)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["projects"], "readonly")
      const store = transaction.objectStore("projects")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Notification operations
  async addNotification(notification) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")
      const request = store.add(notification)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getNotificationsByUser(userId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["notifications"], "readonly")
      const store = transaction.objectStore("notifications")
      const index = store.index("userId")
      const request = index.getAll(userId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markNotificationAsRead(notificationId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["notifications"], "readwrite")
      const store = transaction.objectStore("notifications")
      const getRequest = store.get(notificationId)

      getRequest.onsuccess = () => {
        const notification = getRequest.result
        if (notification) {
          notification.read = true
          const putRequest = store.put(notification)
          putRequest.onsuccess = () => resolve(putRequest.result)
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error("Notification not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Message operations
  async addMessage(message) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["messages"], "readwrite")
      const store = transaction.objectStore("messages")
      const request = store.add(message)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllMessages() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["messages"], "readonly")
      const store = transaction.objectStore("messages")
      const request = store.getAll()

      request.onsuccess = () => {
        // Sort by timestamp
        const messages = request.result.sort((a, b) => a.timestamp - b.timestamp)
        resolve(messages)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Session management using localStorage with expiration
  setCurrentUser(user) {
    const sessionData = {
      user: user,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiration
    }
    localStorage.setItem("currentUser", JSON.stringify(sessionData))
    localStorage.setItem("sessionActive", "true") // Add session flag
  }

  getCurrentUser() {
    try {
      const sessionData = localStorage.getItem("currentUser")
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)

      if (parsed.expires && Date.now() > parsed.expires) {
        this.clearCurrentUser()
        return null
      }

      return parsed.user || parsed
    } catch (error) {
      console.error("[v0] Error parsing session data:", error)
      this.clearCurrentUser()
      return null
    }
  }

  clearCurrentUser() {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionActive") // Clear session flag
  }

  isSessionActive() {
    return localStorage.getItem("sessionActive") === "true" && this.getCurrentUser() !== null
  }

  // Settings management
  setSetting(key, value) {
    localStorage.setItem(`setting_${key}`, JSON.stringify(value))
  }

  getSetting(key, defaultValue = null) {
    const setting = localStorage.getItem(`setting_${key}`)
    return setting ? JSON.parse(setting) : defaultValue
  }

  // Statistics and analytics
  async getStatistics(userType, userId = null) {
    const stats = {}

    switch (userType) {
      case "administrador":
        const allUsers = await this.getAllUsers()
        const allTasks = await this.getAllTasks()
        const allProjects = await this.getAllProjects()
        const allGroups = await this.getAllGroups()

        stats.activeUsers = allUsers.filter((u) => u.activo).length
        stats.totalProjects = allProjects.length
        stats.totalTasks = allTasks.length
        stats.totalGroups = allGroups.length
        stats.activeGroups = allGroups.filter((g) => g.activo).length
        stats.serviceGroups = allGroups.filter((g) => g.tipoGrupo === "servicio_social").length
        stats.courseGroups = allGroups.filter((g) => g.tipoGrupo === "taller_curso").length
        break

      case "maestro":
        const teacherTasks = await this.getTasksByUser(userId)
        const teacherProjects = await this.getAllProjects()
        const students = await this.getAllUsers()
        const teacherGroups = await this.getGroupsByTeacher(userId)

        stats.createdProjects = teacherProjects.filter((p) => p.createdBy === userId).length
        stats.assignedTasks = teacherTasks.length
        stats.students = students.filter((u) => u.tipoUsuario === "estudiante").length
        stats.myGroups = teacherGroups.length
        stats.activeGroups = teacherGroups.filter((g) => g.activo).length
        break

      case "estudiante":
        const studentTasks = await this.getTasksByUser(userId)
        const activeProjects = await this.getAllProjects()
        const studentGroups = await this.getUserGroups(userId)

        stats.activeProjects = activeProjects.length
        stats.pendingTasks = studentTasks.filter((t) => t.status === "pending").length
        stats.completedTasks = studentTasks.filter((t) => t.status === "completed").length
        stats.myGroups = studentGroups.length
        stats.serviceGroups = studentGroups.filter((g) => g.tipoGrupo === "servicio_social").length
        break
    }

    return stats
  }

  // Data export/import for backup
  async exportData() {
    await this.ensureDBReady() // Wait for DB to be ready
    const data = {
      users: await this.getAllUsers(),
      tasks: await this.getAllTasks(),
      projects: await this.getAllProjects(),
      notifications: await this.getAllNotifications(),
      messages: await this.getAllMessages(),
      groups: await this.getAllGroups(),
      groupAssignments: await this.getAllGroupAssignments(),
      exportDate: new Date(),
    }

    return JSON.stringify(data, null, 2)
  }

  async getAllNotifications() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["notifications"], "readonly")
      const store = transaction.objectStore("notifications")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all data (for testing)
  async clearAllData() {
    await this.ensureDBReady() // Wait for DB to be ready
    const stores = ["users", "tasks", "projects", "notifications", "messages", "groups", "groupAssignments"]

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"))
          return
        }
        const transaction = this.db.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    localStorage.clear()
    console.log("[v0] All data cleared")
  }

  async updateUserHours(userId, hoursToAdd) {
    await this.ensureDBReady() // Wait for DB to be ready
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      const updatedHours = user.horasCompletadas + hoursToAdd
      const updatedUser = {
        ...user,
        horasCompletadas: updatedHours,
        horasAcumuladas: updatedHours, // Keep both for compatibility
      }

      await this.updateUser(userId, updatedUser)
      return { success: true, newTotal: updatedHours }
    } catch (error) {
      console.error("[v0] Error updating user hours:", error)
      return { success: false, error: error.message }
    }
  }

  async getUserHoursStats(userId) {
    await this.ensureDBReady() // Wait for DB to be ready
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      const tasks = await this.getTasksByUser(userId)
      const completedTasksWithHours = tasks.filter((task) => task.status === "completed" && task.hasHours)

      const totalHoursFromTasks = completedTasksWithHours.reduce((sum, task) => sum + (task.hoursAssigned || 0), 0)

      return {
        horasCompletadas: user.horasCompletadas || 0,
        horasRequeridas: user.horasRequeridas || 480,
        porcentajeCompletado: Math.round(((user.horasCompletadas || 0) / (user.horasRequeridas || 480)) * 100),
        tareasConHoras: completedTasksWithHours.length,
        horasDestareas: totalHoursFromTasks,
      }
    } catch (error) {
      console.error("[v0] Error getting hours stats:", error)
      return {
        horasCompletadas: 0,
        horasRequeridas: 480,
        porcentajeCompletado: 0,
        tareasConHoras: 0,
        horasDestareas: 0,
      }
    }
  }

  // Group operations
  async addGroup(group) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readwrite")
      const store = transaction.objectStore("groups")
      const request = store.add({
        ...group,
        fechaCreacion: new Date(),
        activo: true,
        alumnosAsignados: group.alumnosAsignados || [],
      })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllGroups() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readonly")
      const store = transaction.objectStore("groups")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getGroupById(groupId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readonly")
      const store = transaction.objectStore("groups")
      const request = store.get(groupId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getGroupsByTeacher(teacherId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readonly")
      const store = transaction.objectStore("groups")
      const index = store.index("maestroResponsable")
      const request = index.getAll(teacherId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateGroup(groupId, groupData) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readwrite")
      const store = transaction.objectStore("groups")
      const request = store.put({ ...groupData, id: groupId })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteGroup(groupId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groups"], "readwrite")
      const store = transaction.objectStore("groups")
      const request = store.delete(groupId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Group assignment operations
  async assignUserToGroup(groupId, userId, assignedBy) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readwrite")
      const store = transaction.objectStore("groupAssignments")

      // Check if assignment already exists
      const index = store.index("userId")
      const checkRequest = index.getAll(userId)

      checkRequest.onsuccess = () => {
        const existingAssignments = checkRequest.result
        const existingGroupAssignment = existingAssignments.find((a) => a.groupId === groupId)

        if (existingGroupAssignment) {
          reject(new Error("El usuario ya está asignado a este grupo"))
          return
        }

        const assignment = {
          groupId: groupId,
          userId: userId,
          assignedBy: assignedBy,
          assignedAt: new Date(),
        }

        const addRequest = store.add(assignment)
        addRequest.onsuccess = () => {
          // Update group with new student
          this.getGroupById(groupId)
            .then((group) => {
              if (group) {
                const updatedAlumnos = [...(group.alumnosAsignados || []), userId]
                this.updateGroup(groupId, { ...group, alumnosAsignados: updatedAlumnos })
                  .then(() => resolve(addRequest.result))
                  .catch(reject)
              } else {
                resolve(addRequest.result)
              }
            })
            .catch(reject)
        }
        addRequest.onerror = () => reject(addRequest.error)
      }
      checkRequest.onerror = () => reject(checkRequest.error)
    })
  }

  async removeUserFromGroup(groupId, userId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readwrite")
      const store = transaction.objectStore("groupAssignments")

      // Find and delete the assignment
      const index = store.index("userId")
      const getRequest = index.getAll(userId)

      getRequest.onsuccess = () => {
        const assignments = getRequest.result
        const assignmentToDelete = assignments.find((a) => a.groupId === groupId)

        if (!assignmentToDelete) {
          reject(new Error("Asignación no encontrada"))
          return
        }

        const deleteRequest = store.delete(assignmentToDelete.id)
        deleteRequest.onsuccess = () => {
          // Update group by removing student
          this.getGroupById(groupId)
            .then((group) => {
              if (group) {
                const updatedAlumnos = (group.alumnosAsignados || []).filter((id) => id !== userId)
                this.updateGroup(groupId, { ...group, alumnosAsignados: updatedAlumnos })
                  .then(() => resolve(deleteRequest.result))
                  .catch(reject)
              } else {
                resolve(deleteRequest.result)
              }
            })
            .catch(reject)
        }
        deleteRequest.onerror = () => reject(deleteRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getGroupAssignments(groupId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readonly")
      const store = transaction.objectStore("groupAssignments")
      const index = store.index("groupId")
      const request = index.getAll(groupId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUserGroups(userId) {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readonly")
      const store = transaction.objectStore("groupAssignments")
      const index = store.index("userId")
      const request = index.getAll(userId)

      request.onsuccess = async () => {
        const assignments = request.result
        const groups = []

        for (const assignment of assignments) {
          try {
            const group = await this.getGroupById(assignment.groupId)
            if (group) {
              groups.push({ ...group, assignmentId: assignment.id })
            }
          } catch (error) {
            console.error("[v0] Error loading group:", error)
          }
        }

        resolve(groups)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Enhanced export with groups
  async getAllGroupAssignments() {
    await this.ensureDBReady() // Wait for DB to be ready
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readonly")
      const store = transaction.objectStore("groupAssignments")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTaskSubmissionStats(taskId) {
    await this.ensureDBReady()
    try {
      const task = await this.getTask(taskId)
      if (!task) {
        throw new Error("Tarea no encontrada")
      }

      let students = []

      // If task is assigned to a group, get all students in that group
      if (task.groupId) {
        const group = await this.getGroupById(task.groupId)
        if (group && group.alumnosAsignados) {
          students = await Promise.all(
            group.alumnosAsignados.map(async (userId) => {
              const user = await this.getUser(userId)
              return user
            }),
          )
          students = students.filter((u) => u !== undefined)
        }
      } else if (task.userId) {
        // If task is assigned to individual student
        const user = await this.getUser(task.userId)
        if (user) students = [user]
      }

      // Get submission status for each student
      const submissions = students.map((student) => {
        const studentAttachments = (task.attachments || []).filter((att) => att.uploadedBy === student.matricula)

        return {
          studentId: student.matricula,
          studentName: `${student.nombre} ${student.apellidos}`,
          studentEmail: student.email,
          hasSubmitted: studentAttachments.length > 0,
          attachments: studentAttachments,
          submissionDate: studentAttachments.length > 0 ? studentAttachments[0].uploadedAt : null,
        }
      })

      const totalStudents = students.length
      const submittedCount = submissions.filter((s) => s.hasSubmitted).length
      const pendingCount = totalStudents - submittedCount

      return {
        task,
        totalStudents,
        submittedCount,
        pendingCount,
        submissionPercentage: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
        submissions,
        allowsAttachments: task.allowAttachments || false,
      }
    } catch (error) {
      console.error("[v0] Error getting task submission stats:", error)
      return {
        task: null,
        totalStudents: 0,
        submittedCount: 0,
        pendingCount: 0,
        submissionPercentage: 0,
        submissions: [],
        allowsAttachments: false,
      }
    }
  }
}

// Initialize global database instance
window.db = new LocalDatabase()
