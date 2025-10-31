import './hero.css'

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__frame">
          <img className="hero__subject" src="https://images.unsplash.com/photo-1527443224154-c4ea4a88b2c1?q=80&w=1200&auto=format&fit=crop" alt="AI silhouette" />
          <h1 className="hero__title headline">
            WANT
            <br />
            INTEGRATION?
          </h1>
          <div className="hero__labels hero__labels--left">
            <span>VISA PREPAID CARD</span>
            <span>VIRTUAL ACCOUNT API</span>
          </div>
          <div className="hero__labels hero__labels--right">
            <span>MASTER PREPAID CARD</span>
            <span>LOYALTY API</span>
            <span>FULL DOCUMENT</span>
          </div>
        </div>
      </div>
    </section>
  )
}


