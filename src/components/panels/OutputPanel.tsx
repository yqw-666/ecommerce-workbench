import type { GenerationResult, BulkImportData, BulkTaskItem, ActiveTab, ProductInput } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Copy, Check, Download, X, Loader2, Wand2, FileText, ImageIcon, Upload, ChevronDown, ChevronUp, Star } from "lucide-react"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OutputPanelProps {
  activeTab: ActiveTab
  result: GenerationResult | null
  isGenerating: boolean
  bulkData: BulkImportData | null
  onTaskImageChange: (taskId: string, file: File | null, preview: string | null) => void
  onTaskMockImageClick: (taskId: string) => void
  onTaskGenerate: (taskId: string) => void
  onSaveToLibrary?: (input: ProductInput, result: GenerationResult) => void
  singleInput?: ProductInput
}

function ImageModal({
  image,
  onClose,
}: {
  image: { url: string; description: string }
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-200"
        >
          <X className="h-8 w-8" />
        </button>
        <img
          src={image.url}
          alt={image.description}
          className="w-full rounded-xl shadow-2xl"
        />
        <p className="mt-4 text-center text-white">{image.description}</p>
      </div>
    </div>
  )
}

function TaskImageUpload({
  value,
  mockImageUrl,
  onChange,
  onMockImageClick,
  disabled,
}: {
  value: string | null
  mockImageUrl: string | null
  onChange: (file: File | null, preview: string | null) => void
  onMockImageClick?: () => void
  disabled?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onChange(file, event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const displayUrl = value || mockImageUrl

  if (displayUrl) {
    return (
      <div className="relative group">
        <img
          src={displayUrl}
          alt="Preview"
          className="w-12 h-12 object-cover rounded-md"
        />
        {!disabled && (
          <button
            onClick={() => onChange(null, null)}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`w-12 h-12 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={() => {
        if (disabled) return
        if (onMockImageClick) {
          onMockImageClick()
        } else {
          document.getElementById(`task-upload-${Math.random()}`)?.click()
        }
      }}
    >
      <input
        id={`task-upload-${Math.random()}`}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
      />
      <Upload className="h-4 w-4 text-slate-400" />
    </div>
  )
}

function getStatusBadge(status: BulkTaskItem["status"]) {
  switch (status) {
    case "pending_image":
      return <Badge variant="warning">待补图</Badge>
    case "ready":
      return <Badge variant="info">已就绪</Badge>
    case "generating":
      return <Badge variant="secondary">生成中</Badge>
    case "completed":
      return <Badge variant="success">已完成</Badge>
    default:
      return <Badge variant="secondary">未知</Badge>
  }
}

function TaskDetailPanel({ task }: { task: BulkTaskItem }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; description: string } | null>(null)

  if (!task.result) return null

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "收起详情" : "查看生成结果"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {task.result.copywritings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">营销文案</h4>
              {task.result.copywritings.slice(0, 1).map((cw) => (
                <div key={cw.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                      {copiedId === cw.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{cw.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{cw.content.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}

          {task.result.images.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">场景图</h4>
              <div className="flex gap-2">
                {task.result.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img.url}
                      alt={img.description}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  )
}

export function OutputPanel({
  activeTab,
  result,
  isGenerating,
  bulkData,
  onTaskImageChange,
  onTaskMockImageClick,
  onTaskGenerate,
  onSaveToLibrary,
  singleInput,
}: OutputPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (activeTab === "single") {
    return <SingleItemOutput result={result} isGenerating={isGenerating} copiedId={copiedId} handleCopy={handleCopy} onSaveToLibrary={onSaveToLibrary} singleInput={singleInput} />
  }

  return (
    <BulkTaskList
      bulkData={bulkData}
      onTaskImageChange={onTaskImageChange}
      onTaskMockImageClick={onTaskMockImageClick}
      onTaskGenerate={onTaskGenerate}
    />
  )
}

function SingleItemOutput({
  result,
  isGenerating,
  copiedId,
  handleCopy,
  onSaveToLibrary,
  singleInput,
}: {
  result: GenerationResult | null
  isGenerating: boolean
  copiedId: string | null
  handleCopy: (text: string, id: string) => void
  onSaveToLibrary?: (input: ProductInput, result: GenerationResult) => void
  singleInput?: ProductInput
}) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; description: string } | null>(null)

  if (isGenerating) {
    return (
      <Card className="h-full border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">生成结果</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-slate-600 font-medium">AI 正在努力生成中...</p>
            <p className="text-sm text-slate-400">预计需要 2 秒</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="h-full border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">生成结果</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <Wand2 className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">等待生成</p>
              <p className="text-sm text-slate-400 mt-1">填写商品信息后，点击"立即生成"获取营销文案和场景图</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-full border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">生成结果</CardTitle>
            {onSaveToLibrary && singleInput && result && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveToLibrary(singleInput, result)}
                className="gap-1"
              >
                <Star className="w-4 h-4" />
                保存至素材库
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="copywriting">
            <TabsList className="w-full">
              <TabsTrigger value="copywriting" className="flex-1 gap-2">
                <FileText className="w-4 h-4" />
                营销文案
              </TabsTrigger>
              <TabsTrigger value="images" className="flex-1 gap-2">
                <ImageIcon className="w-4 h-4" />
                场景化图片
              </TabsTrigger>
            </TabsList>

            <TabsContent value="copywriting">
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {result.copywritings.map((cw, index) => (
                  <div key={cw.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        版本 {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(`${cw.title}\n\n${cw.content}`, cw.id)}
                        className="h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        {copiedId === cw.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-1">{copiedId === cw.id ? "已复制" : "复制"}</span>
                      </Button>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-3 text-lg">{cw.title}</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{cw.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="images">
              <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {result.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="aspect-square">
                      <img src={img.url} alt={img.description} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  )
}

function BulkTaskList({
  bulkData,
  onTaskImageChange,
  onTaskMockImageClick,
  onTaskGenerate,
}: {
  bulkData: BulkImportData | null
  onTaskImageChange: (taskId: string, file: File | null, preview: string | null) => void
  onTaskMockImageClick: (taskId: string) => void
  onTaskGenerate: (taskId: string) => void
}) {
  const currentPageTasks = bulkData
    ? bulkData.tasks.slice(
        (bulkData.currentPage - 1) * bulkData.pageSize,
        bulkData.currentPage * bulkData.pageSize
      )
    : []

  if (!bulkData) {
    return (
      <Card className="h-full border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">批量生成任务</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <Wand2 className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-600 font-medium">等待导入数据</p>
              <p className="text-sm text-slate-400 mt-1">请在左侧上传 Excel 文件开始批量生成</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">批量生成任务</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">商品原图</TableHead>
                <TableHead>商品信息</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageTasks.map((task) => (
                <>
                  <TableRow key={task.id}>
                    <TableCell>
                      <TaskImageUpload
                        value={task.imagePreview}
                        mockImageUrl={task.mockImageUrl}
                        onChange={(file, preview) => onTaskImageChange(task.id, file, preview)}
                        onMockImageClick={() => onTaskMockImageClick(task.id)}
                        disabled={task.status === "generating" || task.status === "completed"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{task.name || "未命名商品"}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[200px]" title={task.coreSellingPoint}>
                          {task.coreSellingPoint || "无卖点"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={task.status === "ready" ? "default" : "secondary"}
                        disabled={task.status !== "ready"}
                        onClick={() => onTaskGenerate(task.id)}
                      >
                        {task.status === "generating" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "生成"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {task.status === "completed" && task.result && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <TaskDetailPanel task={task} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
