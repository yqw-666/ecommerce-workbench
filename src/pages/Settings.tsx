import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Brain, Eye, Palette, Save } from "lucide-react"

const STORAGE_KEY = "easy_vibe_api_keys"

interface ApiKeys {
  llmKey: string
  vlmKey: string
  imageGenKey: string
}

function loadApiKeys(): ApiKeys {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : { llmKey: "", vlmKey: "", imageGenKey: "" }
  } catch {
    return { llmKey: "", vlmKey: "", imageGenKey: "" }
  }
}

export function Settings() {
  const [llmKey, setLlmKey] = useState("")
  const [vlmKey, setVlmKey] = useState("")
  const [imageGenKey, setImageGenKey] = useState("")

  useEffect(() => {
    const keys = loadApiKeys()
    setLlmKey(keys.llmKey)
    setVlmKey(keys.vlmKey)
    setImageGenKey(keys.imageGenKey)
  }, [])

  const handleSave = () => {
    const keys: ApiKeys = { llmKey, vlmKey, imageGenKey }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
    alert("设置已保存")
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">三模型配置中心</h1>
        <p className="text-slate-500">管理您的 AI 能力 API 密钥配置。</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">文案生成大脑 (DeepSeek)</h3>
              <p className="text-sm text-slate-500">根据商品信息生成营销文案</p>
            </div>
          </div>
          <div>
            <Input
              type="password"
              placeholder="请输入 DeepSeek API Key (sk-...)"
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">图像理解之眼 (Qwen-VL)</h3>
              <p className="text-sm text-slate-500">识别用户上传的商品原图并提取卖点</p>
            </div>
          </div>
          <div>
            <Input
              type="password"
              placeholder="请输入用于图像理解的 API Key"
              value={vlmKey}
              onChange={(e) => setVlmKey(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">视觉展示画师 (Seedream)</h3>
              <p className="text-sm text-slate-500">生成最终的商品场景展示图</p>
            </div>
          </div>
          <div>
            <Input
              type="password"
              placeholder="请输入用于图像生成的 API Key"
              value={imageGenKey}
              onChange={(e) => setImageGenKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          onClick={handleSave}
          className="w-full h-12 text-base"
        >
          <Save className="w-5 h-5 mr-2" />
          保存修改
        </Button>
      </div>
    </div>
  )
}
