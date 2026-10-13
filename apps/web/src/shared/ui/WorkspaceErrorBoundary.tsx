import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WorkspaceErrorBoundary] Uncaught exception in workspace module:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-0 flex-1 flex flex-col items-center justify-center font-mono text-white p-4 select-none">
          <div className="max-w-md w-full border border-[#FF0055]/30 bg-black/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FF0055]/10 border border-[#FF0055]/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#FF0055]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-black tracking-widest uppercase text-white">
                {this.props.fallbackTitle || 'Workspace Module Error'}
              </h2>
              <p className="text-[10px] text-white/60 font-mono leading-relaxed">
                {this.state.error?.message || 'An unexpected runtime error occurred within this view.'}
              </p>
            </div>

            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[#FF0055]/20 border border-[#FF0055]/40 hover:bg-[#FF0055]/30 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET & RETRY VIEW</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
