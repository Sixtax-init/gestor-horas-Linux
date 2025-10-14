// Local Database System using localStorage and IndexedDB
class LocalDatabase {
  constructor() {
    this.dbName = "TaskManagementDB"
    this.version = 3 // Incrementar versión para nuevas funcionalidades
    this.db = null
    this.isInitialized = false
    this.initPromise = this.initializeDB()
  }

  // Initialize IndexedDB for complex data
  async initializeDB() {
    if (this.isInitialized) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
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

        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true })
          taskStore.createIndex("userId", "userId", { unique: false })
          taskStore.createIndex("status", "status", { unique: false })
          taskStore.createIndex("priority", "priority", { unique: false })
          taskStore.createIndex("groupId", "groupId", { unique: false })
          taskStore.createIndex("createdBy", "createdBy", { unique: false })
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

        if (!db.objectStoreNames.contains("taskEnrollments")) {
          const enrollmentStore = db.createObjectStore("taskEnrollments", { keyPath: "id", autoIncrement: true })
          enrollmentStore.createIndex("taskId", "taskId", { unique: false })
          enrollmentStore.createIndex("userId", "userId", { unique: false })
          enrollmentStore.createIndex("status", "status", { unique: false })
        }

        // Task files store
        if (!db.objectStoreNames.contains("taskFiles")) {
          const taskFilesStore = db.createObjectStore("taskFiles", { keyPath: "id", autoIncrement: true })
          taskFilesStore.createIndex("taskId", "taskId", { unique: false })
          taskFilesStore.createIndex("uploadedBy", "uploadedBy", { unique: false })
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
      if (existingUsers.length > 0) {
        // Check if test user exists, if not add it
        const testUserExists = existingUsers.some(user => user.matricula === "test001")
        if (!testUserExists) {
          const testUser = {
            matricula: "test001",
            nombre: "Usuario",
            apellidos: "Prueba",
            email: "test@prueba.com",
            tipoUsuario: "estudiante",
            password: "test123",
            fechaRegistro: new Date(),
            activo: true,
            horasAcumuladas: 0,
            horasRequeridas: 480,
            horasCompletadas: 0,
          }
          await this.addUser(testUser)
          console.log("[v0] Test user added to existing database")
        }
        return
      }
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
        horasRequeridas: 480,
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
      {
        matricula: "test001",
        nombre: "Usuario",
        apellidos: "Prueba",
        email: "test@prueba.com",
        tipoUsuario: "estudiante",
        password: "test123",
        fechaRegistro: new Date(),
        activo: true,
        horasAcumuladas: 0,
        horasRequeridas: 480,
        horasCompletadas: 0,
      },
    ]

    // Add users to database
    for (const user of initialUsers) {
      await this.addUser(user)
    }

    const initialGroups = [
      {
        nombre: "Servicio Social - Comunidad",
        descripcion: "Actividades de servicio social en la comunidad local",
        tipoGrupo: "servicio_social",
        maestroResponsable: "maestro001",
        fechaCreacion: new Date(),
        activo: true,
        alumnosAsignados: ["est001"],
      },
      {
        nombre: "Taller de Programación Web",
        descripcion: "Curso práctico de desarrollo web moderno",
        tipoGrupo: "taller_curso",
        maestroResponsable: "maestro001",
        fechaCreacion: new Date(),
        activo: true,
        alumnosAsignados: [],
      },
    ]

    for (const group of initialGroups) {
      await this.addGroup(group)
    }

    console.log("[v0] Database seeded with initial data")
  }

  async addTask(task) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["tasks"], "readwrite")
      const store = transaction.objectStore("tasks")

      // Agregar campos por defecto para nuevas funcionalidades
      const enhancedTask = {
        ...task,
        maxStudents: task.maxStudents || null, // Límite máximo de estudiantes
        currentEnrollments: task.currentEnrollments || 0, // Inscripciones actuales
        hoursAssigned: task.hoursAssigned || 0, // Horas que otorga la tarea
        isAvailable: task.isAvailable !== false, // Disponible por defecto
        groupId: task.groupId || null, // ID del grupo al que pertenece
        createdBy: task.createdBy || task.userId, // Quién creó la tarea
        createdAt: task.createdAt || new Date(),
        updatedAt: new Date(),
      }

      const request = store.add(enhancedTask)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAvailableTasksForStudent(studentId) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        // Obtener grupos del estudiante
        const studentGroups = await this.getUserGroups(studentId)
        const groupIds = studentGroups.map((g) => g.id)

        // Obtener todas las tareas
        const allTasks = await this.getAllTasks()

        // Filtrar tareas disponibles
        const availableTasks = allTasks.filter((task) => {
          // Solo tareas de grupos del estudiante
          if (task.groupId && !groupIds.includes(task.groupId)) return false

          // Solo tareas disponibles
          if (!task.isAvailable) return false

          // Solo tareas que no estén llenas (si tienen límite)
          if (task.maxStudents && task.currentEnrollments >= task.maxStudents) return false

          // No mostrar tareas ya inscritas
          return true
        })

        resolve(availableTasks)
      } catch (error) {
        reject(error)
      }
    })
  }

  async enrollStudentInTask(taskId, studentId) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        // Verificar si ya está inscrito
        const existingEnrollments = await this.getTaskEnrollments(taskId)
        const alreadyEnrolled = existingEnrollments.some((e) => e.userId === studentId)

        if (alreadyEnrolled) {
          reject(new Error("El estudiante ya está inscrito en esta tarea"))
          return
        }

        // Obtener la tarea
        const task = await this.getTaskById(taskId)
        if (!task) {
          reject(new Error("Tarea no encontrada"))
          return
        }

        // Verificar cupo disponible
        if (task.maxStudents && task.currentEnrollments >= task.maxStudents) {
          reject(new Error("La tarea ha alcanzado su cupo máximo"))
          return
        }

        // Crear inscripción
        const enrollment = {
          taskId: taskId,
          userId: studentId,
          enrolledAt: new Date(),
          status: "enrolled",
        }

        const transaction = this.db.transaction(["taskEnrollments", "tasks"], "readwrite")
        const enrollmentStore = transaction.objectStore("taskEnrollments")
        const taskStore = transaction.objectStore("tasks")

        // Agregar inscripción
        const enrollmentRequest = enrollmentStore.add(enrollment)

        enrollmentRequest.onsuccess = () => {
          // Actualizar contador de inscripciones en la tarea
          const updatedTask = {
            ...task,
            currentEnrollments: (task.currentEnrollments || 0) + 1,
            updatedAt: new Date(),
          }

          // Si alcanza el máximo, marcar como no disponible
          if (task.maxStudents && updatedTask.currentEnrollments >= task.maxStudents) {
            updatedTask.isAvailable = false
          }

          const taskUpdateRequest = taskStore.put(updatedTask)
          taskUpdateRequest.onsuccess = () => resolve(enrollmentRequest.result)
          taskUpdateRequest.onerror = () => reject(taskUpdateRequest.error)
        }

        enrollmentRequest.onerror = () => reject(enrollmentRequest.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getTaskEnrollments(taskId) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["taskEnrollments"], "readonly")
      const store = transaction.objectStore("taskEnrollments")
      const index = store.index("taskId")
      const request = index.getAll(taskId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTaskById(taskId) {
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

  async completeTaskAndAddHours(taskId, studentId) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener la tarea
        const task = await this.getTaskById(taskId)
        if (!task) {
          reject(new Error("Tarea no encontrada"))
          return
        }

        // Obtener el grupo de la tarea para verificar si suma horas
        let shouldAddHours = false
        if (task.groupId) {
          const group = await this.getGroupById(task.groupId)
          shouldAddHours = group && group.tipoGrupo === "servicio_social"
        }

        // Marcar tarea como completada
        const updatedTask = {
          ...task,
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        }

        await this.updateTask(taskId, updatedTask)

        // Si es servicio social, sumar horas al estudiante
        if (shouldAddHours && task.hoursAssigned > 0) {
          const result = await this.updateUserHours(studentId, task.hoursAssigned)
          resolve({
            success: true,
            hoursAdded: task.hoursAssigned,
            newTotal: result.newTotal,
          })
        } else {
          resolve({
            success: true,
            hoursAdded: 0,
            newTotal: null,
          })
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Group operations
  async addGroup(group) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async updateUser(matricula, userData) {
    await this.ensureDBReady()
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

  async getTasksByUser(userId) {
    await this.ensureDBReady()
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

  async getAllTasks() {
    await this.ensureDBReady()
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

  async getEnrolledTasksForStudent(studentId) {
    await this.ensureDBReady()
    try {
      // Get all enrollments for the student
      const transaction = this.db.transaction(["taskEnrollments", "tasks"], "readonly")
      const enrollmentStore = transaction.objectStore("taskEnrollments")
      const enrollmentIndex = enrollmentStore.index("userId")
      const enrollmentRequest = enrollmentIndex.getAll(studentId)

      const enrollments = await new Promise((resolve, reject) => {
        enrollmentRequest.onsuccess = () => resolve(enrollmentRequest.result)
        enrollmentRequest.onerror = () => reject(enrollmentRequest.error)
      })

      // Get groups of the student
      const studentGroups = await this.getUserGroups(studentId)
      const groupIds = studentGroups.map((g) => g.id)

      // Get tasks for each enrollment and filter by group membership
      const tasks = []
      const taskStore = transaction.objectStore("tasks")

      for (const enrollment of enrollments) {
        const taskRequest = taskStore.get(enrollment.taskId)
        const task = await new Promise((resolve, reject) => {
          taskRequest.onsuccess = () => resolve(taskRequest.result)
          taskRequest.onerror = () => reject(taskRequest.error)
        })

        if (task && task.groupId && groupIds.includes(task.groupId)) {
          tasks.push(task)
        }
      }

      return tasks
    } catch (error) {
      console.error("[v0] Error getting enrolled tasks for student:", error)
      return []
    }
  }

  async updateTask(taskId, taskData) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async addUser(user) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async updateUserHours(userId, hoursToAdd) {
    await this.ensureDBReady()
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      const updatedHours = user.horasCompletadas + hoursToAdd
      const updatedUser = {
        ...user,
        horasCompletadas: updatedHours,
        horasAcumuladas: updatedHours,
      }

      await this.updateUser(userId, updatedUser)
      return { success: true, newTotal: updatedHours }
    } catch (error) {
      console.error("[v0] Error updating user hours:", error)
      return { success: false, error: error.message }
    }
  }

  async getUserHoursStats(userId) {
    await this.ensureDBReady()
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

  setCurrentUser(user) {
    const sessionData = {
      user: user,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000,
    }
    localStorage.setItem("currentUser", JSON.stringify(sessionData))
    localStorage.setItem("sessionActive", "true")
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
    localStorage.removeItem("sessionActive")
  }

  isSessionActive() {
    return localStorage.getItem("sessionActive") === "true" && this.getCurrentUser() !== null
  }

  async assignUserToGroup(groupId, userId, assignedBy) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readwrite")
      const store = transaction.objectStore("groupAssignments")

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
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["groupAssignments"], "readwrite")
      const store = transaction.objectStore("groupAssignments")

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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async addProject(project) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async addNotification(notification) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async addMessage(message) {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["messages"], "readonly")
      const store = transaction.objectStore("messages")
      const request = store.getAll()

      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => a.timestamp - b.timestamp)
        resolve(messages)
      }
      request.onerror = () => reject(request.error)
    })
  }

  setSetting(key, value) {
    localStorage.setItem(`setting_${key}`, JSON.stringify(value))
  }

  getSetting(key, defaultValue = null) {
    const setting = localStorage.getItem(`setting_${key}`)
    return setting ? JSON.parse(setting) : defaultValue
  }

  async exportData() {
    await this.ensureDBReady()
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
    await this.ensureDBReady()
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

  async getAllGroupAssignments() {
    await this.ensureDBReady()
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

  async clearAllData() {
    await this.ensureDBReady()
    const stores = [
      "users",
      "tasks",
      "projects",
      "notifications",
      "messages",
      "groups",
      "groupAssignments",
      "taskEnrollments",
      "taskFiles",
    ]

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

  async deleteUser(matricula) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["users"], "readwrite")
      const store = transaction.objectStore("users")
      const request = store.delete(matricula)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async addTaskFile(taskId, file, uploadedBy) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      // Crear store para archivos si no existe
      if (!this.db.objectStoreNames.contains("taskFiles")) {
        reject(new Error("Task files store not available"))
        return
      }

      const transaction = this.db.transaction(["taskFiles"], "readwrite")
      const store = transaction.objectStore("taskFiles")

      const fileData = {
        taskId: taskId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: uploadedBy,
        uploadedAt: new Date(),
        fileData: file, // En un sistema real, esto sería una URL o referencia
      }

      const request = store.add(fileData)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTaskFiles(taskId) {
    await this.ensureDBReady()
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction(["taskFiles"], "readonly")
      const store = transaction.objectStore("taskFiles")
      const index = store.index("taskId")
      const request = index.getAll(taskId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getTaskEnrollmentsWithDetails(taskId) {
    await this.ensureDBReady()
    try {
      const enrollments = await this.getTaskEnrollments(taskId)
      const enrollmentsWithDetails = []

      for (const enrollment of enrollments) {
        const user = await this.getUser(enrollment.userId)
        if (user) {
          enrollmentsWithDetails.push({
            ...enrollment,
            studentName: `${user.nombre} ${user.apellidos}`,
            studentEmail: user.email,
            studentMatricula: user.matricula,
          })
        }
      }

      return enrollmentsWithDetails
    } catch (error) {
      console.error("[v0] Error getting enrollment details:", error)
      return []
    }
  }

  async createUser(userData) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      try {
        // Verificar si ya existe un usuario con esa matrícula o email
        const existingUser = await this.getUser(userData.matricula)
        if (existingUser) {
          reject(new Error("Ya existe un usuario con esa matrícula"))
          return
        }

        const allUsers = await this.getAllUsers()
        const existingEmail = allUsers.find((u) => u.email === userData.email)
        if (existingEmail) {
          reject(new Error("Ya existe un usuario con ese email"))
          return
        }

        const newUser = {
          ...userData,
          fechaRegistro: new Date(),
          activo: true,
          horasAcumuladas: 0,
          horasRequeridas: userData.tipoUsuario === "estudiante" ? 480 : 0,
          horasCompletadas: 0,
        }

        await this.addUser(newUser)
        resolve(newUser)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getTasksByGroup(groupId) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      try {
        const allTasks = await this.getAllTasks()
        const groupTasks = allTasks.filter((task) => task.groupId === groupId)

        // Agregar información de inscripciones a cada tarea
        const tasksWithEnrollments = []
        for (const task of groupTasks) {
          const enrollments = await this.getTaskEnrollmentsWithDetails(task.id)
          tasksWithEnrollments.push({
            ...task,
            enrollments: enrollments,
            enrolledStudents: enrollments.map((e) => ({
              matricula: e.studentMatricula,
              nombre: e.studentName,
              email: e.studentEmail,
            })),
          })
        }

        resolve(tasksWithEnrollments)
      } catch (error) {
        reject(error)
      }
    })
  }

  async enrollStudentInTaskWithFile(taskId, studentId, file = null) {
    await this.ensureDBReady()
    return new Promise(async (resolve, reject) => {
      try {
        // Primero inscribir al estudiante
        await this.enrollStudentInTask(taskId, studentId)

        // Si hay archivo, guardarlo
        if (file) {
          await this.addTaskFile(taskId, file, studentId)
        }

        resolve({ success: true, fileUploaded: !!file })
      } catch (error) {
        reject(error)
      }
    })
  }

  async getAvailableStudentsForGroup(groupId) {
    await this.ensureDBReady()
    try {
      const allUsers = await this.getAllUsers()
      const students = allUsers.filter((user) => user.tipoUsuario === "estudiante" && user.activo)

      const group = await this.getGroupById(groupId)
      const assignedStudents = group ? group.alumnosAsignados || [] : []

      // Filtrar estudiantes que no están asignados a este grupo
      const availableStudents = students.filter((student) => !assignedStudents.includes(student.matricula))

      return availableStudents
    } catch (error) {
      console.error("[v0] Error getting available students:", error)
      return []
    }
  }
}

// Initialize global database instance
window.db = new LocalDatabase()
