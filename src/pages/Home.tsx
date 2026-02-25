import { Link } from "react-router-dom"
import { FileText, Star, TrendingUp, Plus, Sparkles, FileQuestion } from "lucide-react"

export function Home() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来，运营官</h1>
        <p className="text-slate-500">以下是您今日的生成概况。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">已生成草稿</p>
          <p className="text-3xl font-bold text-slate-800">12</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-50 rounded-lg">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">收藏模板</p>
          <p className="text-3xl font-bold text-slate-800">5</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">本周效率提升</p>
          <p className="text-3xl font-bold text-green-600">35%</p>
        </div>
      </div>

      <div className="mb-10">
        <Link
          to="/workbench"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建生成任务
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">最近生成记录</h2>
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-100">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
              <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-1">暂无生成记录，快去开启你的第一次任务吧！</p>
            <Link
              to="/workbench"
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              立即体验
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
