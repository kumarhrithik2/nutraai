import { ArrowUpRight, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Link className="brand brand--footer" to="/">
            <span className="brand-mark"><Leaf size={19} strokeWidth={2} /></span>
            <span>NutraAI <strong>Labs</strong></span>
          </Link>
          <p>Personalized preventive healthcare, thoughtfully powered by intelligence.</p>
        </div>
        <div className="footer-links">
          <div>
            <h3>Explore</h3>
            <a href="/#about">Our approach</a>
            <a href="/#products">Products</a>
            <a href="/#how-it-works">How it works</a>
          </div>
          <div>
            <h3>Get started</h3>
            <Link to="/assessment">Health assessment</Link>
            <Link to="/login">Member login</Link>
            <Link to="/contact">Contact us <ArrowUpRight size={13} /></Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NutraAI Labs. All rights reserved.</span>
        <span>Wellness information is educational and not medical advice.</span>
      </div>
    </footer>
  )
}

export default Footer
