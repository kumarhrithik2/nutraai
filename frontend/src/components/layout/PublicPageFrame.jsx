import Footer from './Footer.jsx'
import Header from './Header.jsx'
import AmbientParticles from '../effects/AmbientParticles.jsx'
import usePublicMotion from '../../hooks/usePublicMotion.js'

function PublicPageFrame({ children }) {
  const contentRef = usePublicMotion()

  return (
    <>
      <Header />
      <main className="public-page" ref={contentRef}>
        <div className="public-page__ambient" aria-hidden="true"><span /><span /><span /></div>
        <AmbientParticles />
        <div className="public-page__content">{children}</div>
      </main>
      <Footer />
    </>
  )
}

export default PublicPageFrame
