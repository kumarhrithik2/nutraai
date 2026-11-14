import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function usePublicMotion() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const motion = gsap.matchMedia(root)
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const responsiveMotion = []
      const hero = root.querySelector('.hero-section')
      if (hero) {
        gsap.from(hero.querySelectorAll('.hero-kicker, h1 > span, .hero-description, .hero-actions, .hero-assurance'), {
          autoAlpha: 0,
          y: 20,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'all',
        })

        const heroParallax = gsap.matchMedia(root)
        responsiveMotion.push(heroParallax)
        heroParallax.add('(min-width: 761px)', () => {
          gsap.to(hero.querySelector('.hero-art'), {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 1.2,
            },
          })
        })
      }

      root.querySelectorAll('main > section:not(.hero-section), .public-page__content > section').forEach((section) => {
        const heading = section.querySelector('.section-heading, .catalog-heading, .contact-copy, .faq-intro')
        if (heading) {
          gsap.from(heading.children, {
            autoAlpha: 0,
            y: 20,
            duration: 0.72,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: { trigger: heading, start: 'top 84%', once: true },
          })
        }

        const cards = section.querySelectorAll('.step-card, .product-card, .membership-card, .testimonial-card, .process-step')
        if (cards.length) {
          gsap.from(cards, {
            autoAlpha: 0,
            y: 22,
            duration: 0.72,
            stagger: 0.11,
            ease: 'power2.out',
            scrollTrigger: { trigger: cards[0].parentElement, start: 'top 82%', once: true },
          })
        }

        const personalization = section.querySelector('.personalization-visual')
        if (personalization) {
          gsap.from(personalization, {
            autoAlpha: 0,
            x: 28,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 72%', once: true },
          })
        }

        const aiFeatures = section.querySelectorAll('.ai-feature')
        if (aiFeatures.length) {
          gsap.from(aiFeatures, {
            autoAlpha: 0,
            x: -18,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: { trigger: aiFeatures[0].parentElement, start: 'top 82%', once: true },
          })
        }
      })

      const journey = root.querySelector('.journey-story')
      const journeyVisual = journey?.querySelector('.journey-visual')
      const journeySteps = journey?.querySelector('.journey-story__steps')
      if (journey && journeyVisual && journeySteps) {
        const journeyMedia = gsap.matchMedia(root)
        responsiveMotion.push(journeyMedia)
        journeyMedia.add('(min-width: 900px)', () => {
          ScrollTrigger.create({
            trigger: journey,
            start: 'top 112px',
            endTrigger: journeySteps,
            end: 'bottom top',
            pin: journeyVisual,
            pinSpacing: false,
          })

          journey.querySelectorAll('.journey-story__step').forEach((step, index) => {
            const activateStep = () => {
              journeyVisual.dataset.active = String(index + 1)
              step.dataset.active = 'true'
            }
            const deactivateStep = () => {
              step.dataset.active = 'false'
            }

            ScrollTrigger.create({
              trigger: step,
              start: 'top center',
              end: 'bottom center',
              onEnter: activateStep,
              onEnterBack: activateStep,
              onLeave: deactivateStep,
              onLeaveBack: deactivateStep,
            })
          })
        })
      }

      return () => responsiveMotion.forEach((context) => context.revert())
    })

    const updateVisibility = () => root.setAttribute('data-motion-paused', String(document.hidden))
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      window.cancelAnimationFrame(refreshFrame)
      document.removeEventListener('visibilitychange', updateVisibility)
      motion.revert()
    }
  }, [])

  return rootRef
}

export default usePublicMotion
