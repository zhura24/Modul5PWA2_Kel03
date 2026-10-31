import { MessageCircle, ShoppingBag, Trash2 } from 'lucide-react'

export default function DemoCartPage({ items, error, onRemove, onBrowse }) {
  const supportUrl = new URL('https://wa.me/6289517630870')
  supportUrl.searchParams.set('text', 'Halo, saya ingin bertanya tentang aplikasi.')

  return (
    <section className="page demo-cart">
      <h1 className="display">Demo cart</h1>
      <p className="lede">A local-only cart interface for demonstrating the app flow.</p>
      <p className="cart-demo-notice" role="note">
        Keranjang demo: item hanya tersimpan di browser ini dan tidak dapat digunakan untuk melakukan pemesanan.
      </p>
      <a
        className="btn btn--outline"
        href={supportUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={16} /> Hubungi via WhatsApp
      </a>
      {error && <p className="form-error" role="alert">{error}</p>}
      {items.length === 0 ? (
        <div className="state-box">
          <ShoppingBag size={28} />
          <p>Your demo cart is empty.</p>
          <button type="button" className="btn btn--outline" onClick={onBrowse}>Browse catalog</button>
        </div>
      ) : (
        <ul className="profile-item-list">
          {items.map((item) => (
            <li className="profile-item" key={item.id}>
              <div className="cart-item-name">
                <img src={item.image} alt="" width="56" height="44" loading="lazy" />
                <strong>{item.name}</strong>
              </div>
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.name} from demo cart`}
              >
                <Trash2 size={16} /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
