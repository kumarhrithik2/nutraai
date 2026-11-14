import { Component } from 'react'
class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Application screen failed to render.', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-screen" role="alert">
          <span className="eyebrow">NutraAI Labs</span>
          <h1>This screen could not be loaded.</h1>
          <p>Try returning to the workspace or reload the page. This will not remove any account data.</p>
          <div>
            <a className="button button--primary" href="/dashboard">Return to workspace</a>
            <button className="button button--outline" type="button" onClick={() => window.location.reload()}>Reload screen</button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
