import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { InputPanel } from "@/components/panels/InputPanel"
import { OutputPanel } from "@/components/panels/OutputPanel"
import type { ProductInput, GenerationResult, HistoryItem, BulkImportData, ActiveTab, TaskStatus, LibraryItem, CopywritingVersion } from "@/types"
import { Sparkles, History } from "lucide-react"

const LIBRARY_STORAGE_KEY = "easy_vibe_library_data"
const API_KEYS_STORAGE_KEY = "easy_vibe_api_keys"

function loadLibraryData(): LibraryItem[] {
  try {
    const data = localStorage.getItem(LIBRARY_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveLibraryData(items: LibraryItem[]) {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(items))
}

interface ApiKeys {
  llmKey: string
  vlmKey: string
  imageGenKey: string
}

function loadApiKeys(): ApiKeys {
  try {
    const data = localStorage.getItem(API_KEYS_STORAGE_KEY)
    return data ? JSON.parse(data) : { llmKey: "", vlmKey: "", imageGenKey: "" }
  } catch {
    return { llmKey: "", vlmKey: "", imageGenKey: "" }
  }
}

const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1/"
const VLM_MODEL_NAME = "Qwen/Qwen3-VL-8B-Instruct"

async function captionImageWithVLM(apiKey: string, imageUrl: string): Promise<string> {
  const base64Image = imageUrl.startsWith("data:")
    ? imageUrl.split(",")[1]
    : await fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => blob.arrayBuffer())
        .then((buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))))

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "请详细描述这张电商商品图片中的内容，包括商品外观、颜色、材质、使用场景等关键信息。",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    },
  ]

  const response = await fetch(`${SILICONFLOW_BASE_URL}chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VLM_MODEL_NAME,
      messages,
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      frequency_penalty: 0.5,
      stream: false,
      n: 1,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `VLM API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("VLM API 返回数据格式异常")
  }

  return content
}

const SEEDREAM_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
const SEEDREAM_MODEL = "doubao-seedream-4-0-250828"

async function imageToBase64(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("data:")) {
    return imageUrl
  }

  const response = await fetch(imageUrl)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function generateImageWithSeedream(
  apiKey: string,
  imageUrl: string,
  productName: string,
  targetAudience: string
): Promise<string> {
  const base64Image = await imageToBase64(imageUrl)
  const imageData = base64Image.startsWith("data:") ? base64Image.split(",")[1] : base64Image

  const prompt = `电商产品高级摄影，完美保留图中商品主体。商品是：${productName}。放置在：符合${targetAudience}喜好的场景中。电影级光影，8k分辨率，极其逼真。`

  const response = await fetch(SEEDREAM_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: SEEDREAM_MODEL,
      prompt,
      image: `data:image/jpeg;base64,${imageData}`,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Seedream API 错误响应:", errorText)
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(errorData.message || `图生图 API 请求失败: ${response.status}`)
    } catch {
      throw new Error(`图生图 API 请求失败: ${response.status} - ${errorText}`)
    }
  }

  const data = await response.json()
  const imageUrlResult = data?.data?.[0]?.url

  if (!imageUrlResult) {
    console.error("Seedream API 返回数据:", data)
    throw new Error("图生图 API 返回数据格式异常")
  }

  return imageUrlResult
}

async function generateWithDeepSeek(
  llmKey: string,
  input: ProductInput,
  vlmKey?: string,
  imageGenKey?: string
): Promise<GenerationResult> {
  let imageDescription = ""

  if (vlmKey && (input.imagePreview || input.image)) {
    try {
      const imageUrl = input.imagePreview || ""
      if (imageUrl) {
        imageDescription = await captionImageWithVLM(vlmKey, imageUrl)
      }
    } catch (error) {
      console.warn("图像理解失败，将使用纯文本生成:", error)
    }
  }

  const systemPrompt = "你是一个资深的电商营销专家，擅长撰写高转化率的商品种草文案。"
  let userPrompt = `请为商品『${input.name}』撰写文案。品牌：${input.brand}，类目：${input.category}，目标受众：${input.targetAudience}。`

  if (imageDescription) {
    userPrompt += `\n\n商品图片分析：${imageDescription}`
  }

  userPrompt += "\n\n请输出包含吸睛标题、核心卖点和行动号召的完整文案。"

  const textGenerationPromise = fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llmKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  })

  const imageGenerationPromise = imageGenKey && input.imagePreview
    ? generateImageWithSeedream(imageGenKey, input.imagePreview, input.name, input.targetAudience)
      .then((url) => [url])
      .catch((error) => {
        console.warn("图片生成失败，将使用占位图:", error)
        return null
      })
    : Promise.resolve(null)

  const [textResult, imageResult] = await Promise.allSettled([textGenerationPromise, imageGenerationPromise])

  let content = ""
  if (textResult.status === "fulfilled" && textResult.value.ok) {
    const data = await textResult.value.json()
    content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("API 返回数据格式异常")
    }
  } else if (textResult.status === "fulfilled") {
    const errorData = await textResult.value.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API 请求失败: ${textResult.value.status}`)
  } else {
    throw new Error(textResult.reason?.message || "文本生成失败")
  }

  const copywritings: CopywritingVersion[] = [
    {
      id: `cw-${Date.now()}`,
      title: content.split("\n")[0] || "种草推荐",
      content: content,
    },
  ]

  const generatedImages = imageResult.status === "fulfilled" && imageResult.value
    ? imageResult.value.map((url, index) => ({
        id: `img-${Date.now()}-${index + 1}`,
        url,
        description: `商品场景展示图 ${index + 1}`,
      }))
    : [
        {
          id: `img-${Date.now()}-1`,
          url: `https://picsum.photos/400/400?random=${Date.now()}`,
          description: "商品场景展示图",
        },
        {
          id: `img-${Date.now()}-2`,
          url: `https://picsum.photos/400/401?random=${Date.now() + 1}`,
          description: "商品细节展示图",
        },
      ]

  return {
    copywritings,
    images: generatedImages,
  }
}

export function Workbench() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<ActiveTab>("single")

  const [singleInput, setSingleInput] = useState<ProductInput>({
    name: "",
    brand: "",
    category: "",
    targetAudience: "",
    image: null,
    imagePreview: null,
  })
  const [singleResult, setSingleResult] = useState<GenerationResult | null>(null)
  const [isSingleGenerating, setIsSingleGenerating] = useState(false)

  const [bulkData, setBulkData] = useState<BulkImportData | null>(null)
  const [isBulkGenerating, setIsBulkGenerating] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (location.state && (location.state as { fromLibrary?: boolean }).fromLibrary) {
      const libraryItem = location.state as unknown as LibraryItem
      if (libraryItem.input) {
        setSingleInput({
          name: libraryItem.input.name || "",
          brand: libraryItem.input.brand || "",
          category: libraryItem.input.category || "",
          targetAudience: libraryItem.input.targetAudience || "",
          image: null,
          imagePreview: libraryItem.result?.images[0]?.url || null,
        })
      }
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleSingleInputChange = (field: keyof ProductInput, value: string | File | null | string) => {
    setSingleInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleFillTestData = () => {
    setSingleInput({
      name: "降噪头戴式蓝牙耳机 Pro Max",
      brand: "索尼 (Sony)",
      category: "数码家电 / 影音配件",
      targetAudience: "年轻白领、学生群体、数码发烧友",
      image: null,
      imagePreview: "https://picsum.photos/400/400",
    })
  }

  const handleSingleGenerate = async () => {
    if (!singleInput.name.trim() || !singleInput.brand.trim()) return

    const apiKeys = loadApiKeys()
    if (!apiKeys.llmKey.trim()) {
      alert("请先前往设置页面配置 DeepSeek API 密钥")
      return
    }

    setIsSingleGenerating(true)
    try {
      const generatedResult = await generateWithDeepSeek(apiKeys.llmKey, singleInput, apiKeys.vlmKey, apiKeys.imageGenKey)
      setSingleResult(generatedResult)

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        input: { ...singleInput },
        result: generatedResult,
      }
      setHistory((prev) => [historyItem, ...prev])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "生成失败，请稍后重试"
      alert(`生成失败: ${errorMessage}`)
      console.error("Generation failed:", error)
    } finally {
      setIsSingleGenerating(false)
    }
  }

  const handleSaveToLibrary = (input: ProductInput, result: GenerationResult) => {
    const libraryItem: LibraryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input: {
        name: input.name,
        brand: input.brand,
        category: input.category,
        targetAudience: input.targetAudience,
        image: null,
        imagePreview: input.imagePreview,
        originalImage: input.imagePreview || null,
      },
      result: {
        copywritings: result.copywritings.map((cw) => ({ ...cw })),
        images: result.images.map((img) => ({ ...img })),
      },
    }

    const libraryData = loadLibraryData()
    saveLibraryData([libraryItem, ...libraryData])
    alert("已成功保存至素材库")
  }

  const handleBulkDataChange = (data: BulkImportData | null) => {
    setBulkData(data)
  }

  const handleBulkPageChange = (page: number) => {
    if (!bulkData) return
    setBulkData((prev) => prev ? { ...prev, currentPage: page } : null)
  }

  const handleTaskImageChange = (taskId: string, file: File | null, preview: string | null) => {
    if (!bulkData) return

    setBulkData((prev) => {
      if (!prev) return null
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id !== taskId) return task
        const newStatus: TaskStatus = file && preview ? "ready" : "pending_image"
        return {
          ...task,
          image: file,
          imagePreview: preview,
          mockImageUrl: null,
          status: newStatus,
        }
      })
      return { ...prev, tasks: updatedTasks }
    })
  }

  const handleTaskMockImageClick = (taskId: string) => {
    if (!bulkData) return

    const mockUrl = `https://picsum.photos/80?random=${Date.now()}`

    setBulkData((prev) => {
      if (!prev) return null
      const updatedTasks = prev.tasks.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          mockImageUrl: mockUrl,
          status: "ready" as TaskStatus,
        }
      })
      return { ...prev, tasks: updatedTasks }
    })
  }

  const handleTaskGenerate = async (taskId: string) => {
    if (!bulkData) return

    const apiKeys = loadApiKeys()
    if (!apiKeys.llmKey.trim()) {
      alert("请先前往设置页面配置 DeepSeek API 密钥")
      return
    }

    const task = bulkData.tasks.find((t) => t.id === taskId)
    if (!task || task.status !== "ready") return
    if (!task.imagePreview && !task.mockImageUrl) return

    const imagePreview = task.imagePreview || task.mockImageUrl

    setBulkData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: "generating" as const } : t)),
      }
    })

    try {
      const mockResult = await generateWithDeepSeek(apiKeys.llmKey, {
        name: task.name,
        brand: task.brandTone || "",
        category: "",
        targetAudience: task.targetAudience,
        image: task.image,
        imagePreview: imagePreview,
      }, apiKeys.vlmKey, apiKeys.imageGenKey)

      setBulkData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "completed" as const, result: mockResult } : t
          ),
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "生成失败"
      alert(`生成失败: ${errorMessage}`)
      setBulkData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "ready" as const } : t
          ),
        }
      })
    }
  }

  const handleBulkGenerateAll = async () => {
    if (!bulkData) return

    const apiKeys = loadApiKeys()
    if (!apiKeys.llmKey.trim()) {
      alert("请先前往设置页面配置 DeepSeek API 密钥")
      return
    }

    const currentPageTasks = bulkData.tasks.slice(
      (bulkData.currentPage - 1) * bulkData.pageSize,
      bulkData.currentPage * bulkData.pageSize
    )
    const readyTasks = currentPageTasks.filter((t) => t.status === "ready")

    if (readyTasks.length === 0) return

    setIsBulkGenerating(true)

    for (const task of readyTasks) {
      const taskWithImage = bulkData.tasks.find((t) => t.id === task.id)
      if (!taskWithImage) continue
      if (taskWithImage.status !== "ready") continue
      if (!taskWithImage.imagePreview && !taskWithImage.mockImageUrl) continue

      const imagePreview = taskWithImage.imagePreview || taskWithImage.mockImageUrl

      setBulkData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: "generating" as const } : t)),
        }
      })

      try {
        const mockResult = await generateWithDeepSeek(apiKeys.llmKey, {
          name: taskWithImage.name,
          brand: taskWithImage.brandTone || "",
          category: "",
          targetAudience: taskWithImage.targetAudience,
          image: taskWithImage.image,
          imagePreview: imagePreview,
        }, apiKeys.vlmKey, apiKeys.imageGenKey)

        setBulkData((prev) => {
          if (!prev) return null
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, status: "completed" as const, result: mockResult } : t
            ),
          }
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "生成失败"
        alert(`商品 "${taskWithImage.name}" 生成失败: ${errorMessage}`)
        setBulkData((prev) => {
          if (!prev) return null
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, status: "ready" as const } : t
            ),
          }
        })
      }
    }

    setIsBulkGenerating(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Easy Vibe</h1>
              <p className="text-xs text-slate-500">智能电商营销工具</p>
            </div>
          </div>
          {history.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <History className="w-4 h-4" />
              <span>已生成 {history.length} 条</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-120px)]">
          <div className="lg:col-span-2 h-full">
            <InputPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              singleInput={singleInput}
              onSingleInputChange={handleSingleInputChange}
              onSingleGenerate={handleSingleGenerate}
              isSingleGenerating={isSingleGenerating}
              onFillTestData={handleFillTestData}
              bulkData={bulkData}
              onBulkDataChange={handleBulkDataChange}
              onBulkPageChange={handleBulkPageChange}
              onBulkGenerateAll={handleBulkGenerateAll}
              isBulkGenerating={isBulkGenerating}
            />
          </div>
          <div className="lg:col-span-3 h-full">
            <OutputPanel
              activeTab={activeTab}
              result={singleResult}
              isGenerating={isSingleGenerating}
              bulkData={bulkData}
              onTaskImageChange={handleTaskImageChange}
              onTaskMockImageClick={handleTaskMockImageClick}
              onTaskGenerate={handleTaskGenerate}
              onSaveToLibrary={handleSaveToLibrary}
              singleInput={singleInput}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
