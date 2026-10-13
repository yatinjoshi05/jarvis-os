import Sidebar from '../../../../widgets/sidebar/ui/Sidebar'
import Topbar from '../../../../widgets/topbar/ui/Topbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex">

      {/* LEFT SIDEBAR */}
      <div className="w-[200px] h-full flex-shrink-0 border-r border-white/10">
        <Sidebar />
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">

        <Topbar />

        <main className="flex-1 overflow-hidden bg-black px-3 pt-2 pb-2">
          {children}
        </main>

      </div>

    </div>
  )
}