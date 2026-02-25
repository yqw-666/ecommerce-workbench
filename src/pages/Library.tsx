import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, X, FileQuestion, Sparkles, ArrowRight, Trash2, Download } from "lucide-react"
import type { LibraryItem } from "@/types"

const STORAGE_KEY = "easy_vibe_library_data"

function loadLibraryData(): LibraryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function Library() {
  const [libraryData, setLibraryData] = useState<LibraryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLibraryData(loadLibraryData())
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDownload = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      alert("图片下载成功")
    } catch (error) {
      console.error("下载失败:", error)
      alert("图片下载失败，请稍后重试")
    }
  }

  const handleUseParams = (item: LibraryItem) => {
    setSelectedItem(null)
    navigate("/workbench", {
      state: {
        fromLibrary: true,
        input: {
          name: item.input.name,
          brand: item.input.brand,
          category: item.input.category,
          targetAudience: item.input.targetAudience,
          image: null,
          imagePreview: item.input.originalImage || null,
        },
      },
    })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm("确定要删除这条保存的素材吗？")) {
      const newData = libraryData.filter((item) => item.id !== id)
      setLibraryData(newData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (libraryData.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">素材库</h1>
          <p className="text-slate-500">管理您的营销素材</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FileQuestion className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-600 font-medium">暂无保存的素材</p>
                <p className="text-sm text-slate-400 mt-1">请前往工作台生成营销内容并保存至素材库</p>
              </div>
              <Button
                onClick={() => navigate("/workbench")}
                className="mt-4"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                前往工作台
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">素材库</h1>
        <p className="text-slate-500">管理您的营销素材（共 {libraryData.length} 条）</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {libraryData.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden border-slate-200 shadow-md transition-shadow shadow-sm hover: cursor-pointer group"
            onClick={() => setSelectedItem(item)}
          >
            <div className="aspect-square bg-slate-100 relative">
              {item.result.images[0]?.url ? (
                <img
                  src={item.result.images[0].url}
                  alt={item.input.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileQuestion className="h-12 w-12 text-slate-300" />
                </div>
              )}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-800 truncate">{item.input.name || "未命名商品"}</h3>
              <p className="text-xs text-slate-500 mt-1">{formatDate(item.timestamp)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">{selectedItem.input.name}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row max-h-[calc(90vh-140px)]">
              <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-4">商品信息</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-slate-400">品牌</p>
                    <p className="text-sm text-slate-800">{selectedItem.input.brand || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">类目</p>
                    <p className="text-sm text-slate-800">{selectedItem.input.category || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">目标受众</p>
                    <p className="text-sm text-slate-800">{selectedItem.input.targetAudience || "-"}</p>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-slate-500 mb-4">生成的图片</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedItem.result.images.map((img, index) => (
                    <div
                      key={img.id}
                      className="rounded-lg overflow-hidden border border-slate-200 group relative"
                    >
                      <img
                        src={img.url}
                        alt={img.description}
                        className="w-full aspect-square object-cover"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDownload(img.url, `${selectedItem.input.name}-营销图${index + 1}.png`)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:w-1/2 p-6 overflow-y-auto">
                <h3 className="text-sm font-medium text-slate-500 mb-4">营销文案</h3>
                <div className="space-y-4">
                  {selectedItem.result.copywritings.map((cw) => (
                    <div key={cw.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          文案
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(`${cw.title}\n\n${cw.content}`, cw.id)}
                          className="h-6 text-xs"
                        >
                          {copiedId === cw.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span className="ml-1">{copiedId === cw.id ? "已复制" : "复制"}</span>
                        </Button>
                      </div>
                      <h4 className="font-medium text-slate-800 mb-2">{cw.title}</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{cw.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleCopy(
                  selectedItem.result.copywritings.map(cw => `${cw.title}\n\n${cw.content}`).join("\n\n---\n\n"),
                  "all"
                )}
              >
                <Copy className="w-4 h-4 mr-2" />
                复制全部文案
              </Button>
              <Button onClick={() => handleUseParams(selectedItem)}>
                <Sparkles className="w-4 h-4 mr-2" />
                以此参数新建任务
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
