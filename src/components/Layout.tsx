import { NavLink, Outlet } from "react-router-dom"
import { Home, Wand2, FolderOpen, Settings, Sparkles } from "lucide-react"

const navItems = [
  { to: "/", icon: Home, label: "首页" },
  { to: "/workbench", icon: Wand2, label: "工作台" },
  { to: "/library", icon: FolderOpen, label: "素材库" },
  { to: "/settings", icon: Settings, label: "设置" },
]

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 p-4">
      <aside className="w-20 h-fit self-center flex flex-col items-center py-6 bg-white rounded-2xl shadow-sm m-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mb-6">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <nav>
          <ul className="flex flex-col gap-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  title={item.label}
                >
                  {({ isActive }) => (
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                        isActive
                          ? "bg-blue-600"
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <item.icon
                        className={`w-6 h-6 ${
                          isActive ? "text-white" : "text-slate-500"
                        }`}
                      />
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
