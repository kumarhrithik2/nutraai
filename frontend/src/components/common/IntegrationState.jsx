import { AlertCircle, CircleHelp, LoaderCircle } from 'lucide-react'

function IntegrationState({ state = 'unavailable', icon, title, description, className = '' }) {
  const StateIcon = state === 'loading' ? LoaderCircle : state === 'error' ? AlertCircle : icon || CircleHelp
  const role = state === 'loading' ? 'status' : state === 'error' ? 'alert' : 'region'
  const stateTitle = title || ({
    loading: 'Loading information',
    empty: 'No information available',
    error: 'Information could not be loaded',
    unavailable: 'Service unavailable',
  })[state]

  return (
    <section className={`dashboard-panel integration-state ${className}`} aria-labelledby="integration-state-title" aria-busy={state === 'loading'} role={role}>
      <span className={`integration-state__icon${state === 'loading' ? ' is-loading' : ''}`} aria-hidden="true"><StateIcon size={20} /></span>
      <h2 id="integration-state-title">{stateTitle}</h2>
      <p>{description}</p>
    </section>
  )
}

export default IntegrationState
