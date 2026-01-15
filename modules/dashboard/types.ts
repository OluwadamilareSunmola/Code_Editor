export interface User {
    id: string
    name: string
    email: string
    image: string
    role: string
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Project {
    id: string
    title: string
  description: string | null
    userId: string
    user: User
    Starmark: { isMarked: boolean }[]
  }
  