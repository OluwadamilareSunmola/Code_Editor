export type Templates = 'REACT' | 'NEXTJS' | 'EXPRESS' | 'VUE' | 'HONO' | 'ANGULAR';
export type UserRole = 'ADMIN' | 'USER' | 'PREMIUM_USER';

export interface User {
    id: string
    name: string | null
    email: string
    image: string | null
    role: UserRole
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Project {
    id: string
    title: string
    description: string | null
    template: Templates
    createdAt: Date
    updatedAt: Date
    userId: string
    user: User
    Starmark: { isMarked: boolean }[]
  }
  