import { JarvisGlobe } from '../../globe'

export default function AICore() {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-visible min-h-[400px]">
      <div className="w-full h-full max-w-[720px] max-h-[720px] flex items-center justify-center">
        <JarvisGlobe />
      </div>
    </div>
  )
}