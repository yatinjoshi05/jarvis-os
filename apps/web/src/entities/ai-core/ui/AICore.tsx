import { JarvisGlobe } from '../../globe'

export default function AICore() {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-visible">
      <div className="w-[720px] h-[720px] max-w-full max-h-full">
        <JarvisGlobe />
      </div>
    </div>
  )
}