import React, { useState, useRef } from "react"
import type { ProductInput, BulkImportData, BulkTaskItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, ImageUpload } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sparkles, Upload, Download, FileSpreadsheet, Wand2 } from "lucide-react"
import * as XLSX from "xlsx"

interface InputPanelProps {
  activeTab: "single" | "bulk"
  onTabChange: (tab: "single" | "bulk") => void
  singleInput: ProductInput
  onSingleInputChange: (field: keyof ProductInput, value: string | File | null | string) => void
  onSingleGenerate: () => void
  isSingleGenerating: boolean
  onFillTestData: () => void
  bulkData: BulkImportData | null
  onBulkDataChange: (data: BulkImportData | null) => void
  onBulkPageChange: (page: number) => void
  onBulkGenerateAll: () => void
  isBulkGenerating: boolean
}

const PAGE_SIZE = 20

function parseExcelFile(file: File): Promise<BulkImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

        const tasks: BulkTaskItem[] = jsonData.map((row, index) => ({
          id: `task-${Date.now()}-${index}`,
          name: (row["商品名称"] as string) || "",
          coreSellingPoint: (row["核心卖点"] as string) || "",
          targetAudience: (row["目标受众"] as string) || "",
          brandTone: (row["品牌调性"] as string) || "",
          image: null,
          imagePreview: null,
          mockImageUrl: null,
          status: "pending_image" as const,
          result: null,
        }))

        resolve({
          tasks,
          totalCount: tasks.length,
          currentPage: 1,
          pageSize: PAGE_SIZE,
        })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsBinaryString(file)
  })
}

export function InputPanel({
  activeTab,
  onTabChange,
  singleInput,
  onSingleInputChange,
  onSingleGenerate,
  isSingleGenerating,
  onFillTestData,
  bulkData,
  onBulkDataChange,
  onBulkPageChange,
  onBulkGenerateAll,
  isBulkGenerating,
}: InputPanelProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSingleFormValid = Boolean(singleInput.name.trim() && singleInput.brand.trim())

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExtensions = [".xlsx", ".xls", ".csv"]
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!validExtensions.includes(extension)) {
      alert("请上传 .xlsx 或 .csv 格式的文件")
      return
    }

    setIsUploading(true)
    try {
      const data = await parseExcelFile(file)
      onBulkDataChange(data)
    } catch (error) {
      console.error("Excel parsing error:", error)
      alert("文件解析失败，请检查格式")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownloadTemplate = () => {
    alert("下载模板功能 - Mock 点击事件\n\n模板应包含列：商品名称、核心卖点、目标受众、品牌调性")
  }

  const currentPageTasks = bulkData
    ? bulkData.tasks.slice(
        (bulkData.currentPage - 1) * bulkData.pageSize,
        bulkData.currentPage * bulkData.pageSize
      )
    : []

  const readyCount = currentPageTasks.filter((t) => t.status === "ready").length

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">
          商品信息输入
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "single" | "bulk")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="single" className="flex-1">
              单品生成
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">
              批量导入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <SingleItemTab
              input={singleInput}
              onInputChange={onSingleInputChange}
              onGenerate={onSingleGenerate}
              isGenerating={isSingleGenerating}
              isFormValid={isSingleFormValid}
              onFillTestData={onFillTestData}
            />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImportTab
              bulkData={bulkData}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onDownloadTemplate={handleDownloadTemplate}
              currentPageTasks={currentPageTasks}
              onBulkGenerateAll={onBulkGenerateAll}
              onBulkPageChange={onBulkPageChange}
              readyCount={readyCount}
              isBulkGenerating={isBulkGenerating}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SingleItemTab({
  input,
  onInputChange,
  onGenerate,
  isGenerating,
  isFormValid,
  onFillTestData,
}: {
  input: ProductInput
  onInputChange: (field: keyof ProductInput, value: string | File | null | string) => void
  onGenerate: () => void
  isGenerating: boolean
  isFormValid: boolean
  onFillTestData: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-slate-700">
              商品名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例如：无线蓝牙耳机 Pro"
              value={input.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="brand" className="text-slate-700">
              品牌 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brand"
              placeholder="例如：索尼、华为、苹果"
              value={input.brand}
              onChange={(e) => onInputChange("brand", e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="category" className="text-slate-700">
              类目
            </Label>
            <Input
              id="category"
              placeholder="例如：数码配件、美妆护肤"
              value={input.category}
              onChange={(e) => onInputChange("category", e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="targetAudience" className="text-slate-700">
              目标受众
            </Label>
            <Input
              id="targetAudience"
              placeholder="例如：年轻白领、学生群体"
              value={input.targetAudience}
              onChange={(e) => onInputChange("targetAudience", e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="sellingPoints" className="text-slate-700">
            核心卖点
          </Label>
          <Input
            id="sellingPoints"
            placeholder="例如：独家降噪技术、30小时长续航..."
            value={input.sellingPoints || ""}
            onChange={(e) => onInputChange("sellingPoints", e.target.value)}
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-slate-700">商品原图</Label>
        <ImageUpload
          value={input.imagePreview}
          onChange={(file, preview) => {
            onInputChange("image", file)
            onInputChange("imagePreview", preview)
          }}
          disabled={isGenerating}
        />
      </div>

      <div className="mt-auto pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFillTestData}
          disabled={isGenerating}
          className="w-full mb-3 text-slate-500 hover:text-slate-700"
        >
          <Wand2 className="w-4 h-4 mr-1" />
          一键填充测试数据
        </Button>
        <Button
          onClick={onGenerate}
          disabled={!isFormValid || isGenerating}
          className="w-full h-12 text-base"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? "生成中..." : "立即生成"}
        </Button>
        {!isFormValid && !isGenerating && (
          <p className="mt-2 text-xs text-slate-400 text-center">
            请填写商品名称和品牌以开始生成
          </p>
        )}
      </div>
    </div>
  )
}

function BulkImportTab({
  bulkData,
  isUploading,
  fileInputRef,
  onFileUpload,
  onDownloadTemplate,
  currentPageTasks,
  onBulkGenerateAll,
  onBulkPageChange,
  readyCount,
  isBulkGenerating,
}: {
  bulkData: BulkImportData | null
  isUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDownloadTemplate: () => void
  currentPageTasks: BulkTaskItem[]
  onBulkGenerateAll: () => void
  onBulkPageChange: (page: number) => void
  readyCount: number
  isBulkGenerating: boolean
}) {
  if (!bulkData) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="w-full cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-400 hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={onFileUpload}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-slate-600">正在解析文件...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">
                  点击上传 Excel 文件
                </p>
                <p className="text-xs text-slate-400">支持 .xlsx 或 .csv 格式</p>
              </>
            )}
          </div>
          <button
            onClick={onDownloadTemplate}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Download className="mr-1 inline h-4 w-4" />
            下载 Excel 模板
          </button>
        </div>

        <div className="mt-auto pt-2">
          <Button
            className="w-full h-12 text-base"
            disabled
          >
            <Sparkles className="w-5 h-5" />
            立即生成
          </Button>
          <p className="mt-2 text-xs text-slate-400 text-center">
            请先上传 Excel 文件以开始生成
          </p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(bulkData.totalCount / bulkData.pageSize)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          共 <span className="font-medium text-slate-900">{bulkData.totalCount}</span> 条商品数据
        </span>
        <span className="text-slate-500">
          第 {bulkData.currentPage} / {totalPages} 页
        </span>
      </div>

      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        <FileSpreadsheet className="mr-2 inline h-4 w-4" />
        当前页 {currentPageTasks.length} 条，其中 {readyCount} 条已就绪
      </div>

      <div className="mt-auto pt-2">
        <Button
          onClick={onBulkGenerateAll}
          disabled={readyCount === 0 || isBulkGenerating}
          className="w-full h-12 text-base"
        >
          <Sparkles className="w-5 h-5" />
          {isBulkGenerating ? "生成中..." : `立即生成 (${readyCount})`}
        </Button>
        {readyCount === 0 && !isBulkGenerating && (
          <p className="mt-2 text-xs text-slate-400 text-center">
            请先为商品上传原图以开始生成
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkPageChange(bulkData.currentPage - 1)}
          disabled={bulkData.currentPage <= 1}
        >
          上一页
        </Button>
        <span className="text-sm text-slate-500">
          {bulkData.currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkPageChange(bulkData.currentPage + 1)}
          disabled={bulkData.currentPage >= totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
