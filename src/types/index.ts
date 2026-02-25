export interface ProductInput {
  name: string
  brand: string
  category: string
  targetAudience: string
  sellingPoints?: string
  image: File | null
  imagePreview: string | null
}

export interface CopywritingVersion {
  id: string
  title: string
  content: string
}

export interface GeneratedImage {
  id: string
  url: string
  description: string
}

export interface GenerationResult {
  copywritings: CopywritingVersion[]
  images: GeneratedImage[]
}

export interface HistoryItem {
  id: string
  timestamp: Date
  input: ProductInput
  result: GenerationResult
}

export type TaskStatus = "pending_image" | "ready" | "generating" | "completed"

export interface BulkTaskItem {
  id: string
  name: string
  coreSellingPoint: string
  targetAudience: string
  brandTone: string
  image: File | null
  imagePreview: string | null
  mockImageUrl: string | null
  status: TaskStatus
  result: GenerationResult | null
}

export interface BulkImportData {
  tasks: BulkTaskItem[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export type ActiveTab = "single" | "bulk"

export interface LibraryItem {
  id: string
  timestamp: string
  input: {
    name: string
    brand: string
    category: string
    targetAudience: string
    sellingPoints?: string
    image: File | null
    imagePreview: string | null
    originalImage: string | null
  }
  result: GenerationResult
}
