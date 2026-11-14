import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { products } from '../../data/products.js'

function Products() {
  return (
    <section className="section products-section" id="products">
      <div className="section-heading section-heading--split">
        <div>
          <span className="eyebrow">Thoughtfully selected</span>
          <h2>Everyday essentials,<br /><em>considered differently.</em></h2>
        </div>
        <p>Explore a growing collection of nutraceutical essentials. Product details and availability will be shared as the collection develops.</p>
      </div>
      {products.length ? <div className="products-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}><h3>{product.name}</h3><p>{product.description}</p></article>
        ))}
      </div> : <div className="catalog-unavailable"><h3>Our product catalogue is being prepared.</h3><p>Verified product details and availability will appear here once they are ready.</p></div>}
      <Link className="text-link products-more" to="/products">
        View product information <ArrowRight size={16} />
      </Link>
    </section>
  )
}

export default Products
