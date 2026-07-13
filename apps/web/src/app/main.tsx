import ReactDOM from 'react-dom/client'
import { bootstrap } from './bootstrap'
import { AppRouter } from './providers/app-router'
import './styles/index.css'

bootstrap()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppRouter />
)